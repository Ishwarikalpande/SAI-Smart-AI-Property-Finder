"""
Standalone Verification Script for SAI Email OTP Verification System
Run directly: python verify_otp_flow.py
"""
import sys
import os
import secrets
from datetime import datetime, timedelta, timezone

# Ensure backend root is on path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.token import EmailOTP, RefreshToken, PasswordResetToken
from app.core.security import get_password_hash
from app.api.auth.routes import hash_email_otp

client = TestClient(app)

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

print("\n" + "=" * 65)
print("   SAI PROPERTY FINDER - COMPLETE EMAIL OTP SYSTEM VERIFICATION")
print("=" * 65 + "\n")

db = SessionLocal()
test_email = "test_verified_user@sai.in"

try:
    # ── STEP 0: SETUP TEST ACCOUNT ────────────────────────────────────
    print("[>] Step 0: Preparing Test Account...")
    db.query(EmailOTP).filter(EmailOTP.email == test_email).delete()
    user = db.query(User).filter(User.email == test_email).first()
    if not user:
        user = User(
            name="Ishwari Patil",
            email=test_email,
            password_hash=get_password_hash("InitialPass123!"),
            role=UserRole.BUYER,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    print(f"  [PASS] Test user ready: {user.name} ({user.email})")

    # ── STEP 1: UNREGISTERED EMAIL TEST ───────────────────────────────
    print("\n[>] Step 1: Testing Unregistered Email Rejection...")
    unregistered = "unregistered_9988@sai.in"
    res_unreg = client.post("/auth/otp/send", json={"email": unregistered})
    assert res_unreg.status_code == 404, f"Expected 404, got {res_unreg.status_code}"
    assert res_unreg.json()["detail"] == "No account found with this email address."
    print("  [PASS] Unregistered email correctly returned 404: 'No account found with this email address.'")

    # ── STEP 2: SEND OTP TEST ─────────────────────────────────────────
    print("\n[>] Step 2: Testing Send OTP Endpoint (/auth/otp/send & /auth/send-otp)...")
    res_send = client.post("/auth/otp/send", json={"email": test_email, "purpose": "forgot_password"})
    assert res_send.status_code == 200, f"Send failed: {res_send.text}"
    send_data = res_send.json()
    assert send_data["success"] is True
    assert "OTP sent successfully" in send_data["message"]
    assert send_data["cooldown_seconds"] == 60
    assert send_data["expires_in_minutes"] == 5
    assert "otp" not in send_data, "SECURITY VIOLATION: Plain OTP returned in API response!"
    print(f"  [PASS] API Response: {send_data['message']}")
    print("  [PASS] Security Check: OTP is NEVER exposed in API response.")

    # ── STEP 3: DATABASE VERIFICATION ─────────────────────────────────
    print("\n[>] Step 3: Verifying Database Security & Hash Storage...")
    otp_record = db.query(EmailOTP).filter(
        EmailOTP.email == test_email,
        EmailOTP.used == False
    ).order_by(EmailOTP.id.desc()).first()
    assert otp_record is not None, "OTP record not persisted in database"
    assert otp_record.user_id == user.id, "user_id not correctly linked"
    assert otp_record.verified is False, "verified flag should initially be False"
    assert otp_record.attempts == 0, "attempts should start at 0"
    assert len(otp_record.otp_hash) == 64, "OTP not stored as 64-char SHA256 hex digest"
    print(f"  [PASS] OTP stored as secure salted SHA-256 hash: {otp_record.otp_hash[:16]}... (length={len(otp_record.otp_hash)})")
    print(f"  [PASS] OTP linked to user_id={otp_record.user_id}, verified={otp_record.verified}, attempts={otp_record.attempts}")

    # ── STEP 4: 60-SECOND COOLDOWN TEST ───────────────────────────────
    print("\n[>] Step 4: Testing 60-Second Cooldown & Spam Protection...")
    res_cooldown = client.post("/auth/send-otp", json={"email": test_email})
    assert res_cooldown.status_code == 429, f"Expected 429, got {res_cooldown.status_code}"
    assert "Please wait" in res_cooldown.json()["detail"]
    print(f"  [PASS] Cooldown enforced: {res_cooldown.json()['detail']}")

    # ── STEP 5: WRONG OTP REJECTION & ATTEMPTS ────────────────────────
    print("\n[>] Step 5: Testing Wrong OTP Rejection & Attempt Limits...")
    res_wrong = client.post("/auth/verify-otp", json={"email": test_email, "otp": "000000"})
    assert res_wrong.status_code == 400
    assert res_wrong.json()["detail"] == "Invalid OTP. Please try again."
    db.refresh(otp_record)
    assert otp_record.attempts == 1
    print("  [PASS] Wrong OTP rejected: 'Invalid OTP. Please try again.' (attempt count incremented)")

    # ── STEP 6: VERIFY CORRECT OTP ────────────────────────────────────
    print("\n[>] Step 6: Testing Correct OTP Verification (/auth/verify-otp)...")
    # Set a known test OTP hash
    test_otp = "847291"
    otp_record.otp_hash = hash_email_otp(test_email, test_otp)
    db.commit()

    res_verify = client.post("/auth/verify-otp", json={"email": test_email, "otp": test_otp})
    assert res_verify.status_code == 200, f"Verify failed: {res_verify.text}"
    verify_data = res_verify.json()
    assert verify_data["success"] is True
    assert verify_data["message"] == "OTP verified successfully."
    assert "reset_token" in verify_data and verify_data["reset_token"]
    assert "access_token" in verify_data
    reset_token = verify_data["reset_token"]

    db.refresh(otp_record)
    assert otp_record.verified is True
    assert otp_record.used is True
    assert otp_record.used_at is not None
    print(f"  [PASS] Correct OTP accepted: '{verify_data['message']}'")
    print(f"  [PASS] Record marked verified=True, used=True, used_at={otp_record.used_at}")
    print(f"  [PASS] Issued secure password reset token: {reset_token[:16]}...")

    # ── STEP 7: REUSE PREVENTION ──────────────────────────────────────
    print("\n[>] Step 7: Testing OTP Reuse Prevention...")
    res_reuse = client.post("/auth/verify-otp", json={"email": test_email, "otp": test_otp})
    assert res_reuse.status_code == 400
    assert "No active OTP found" in res_reuse.json()["detail"]
    print("  [PASS] Reused OTP rejected: 'No active OTP found. Please request a new OTP.'")

    # ── STEP 8: COMPLETE PASSWORD RESET ───────────────────────────────
    print("\n[>] Step 8: Testing Password Reset Flow...")
    new_pw = "SuperSecureNewPassword2026!"
    res_reset = client.post("/auth/reset-password", json={
        "token": reset_token,
        "new_password": new_pw
    })
    assert res_reset.status_code == 200, f"Password reset failed: {res_reset.text}"
    print(f"  [PASS] Password reset successful: {res_reset.json()['message']}")

    # ── STEP 9: LOGIN WITH NEW PASSWORD ───────────────────────────────
    print("\n[>] Step 9: Testing Login with New Password...")
    res_login = client.post("/auth/login", json={
        "email": test_email,
        "password": new_pw
    })
    assert res_login.status_code == 200, f"Login failed: {res_login.text}"
    print("  [PASS] Login with new password succeeded!")

    print("\n" + "=" * 65)
    print("   [SUCCESS] ALL EMAIL OTP VERIFICATION SYSTEM TESTS PASSED 100%!")
    print("=" * 65 + "\n")

finally:
    # Cleanup test data
    db.query(EmailOTP).filter(EmailOTP.email == test_email).delete()
    user = db.query(User).filter(User.email == test_email).first()
    if user:
        db.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete()
        db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user.id).delete()
        db.delete(user)
    db.commit()
    db.close()
