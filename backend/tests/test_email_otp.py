import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import secrets
import hashlib

from app.main import app
from app.db.session import get_db
from app.models.token import EmailOTP, RefreshToken, PasswordResetToken
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.api.auth.routes import hash_email_otp

from unittest.mock import patch

client = TestClient(app)

@pytest.fixture(autouse=True)
def mock_smtp_dispatch():
    with patch("app.api.auth.routes.send_otp_email", return_value=(True, None)):
        yield

@pytest.fixture(scope="module")
def db_session():
    db: Session = next(get_db())
    yield db

def ensure_test_user(db: Session, email: str, name: str = "Test User"):
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user:
        user = User(
            name=name,
            email=email.lower(),
            password_hash=get_password_hash("InitialPassword123!"),
            role=UserRole.BUYER,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def cleanup_test_data(db: Session, email: str):
    db.query(EmailOTP).filter(EmailOTP.email == email.lower()).delete()
    user = db.query(User).filter(User.email == email.lower()).first()
    if user:
        db.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete()
        db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user.id).delete()
        db.delete(user)
    db.commit()

# ── 1. UNREGISTERED USER REJECTION ─────────────────────────────────────
def test_unregistered_email_rejected(db_session: Session):
    unregistered_email = f"nonexistent_{secrets.token_hex(4)}@sai.in"
    cleanup_test_data(db_session, unregistered_email)

    resp = client.post("/auth/otp/send", json={"email": unregistered_email})
    assert resp.status_code == 404
    assert resp.json()["detail"] == "No account found with this email address."

    # Direct /auth/send-otp alias
    resp_alias = client.post("/auth/send-otp", json={"email": unregistered_email})
    assert resp_alias.status_code == 404
    assert resp_alias.json()["detail"] == "No account found with this email address."

# ── 2. REGISTERED USER SENDS OTP & DATABASE RECORD ────────────────────
def test_send_otp_success_and_db_persistence(db_session: Session):
    test_email = "registered_buyer@sai.in"
    cleanup_test_data(db_session, test_email)
    user = ensure_test_user(db_session, test_email, "Registered Buyer")

    # Request OTP
    resp = client.post("/auth/otp/send", json={"email": test_email})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["success"] is True
    assert "OTP sent successfully" in data["message"]
    assert data["cooldown_seconds"] == 60
    assert data["expires_in_minutes"] == 5
    assert "otp" not in data  # CRITICAL: OTP is NEVER exposed

    # Verify record in database
    record = db_session.query(EmailOTP).filter(
        EmailOTP.email == test_email,
        EmailOTP.used == False
    ).order_by(EmailOTP.id.desc()).first()

    assert record is not None
    assert record.user_id == user.id
    assert record.otp_hash is not None
    assert record.attempts == 0
    exp = record.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    assert exp > datetime.now(timezone.utc)

# ── 3. RESEND COOLDOWN (60s) ──────────────────────────────────────────
def test_resend_cooldown_enforcement(db_session: Session):
    test_email = "cooldown_test@sai.in"
    cleanup_test_data(db_session, test_email)
    ensure_test_user(db_session, test_email, "Cooldown User")

    # First send: 200
    r1 = client.post("/auth/send-otp", json={"email": test_email})
    assert r1.status_code == 200

    # Immediate second send: 429
    r2 = client.post("/auth/send-otp", json={"email": test_email})
    assert r2.status_code == 429
    assert "Please wait" in r2.json()["detail"]

    # Immediate resend-otp endpoint: 429
    r3 = client.post("/auth/resend-otp", json={"email": test_email})
    assert r3.status_code == 429
    assert "Please wait" in r3.json()["detail"]

# ── 4. VERIFY CORRECT OTP (SUCCESS) ───────────────────────────────────
def test_correct_otp_verification(db_session: Session):
    test_email = "verify_success@sai.in"
    cleanup_test_data(db_session, test_email)
    user = ensure_test_user(db_session, test_email, "Verified User")

    # Manually insert known OTP into DB to test hash comparison
    test_otp_code = "782341"
    otp_hash = hash_email_otp(test_email, test_otp_code)
    now = datetime.now(timezone.utc)
    new_otp = EmailOTP(
        user_id=user.id,
        email=test_email,
        otp_hash=otp_hash,
        expires_at=now + timedelta(minutes=5),
        used=False,
        verified=False,
        attempts=0
    )
    db_session.add(new_otp)
    db_session.commit()

    # Call /auth/verify-otp
    resp = client.post("/auth/verify-otp", json={
        "email": test_email,
        "otp": test_otp_code
    })
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["success"] is True
    assert data["message"] == "OTP verified successfully."
    assert "reset_token" in data and len(data["reset_token"]) > 20
    assert "access_token" in data

    # Verify DB record is marked verified & used
    db_session.refresh(new_otp)
    assert new_otp.verified is True
    assert new_otp.used is True
    assert new_otp.used_at is not None

# ── 5. WRONG OTP REJECTION & ATTEMPTS INCREMENT ───────────────────────
def test_wrong_otp_rejection_and_attempt_limit(db_session: Session):
    test_email = "attempt_limit@sai.in"
    cleanup_test_data(db_session, test_email)
    user = ensure_test_user(db_session, test_email, "Attempt User")

    test_otp_code = "445566"
    otp_hash = hash_email_otp(test_email, test_otp_code)
    now = datetime.now(timezone.utc)
    new_otp = EmailOTP(
        user_id=user.id,
        email=test_email,
        otp_hash=otp_hash,
        expires_at=now + timedelta(minutes=5),
        used=False,
        verified=False,
        attempts=0
    )
    db_session.add(new_otp)
    db_session.commit()

    # Attempts 1 to 4 should return "Invalid OTP. Please try again."
    for i in range(1, 5):
        resp = client.post("/auth/verify-otp", json={
            "email": test_email,
            "otp": "000000"
        })
        assert resp.status_code == 400
        assert resp.json()["detail"] == "Invalid OTP. Please try again."
        db_session.refresh(new_otp)
        assert new_otp.attempts == i
        assert new_otp.used is False

    # 5th attempt invalidates the OTP
    resp5 = client.post("/auth/verify-otp", json={
        "email": test_email,
        "otp": "000000"
    })
    assert resp5.status_code == 400
    assert "Too many invalid attempts" in resp5.json()["detail"]

    db_session.refresh(new_otp)
    assert new_otp.attempts == 5
    assert new_otp.used is True

    # 6th attempt: already invalidated
    resp6 = client.post("/auth/verify-otp", json={
        "email": test_email,
        "otp": test_otp_code
    })
    assert resp6.status_code == 400
    assert "No active OTP found" in resp6.json()["detail"]

# ── 6. EXPIRED OTP REJECTION ──────────────────────────────────────────
def test_expired_otp_rejected(db_session: Session):
    test_email = "expired_test@sai.in"
    cleanup_test_data(db_session, test_email)
    user = ensure_test_user(db_session, test_email, "Expired User")

    test_otp_code = "998877"
    otp_hash = hash_email_otp(test_email, test_otp_code)
    past_time = datetime.now(timezone.utc) - timedelta(minutes=6)
    new_otp = EmailOTP(
        user_id=user.id,
        email=test_email,
        otp_hash=otp_hash,
        expires_at=past_time,
        used=False,
        verified=False,
        attempts=0
    )
    db_session.add(new_otp)
    db_session.commit()

    resp = client.post("/auth/verify-otp", json={
        "email": test_email,
        "otp": test_otp_code
    })
    assert resp.status_code == 400
    assert resp.json()["detail"] == "OTP has expired. Please request a new OTP."

    db_session.refresh(new_otp)
    assert new_otp.used is True

# ── 7. CANNOT REUSE VERIFIED OTP ──────────────────────────────────────
def test_cannot_reuse_used_otp(db_session: Session):
    test_email = "reuse_test@sai.in"
    cleanup_test_data(db_session, test_email)
    user = ensure_test_user(db_session, test_email, "Reuse User")

    test_otp_code = "332211"
    otp_hash = hash_email_otp(test_email, test_otp_code)
    now = datetime.now(timezone.utc)
    new_otp = EmailOTP(
        user_id=user.id,
        email=test_email,
        otp_hash=otp_hash,
        expires_at=now + timedelta(minutes=5),
        used=False,
        verified=False,
        attempts=0
    )
    db_session.add(new_otp)
    db_session.commit()

    # Verify first time -> 200
    r1 = client.post("/auth/verify-otp", json={"email": test_email, "otp": test_otp_code})
    assert r1.status_code == 200

    # Verify second time -> 400
    r2 = client.post("/auth/verify-otp", json={"email": test_email, "otp": test_otp_code})
    assert r2.status_code == 400
    assert "No active OTP found" in r2.json()["detail"]

# ── 8. COMPLETE FORGOT PASSWORD & PASSWORD RESET FLOW ─────────────────
def test_forgot_password_and_reset_flow(db_session: Session):
    test_email = "forgot_reset_flow@sai.in"
    cleanup_test_data(db_session, test_email)
    user = ensure_test_user(db_session, test_email, "Forgot User")

    # Step 1: Request OTP
    r1 = client.post("/auth/send-otp", json={"email": test_email})
    assert r1.status_code == 200
    assert r1.json()["success"] is True

    # Get the OTP from DB to simulate user receiving email
    db_otp = db_session.query(EmailOTP).filter(
        EmailOTP.email == test_email,
        EmailOTP.used == False
    ).order_by(EmailOTP.id.desc()).first()
    assert db_otp is not None

    # Step 2: Inject valid test OTP hash
    target_code = "889900"
    db_otp.otp_hash = hash_email_otp(test_email, target_code)
    db_session.commit()

    # Step 3: Verify OTP and receive reset_token
    r2 = client.post("/auth/verify-otp", json={
        "email": test_email,
        "otp": target_code
    })
    assert r2.status_code == 200
    verify_data = r2.json()
    assert verify_data["message"] == "OTP verified successfully."
    reset_token = verify_data["reset_token"]
    assert reset_token is not None

    # Step 4: Reset password using token
    new_password = "BrandNewSecurePassword2026!"
    r3 = client.post("/auth/reset-password", json={
        "token": reset_token,
        "new_password": new_password
    })
    assert r3.status_code == 200
    assert "successfully updated" in r3.json()["message"].lower()

    # Step 5: Log in with new password
    login_resp = client.post("/auth/login", json={
        "email": test_email,
        "password": new_password
    })
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

    # Cleanup
    cleanup_test_data(db_session, test_email)


# ── 9. REGISTRATION EMAIL OTP SEND & CONFLICT ─────────────────────────
def test_registration_otp_send_and_existing_conflict(db_session: Session):
    reg_email = f"new_register_{secrets.token_hex(4)}@sai.in"
    cleanup_test_data(db_session, reg_email)

    # Sending OTP for unregistered email with purpose="register" should SUCCEED
    res_send = client.post("/auth/otp/send", json={
        "email": reg_email,
        "purpose": "register",
        "name": "Priya Sharma"
    })
    assert res_send.status_code == 200, res_send.text
    send_data = res_send.json()
    assert send_data["success"] is True
    assert "OTP sent successfully" in send_data["message"]
    assert send_data["cooldown_seconds"] == 60

    # Ensure OTP record created in DB with user_id=None
    record = db_session.query(EmailOTP).filter(
        EmailOTP.email == reg_email,
        EmailOTP.used == False
    ).first()
    assert record is not None
    assert record.user_id is None

    # Now create an existing user with this email
    ensure_test_user(db_session, reg_email, "Existing User")

    # Second send with purpose="register" should return 409 Conflict
    res_conflict = client.post("/auth/otp/send", json={
        "email": reg_email,
        "purpose": "register"
    })
    assert res_conflict.status_code == 409
    assert "already exists" in res_conflict.json()["detail"].lower()

    cleanup_test_data(db_session, reg_email)


# ── 10. REGISTER WITH OTP VERIFICATION (SUCCESS & FAILURE) ────────────
def test_register_with_otp_verification_success_and_failure(db_session: Session):
    signup_email = f"signup_verified_{secrets.token_hex(4)}@sai.in"
    cleanup_test_data(db_session, signup_email)

    # 1. Send OTP for registration
    r_send = client.post("/auth/otp/send", json={"email": signup_email, "purpose": "register"})
    assert r_send.status_code == 200

    # 2. Inject known valid OTP into DB
    valid_otp = "654321"
    otp_record = db_session.query(EmailOTP).filter(
        EmailOTP.email == signup_email,
        EmailOTP.used == False
    ).order_by(EmailOTP.id.desc()).first()
    assert otp_record is not None
    otp_record.otp_hash = hash_email_otp(signup_email, valid_otp)
    db_session.commit()

    # 3. Attempt register with WRONG OTP -> 400 Bad Request
    r_wrong = client.post("/auth/register", json={
        "name": "Aarav Patel",
        "email": signup_email,
        "password": "SecurePassword123!",
        "role": "buyer",
        "otp": "000000"
    })
    assert r_wrong.status_code == 400
    assert "Invalid OTP" in r_wrong.json()["detail"]

    # 4. Attempt register with CORRECT OTP -> 201 Created
    r_success = client.post("/auth/register", json={
        "name": "Aarav Patel",
        "email": signup_email,
        "password": "SecurePassword123!",
        "role": "buyer",
        "phone": "+91 98765 11111",
        "otp": valid_otp
    })
    assert r_success.status_code == 201, r_success.text
    user_data = r_success.json()
    assert user_data["email"] == signup_email
    assert user_data["name"] == "Aarav Patel"

    # Verify OTP is marked used and linked to created user
    db_session.refresh(otp_record)
    assert otp_record.used is True
    assert otp_record.verified is True
    assert otp_record.user_id == user_data["id"]

    cleanup_test_data(db_session, signup_email)


# ── 11. VERIFY OTP AUTO-CREATION (NEW USER PROVISIONING) ───────────────
def test_verify_otp_direct_registration_provisioning(db_session: Session):
    direct_email = f"otp_direct_{secrets.token_hex(4)}@sai.in"
    cleanup_test_data(db_session, direct_email)

    # 1. Dispatch OTP
    client.post("/auth/otp/send", json={"email": direct_email, "purpose": "register"})

    # 2. Inject known OTP
    direct_otp = "112233"
    db_otp = db_session.query(EmailOTP).filter(
        EmailOTP.email == direct_email,
        EmailOTP.used == False
    ).order_by(EmailOTP.id.desc()).first()
    db_otp.otp_hash = hash_email_otp(direct_email, direct_otp)
    db_session.commit()

    # 3. Verify OTP directly via /auth/verify-otp with role and name
    res_verify = client.post("/auth/verify-otp", json={
        "email": direct_email,
        "otp": direct_otp,
        "role": "agent",
        "name": "Vikram Singh"
    })
    assert res_verify.status_code == 200, res_verify.text
    data = res_verify.json()
    assert data["success"] is True
    assert data["role"] == "agent"
    assert data["email"] == direct_email
    assert "access_token" in data
    assert "refresh_token" in data

    # Verify user exists in database with Agent profile
    created_user = db_session.query(User).filter(User.email == direct_email).first()
    assert created_user is not None
    assert created_user.role == UserRole.AGENT
    assert created_user.name == "Vikram Singh"

    cleanup_test_data(db_session, direct_email)

