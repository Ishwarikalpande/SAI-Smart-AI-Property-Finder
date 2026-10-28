import pytest
import secrets
from unittest.mock import patch, AsyncMock
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import get_db
from app.models.user import User, UserRole, BuyerProfile, SellerProfile, AgentProfile, BuilderProfile
from app.models.token import EmailOTP, RefreshToken
from app.core.security import get_password_hash
from app.api.auth.routes import hash_email_otp
from app.core.config import settings

client = TestClient(app)


@pytest.fixture(autouse=True)
def mock_smtp():
    with patch("app.api.auth.routes.send_otp_email", return_value=(True, None)):
        yield


@pytest.fixture(scope="module")
def db():
    session: Session = next(get_db())
    yield session


def cleanup_user(db: Session, email: str):
    db.query(EmailOTP).filter(EmailOTP.email == email.lower()).delete()
    user = db.query(User).filter(User.email == email.lower()).first()
    if user:
        db.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete()
        db.delete(user)
    db.commit()


# ── 1. PUBLIC OAUTH CONFIG ENDPOINT ──────────────────────────────────
def test_oauth_config_endpoint():
    resp = client.get("/api/auth/oauth/config")
    assert resp.status_code == 200
    data = resp.json()
    assert "google_configured" in data
    assert "google_client_id" in data
    assert "apple_configured" in data
    assert "apple_client_id" in data
    assert "require_oauth_otp" in data
    # Ensure no secrets leaked
    assert "client_secret" not in data
    assert "private_key" not in data


# ── 2. GOOGLE NEW USER REGISTRATION WITH ROLE PRESERVATION ───────────
def test_google_new_user_registration(db: Session):
    test_email = f"google_new_{secrets.token_hex(4)}@gmail.com"
    google_sub = f"sub_google_{secrets.token_hex(8)}"
    cleanup_user(db, test_email)

    mock_claims = {
        "sub": google_sub,
        "email": test_email,
        "name": "Priya Google",
        "picture": "https://example.com/priya.png",
        "email_verified": True,
        "provider": "google",
    }

    with patch("app.api.auth.routes.verify_google_id_token", new=AsyncMock(return_value=mock_claims)):
        resp = client.post("/api/auth/google", json={
            "id_token": "valid_google_jwt_token",
            "role": "seller",
        })

    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["success"] is True
    assert data["role"] == "seller"
    assert data["email"] == test_email
    assert "access_token" in data

    # Verify database persistence
    user = db.query(User).filter(User.email == test_email).first()
    assert user is not None
    assert user.role == UserRole.SELLER
    assert user.google_id == google_sub
    assert user.oauth_provider == "google"
    assert user.seller_profile is not None

    cleanup_user(db, test_email)


# ── 3. GOOGLE PREVENTS ROLE ESCALATION (SUPER_ADMIN REJECTED) ─────────
def test_google_prevents_role_escalation(db: Session):
    test_email = f"escalate_{secrets.token_hex(4)}@gmail.com"
    google_sub = f"sub_{secrets.token_hex(8)}"
    cleanup_user(db, test_email)

    mock_claims = {
        "sub": google_sub,
        "email": test_email,
        "name": "Attacker",
        "email_verified": True,
        "provider": "google",
    }

    with patch("app.api.auth.routes.verify_google_id_token", new=AsyncMock(return_value=mock_claims)):
        resp = client.post("/api/auth/google", json={
            "id_token": "valid_token",
            "role": "super_admin",  # Unauthorized role escalation attempt
        })

    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "buyer"  # Normalized to buyer, not super_admin

    cleanup_user(db, test_email)


# ── 4. GOOGLE EXISTING USER SIGNS IN & PRESERVES REGISTERED ROLE ──────
def test_google_existing_user_preserves_role(db: Session):
    test_email = f"existing_agent_{secrets.token_hex(4)}@gmail.com"
    google_sub = f"sub_{secrets.token_hex(8)}"
    cleanup_user(db, test_email)

    # Pre-create user with AGENT role
    agent_user = User(
        name="Existing Agent",
        email=test_email,
        password_hash=get_password_hash("Secret123!"),
        role=UserRole.AGENT,
        google_id=google_sub,
        oauth_provider="google",
        oauth_id=google_sub,
        is_active=True,
    )
    db.add(agent_user)
    db.commit()
    db.refresh(agent_user)
    db.add(AgentProfile(user_id=agent_user.id))
    db.commit()

    mock_claims = {
        "sub": google_sub,
        "email": test_email,
        "name": "Existing Agent",
        "email_verified": True,
        "provider": "google",
    }

    # Attempt sign-in while tampering with role="buyer" in frontend request
    with patch("app.api.auth.routes.verify_google_id_token", new=AsyncMock(return_value=mock_claims)):
        resp = client.post("/api/auth/google", json={
            "id_token": "valid_token",
            "role": "buyer",  # Tampered frontend role
        })

    assert resp.status_code == 200
    data = resp.json()
    # The existing user's registered role (agent) must be preserved!
    assert data["role"] == "agent"

    cleanup_user(db, test_email)


# ── 5. APPLE SIGN-IN WITH PRIVATE RELAY EMAIL & FIRST AUTH NAME ───────
def test_apple_sign_in_private_relay(db: Session):
    relay_email = f"user_{secrets.token_hex(4)}@privaterelay.appleid.com"
    apple_sub = f"apple_sub_{secrets.token_hex(8)}"
    cleanup_user(db, relay_email)

    mock_claims = {
        "sub": apple_sub,
        "email": relay_email,
        "is_private_email": True,
        "name": "Apple Seeker",
        "email_verified": True,
        "provider": "apple",
    }

    with patch("app.api.auth.routes.verify_apple_identity_token", new=AsyncMock(return_value=mock_claims)):
        resp = client.post("/api/auth/apple", json={
            "identity_token": "valid_apple_jwt",
            "role": "builder",
            "email": relay_email,
            "name": "Apple Seeker",
        })

    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["role"] == "builder"
    assert data["email"] == relay_email

    # Check database
    user = db.query(User).filter(User.apple_id == apple_sub).first()
    assert user is not None
    assert user.apple_private_relay_email == relay_email
    assert user.builder_profile is not None

    cleanup_user(db, relay_email)


# ── 6. APPLE SUBSEQUENT LOGIN (EMAIL NOT SENT BY APPLE) ───────────────
def test_apple_subsequent_login_without_email(db: Session):
    existing_email = f"subsequent_apple_{secrets.token_hex(4)}@privaterelay.appleid.com"
    apple_sub = f"apple_sub_{secrets.token_hex(8)}"
    cleanup_user(db, existing_email)

    # Pre-register user with apple_id
    user = User(
        name="Returning Apple User",
        email=existing_email,
        password_hash=get_password_hash("Pass123!"),
        role=UserRole.BUYER,
        apple_id=apple_sub,
        oauth_provider="apple",
        oauth_id=apple_sub,
        is_active=True,
    )
    db.add(user)
    db.commit()

    # On subsequent authorizations, Apple only sends sub in identity_token (email is None)
    mock_claims = {
        "sub": apple_sub,
        "email": None,
        "is_private_email": False,
        "name": "Apple User",
        "email_verified": True,
        "provider": "apple",
    }

    with patch("app.api.auth.routes.verify_apple_identity_token", new=AsyncMock(return_value=mock_claims)):
        resp = client.post("/api/auth/apple", json={
            "identity_token": "subsequent_apple_token_without_email",
            "role": "buyer",
        })

    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == existing_email
    assert data["user_id"] == user.id

    cleanup_user(db, existing_email)


# ── 7. SECURE ACCOUNT LINKING (PREVENTS SILENT MERGING) ───────────────
def test_secure_account_linking_requires_verification(db: Session):
    shared_email = f"shared_{secrets.token_hex(4)}@sai.in"
    cleanup_user(db, shared_email)

    # 1. User originally created account with password
    password_user = User(
        name="Original Password User",
        email=shared_email,
        password_hash=get_password_hash("MySecretPassword123!"),
        role=UserRole.BUYER,
        is_active=True,
    )
    db.add(password_user)
    db.commit()

    google_sub = f"new_google_sub_{secrets.token_hex(8)}"
    mock_claims = {
        "sub": google_sub,
        "email": shared_email,
        "name": "Google User",
        "email_verified": True,
        "provider": "google",
    }

    # 2. User tries to sign in with Google using matching email
    with patch("app.api.auth.routes.verify_google_id_token", new=AsyncMock(return_value=mock_claims)):
        resp = client.post("/api/auth/google", json={
            "id_token": "valid_token",
            "role": "buyer",
        })

    # MUST NOT automatically log in or overwrite account!
    assert resp.status_code == 200
    data = resp.json()
    assert data["requires_linking"] is True
    assert "link_token" in data
    link_token = data["link_token"]

    # 3. Verify user in database is still NOT linked yet
    db.refresh(password_user)
    assert password_user.google_id is None

    # 4. Attempt confirm link with wrong OTP
    resp_wrong = client.post("/api/auth/oauth/link-confirm", json={
        "link_token": link_token,
        "otp": "000000",
    })
    assert resp_wrong.status_code == 400

    # 5. Confirm link using original account's password
    resp_pw = client.post("/api/auth/oauth/link-confirm", json={
        "link_token": link_token,
        "password": "MySecretPassword123!",
    })
    assert resp_pw.status_code == 200
    assert resp_pw.json()["success"] is True

    # 6. Verify Google identity is now securely linked
    db.refresh(password_user)
    assert password_user.google_id == google_sub

    cleanup_user(db, shared_email)


# ── 8. EMAIL OTP POLICY ENFORCEMENT & VERIFICATION ────────────────────
def test_oauth_email_otp_policy_enforcement(db: Session):
    test_email = f"otp_policy_{secrets.token_hex(4)}@gmail.com"
    google_sub = f"sub_otp_{secrets.token_hex(8)}"
    cleanup_user(db, test_email)

    mock_claims = {
        "sub": google_sub,
        "email": test_email,
        "name": "OTP Policy User",
        "email_verified": True,
        "provider": "google",
    }

    # Temporarily enable REQUIRE_OAUTH_EMAIL_OTP policy
    original_policy = settings.REQUIRE_OAUTH_EMAIL_OTP
    settings.REQUIRE_OAUTH_EMAIL_OTP = True

    try:
        with patch("app.api.auth.routes.verify_google_id_token", new=AsyncMock(return_value=mock_claims)):
            resp = client.post("/api/auth/google", json={
                "id_token": "valid_token",
                "role": "buyer",
            })

        assert resp.status_code == 200
        data = resp.json()
        assert data["requires_otp"] is True
        assert "temp_token" in data
        assert data.get("access_token") is None  # Access token blocked until OTP verified!
        temp_token = data["temp_token"]

        # 1. Invalid OTP rejected
        resp_bad = client.post("/api/auth/oauth/verify-otp", json={
            "temp_token": temp_token,
            "otp": "000000",
        })
        assert resp_bad.status_code == 400
        assert "Invalid OTP" in resp_bad.json()["detail"]

        # 2. Resend OTP cooldown test (immediate resend -> 429)
        resp_cooldown = client.post("/api/auth/oauth/resend-otp", json={
            "temp_token": temp_token,
        })
        assert resp_cooldown.status_code == 429

        # 3. Obtain OTP from database and verify successfully
        record = db.query(EmailOTP).filter(
            EmailOTP.email == test_email,
            EmailOTP.used == False
        ).first()
        assert record is not None

        # Test with known hash
        test_otp = "852963"
        record.otp_hash = hash_email_otp(test_email, test_otp)
        db.commit()

        resp_ok = client.post("/api/auth/oauth/verify-otp", json={
            "temp_token": temp_token,
            "otp": test_otp,
        })
        assert resp_ok.status_code == 200
        data_ok = resp_ok.json()
        assert data_ok["success"] is True
        assert "access_token" in data_ok
        assert data_ok["email"] == test_email

    finally:
        settings.REQUIRE_OAUTH_EMAIL_OTP = original_policy
        cleanup_user(db, test_email)


# ── 9. ALL FOUR ACCOUNT ROLES REGISTER AND PERSIST THROUGH OAUTH ──────
@pytest.mark.parametrize("role_name,expected_enum,profile_attr", [
    ("buyer", UserRole.BUYER, "buyer_profile"),
    ("seller", UserRole.SELLER, "seller_profile"),
    ("agent", UserRole.AGENT, "agent_profile"),
    ("builder", UserRole.BUILDER, "builder_profile"),
])
def test_all_four_roles_oauth_onboarding(db: Session, role_name, expected_enum, profile_attr):
    test_email = f"role_{role_name}_{secrets.token_hex(3)}@gmail.com"
    google_sub = f"sub_{secrets.token_hex(6)}"
    cleanup_user(db, test_email)

    mock_claims = {
        "sub": google_sub,
        "email": test_email,
        "name": f"Test {role_name.title()}",
        "email_verified": True,
        "provider": "google",
    }

    with patch("app.api.auth.routes.verify_google_id_token", new=AsyncMock(return_value=mock_claims)):
        resp = client.post("/api/auth/google", json={
            "id_token": "valid_token",
            "role": role_name,
        })

    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == role_name

    user = db.query(User).filter(User.email == test_email).first()
    assert user is not None
    assert user.role == expected_enum
    assert getattr(user, profile_attr) is not None

    cleanup_user(db, test_email)
