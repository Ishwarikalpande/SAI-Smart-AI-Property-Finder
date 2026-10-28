import time
import logging
from typing import Optional, Dict, Any, Tuple
import httpx
from fastapi import HTTPException, status
from jose import jwt, jwk
from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.models.user import UserRole

logger = logging.getLogger("sai-backend")

# Cached JWKS keys with TTL
_GOOGLE_JWKS_CACHE: Dict[str, Any] = {"keys": None, "expires_at": 0}
_APPLE_JWKS_CACHE: Dict[str, Any] = {"keys": None, "expires_at": 0}

ALLOWED_OAUTH_ROLES = {
    UserRole.BUYER.value: UserRole.BUYER,
    UserRole.SELLER.value: UserRole.SELLER,
    UserRole.AGENT.value: UserRole.AGENT,
    UserRole.BUILDER.value: UserRole.BUILDER,
}


def validate_oauth_role(role_str: Optional[str]) -> UserRole:
    """
    Validates and sanitizes account role for OAuth onboarding.
    Prevents unauthorized role escalation to super_admin.
    """
    if not role_str:
        return UserRole.BUYER
    clean = role_str.strip().lower()
    if clean in ALLOWED_OAUTH_ROLES:
        return ALLOWED_OAUTH_ROLES[clean]
    # Default to buyer if invalid or disallowed role is submitted
    return UserRole.BUYER


def mask_email(email: str) -> str:
    """Masks an email for safe display (e.g., j***e@domain.com)."""
    if not email or "@" not in email:
        return email
    parts = email.split("@")
    name, domain = parts[0], parts[1]
    if len(name) <= 2:
        masked_name = name[0] + "*"
    else:
        masked_name = name[0] + "*" * (len(name) - 2) + name[-1]
    return f"{masked_name}@{domain}"


async def get_google_jwks() -> list:
    """Fetches and caches Google's public JWKS certificates."""
    now = time.time()
    if _GOOGLE_JWKS_CACHE["keys"] and now < _GOOGLE_JWKS_CACHE["expires_at"]:
        return _GOOGLE_JWKS_CACHE["keys"]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get("https://www.googleapis.com/oauth2/v3/certs")
            resp.raise_for_status()
            data = resp.json()
            keys = data.get("keys", [])
            _GOOGLE_JWKS_CACHE["keys"] = keys
            _GOOGLE_JWKS_CACHE["expires_at"] = now + 3600  # cache 1 hour
            return keys
    except Exception as e:
        logger.error(f"[OAuthService] Failed to fetch Google JWKS: {e}")
        if _GOOGLE_JWKS_CACHE["keys"]:
            return _GOOGLE_JWKS_CACHE["keys"]
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to reach Google authentication servers. Please try again."
        )


async def get_apple_jwks() -> list:
    """Fetches and caches Apple's public JWKS keys."""
    now = time.time()
    if _APPLE_JWKS_CACHE["keys"] and now < _APPLE_JWKS_CACHE["expires_at"]:
        return _APPLE_JWKS_CACHE["keys"]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get("https://appleid.apple.com/auth/keys")
            resp.raise_for_status()
            data = resp.json()
            keys = data.get("keys", [])
            _APPLE_JWKS_CACHE["keys"] = keys
            _APPLE_JWKS_CACHE["expires_at"] = now + 3600  # cache 1 hour
            return keys
    except Exception as e:
        logger.error(f"[OAuthService] Failed to fetch Apple JWKS: {e}")
        if _APPLE_JWKS_CACHE["keys"]:
            return _APPLE_JWKS_CACHE["keys"]
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to reach Apple authentication servers. Please try again."
        )


async def verify_google_id_token(id_token: str) -> Dict[str, Any]:
    """
    Validates a Google ID Token (from Google Identity Services or OAuth code exchange).
    Checks signature, issuer, audience, and expiration.
    Returns verified claims: sub, email, name, picture, email_verified.
    """
    client_id = (settings.GOOGLE_CLIENT_ID or "").strip()
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Sign-In is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env."
        )

    # First attempt: Verify directly with Google's official tokeninfo endpoint
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token}
            )
            if resp.status_code == 200:
                payload = resp.json()
                aud = payload.get("aud")
                if client_id and aud != client_id:
                    logger.error(f"[OAuthService] Google aud mismatch: got {aud}, expected {client_id}")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Google token was not issued for this application."
                    )
                email = payload.get("email")
                if not email:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Google account did not provide a verified email address."
                    )
                sub = payload.get("sub")
                if not sub:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Google account did not provide a unique subject identifier."
                    )
                return {
                    "sub": sub,
                    "email": email.strip().lower(),
                    "email_verified": payload.get("email_verified") in [True, "true", "True", "1"],
                    "name": payload.get("name") or email.split("@")[0].title(),
                    "picture": payload.get("picture"),
                    "provider": "google",
                }
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"[OAuthService] Google tokeninfo request failed, attempting local JWKS verification: {e}")

    # Fallback attempt: Local JWKS cryptographic validation
    try:
        keys = await get_google_jwks()
        headers = jwt.get_unverified_header(id_token)
        kid = headers.get("kid")
        matching_key = next((k for k in keys if k.get("kid") == kid), None)
        if not matching_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google token verification failed: key ID not found in Google certificates."
            )

        payload = jwt.decode(
            id_token,
            matching_key,
            algorithms=["RS256"],
            audience=client_id or None,
            issuer=["https://accounts.google.com", "accounts.google.com"]
        )
        email = payload.get("email")
        sub = payload.get("sub")
        if not email or not sub:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google token does not contain required user identity claims."
            )

        return {
            "sub": sub,
            "email": email.strip().lower(),
            "email_verified": payload.get("email_verified") in [True, "true", "True", "1"],
            "name": payload.get("name") or email.split("@")[0].title(),
            "picture": payload.get("picture"),
            "provider": "google",
        }
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"[OAuthService] Google token signature verification failed: {err}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google authentication response. Signature verification failed."
        )


async def exchange_google_code(code: str, redirect_uri: Optional[str] = None) -> Dict[str, Any]:
    """
    Exchanges an OAuth 2.0 authorization code with Google token endpoint.
    """
    client_id = (settings.GOOGLE_CLIENT_ID or "").strip()
    client_secret = (settings.GOOGLE_CLIENT_SECRET or "").strip()
    if not client_id or not client_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Sign-In is not fully configured (missing Client ID or Client Secret)."
        )

    uri = redirect_uri or settings.GOOGLE_REDIRECT_URI

    async with httpx.AsyncClient(timeout=12.0) as client:
        resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": uri,
                "grant_type": "authorization_code",
            }
        )
        if resp.status_code != 200:
            logger.error(f"[OAuthService] Google code exchange failed ({resp.status_code}): {resp.text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange authorization code with Google. The code may be expired or already used."
            )
        data = resp.json()
        id_token = data.get("id_token")
        if not id_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google did not return an identity token."
            )
        return await verify_google_id_token(id_token)


async def verify_apple_identity_token(
    identity_token: str,
    provided_email: Optional[str] = None,
    provided_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Validates Apple identity token (JWT) against Apple's official JWKS.
    Supports regular and Apple Private Relay emails (@privaterelay.appleid.com).
    Handles subsequent sign-ins where Apple only transmits the unique sub identifier.
    """
    client_id = (settings.APPLE_CLIENT_ID or "").strip()
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Apple Sign-In is not configured. Please set APPLE_CLIENT_ID, APPLE_TEAM_ID, and credentials in backend/.env."
        )

    try:
        keys = await get_apple_jwks()
        unverified_headers = jwt.get_unverified_header(identity_token)
        kid = unverified_headers.get("kid")

        matching_key = next((k for k in keys if k.get("kid") == kid), None)
        if not matching_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Apple identity token verification failed: public key not found in Apple JWKS."
            )

        payload = jwt.decode(
            identity_token,
            matching_key,
            algorithms=["RS256"],
            audience=client_id or None,
            issuer="https://appleid.apple.com"
        )

        sub = payload.get("sub")
        if not sub:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Apple identity token does not contain a subject identifier."
            )

        # Apple may include email in payload, or it may have been provided in the authorization user object on 1st login
        email = payload.get("email") or provided_email
        if email:
            email = email.strip().lower()

        is_private = False
        if email and "privaterelay.appleid.com" in email:
            is_private = True
        elif payload.get("is_private_email") in [True, "true", "True"]:
            is_private = True

        name = provided_name or (email.split("@")[0].title() if email else "Apple User")

        return {
            "sub": sub,
            "email": email,
            "is_private_email": is_private,
            "email_verified": payload.get("email_verified") in [True, "true", "True", "1"],
            "name": name,
            "provider": "apple",
        }
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"[OAuthService] Apple token verification failed: {err}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Apple identity token. Signature verification failed."
        )


# ── TEMPORARY TOKENS FOR OTP & ACCOUNT LINKING FLOWS ─────────────────

def create_oauth_temp_token(user_id: int, email: str, role: str) -> str:
    """
    Creates short-lived temporary token (5 minutes) for multi-factor Email OTP verification
    after successful third-party OAuth authentication.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=5)
    payload = {
        "sub": str(user_id),
        "email": email.strip().lower(),
        "role": role,
        "type": "oauth_pending_otp",
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_oauth_temp_token(token_str: str) -> Dict[str, Any]:
    """Validates temporary OAuth OTP session token."""
    try:
        payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "oauth_pending_otp":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token type.")
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="OAuth verification session has expired. Please sign in with Google or Apple again."
        )


def create_oauth_link_token(user_id: int, provider: str, provider_id: str, email: str) -> str:
    """
    Creates secure signed link token (15 minutes) for linking existing accounts.
    Ensures safe linking procedure without automatically merging disparate logins.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    payload = {
        "user_id": user_id,
        "provider": provider,
        "provider_id": provider_id,
        "email": email.strip().lower(),
        "type": "oauth_account_link",
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_oauth_link_token(token_str: str) -> Dict[str, Any]:
    """Validates secure account linking token."""
    try:
        payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "oauth_account_link":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token type for account linking.")
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account linking session expired. Please start the sign-in again."
        )
