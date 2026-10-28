from typing import List, Union, Optional
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "SAI - Smart AI Property Finder"
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api"
    DEBUG: bool = True
    ALLOW_ANY_LOGIN: bool = True

    # Security
    SECRET_KEY: str = "sai_super_secret_jwt_key_for_development_purposes_only_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Database URL (SQLite default for local dev, PostgreSQL for production)
    DATABASE_URL: str = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'sai.db').replace(os.sep, '/')}"
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if v and v.startswith("sqlite:///"):
            raw_path = v.replace("sqlite:///", "")
            if not os.path.isabs(raw_path):
                backend_base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                clean_rel = raw_path.lstrip("./").lstrip(".\\")
                abs_path = os.path.normpath(os.path.join(backend_base, clean_rel)).replace(os.sep, "/")
                return f"sqlite:///{abs_path}"
        return v

    # Redis URL
    REDIS_URL: str = "redis://localhost:6379/0"

    # Storage
    STORAGE_BACKEND: str = "local"
    LOCAL_UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "ap-south-1"
    AWS_S3_BUCKET: str = "sai-property-media"

    # AI - Qwen3 Integration
    LLM_PROVIDER: str = "ollama"  # "ollama", "openai", "local"
    QWEN_BASE_URL: str = "http://localhost:11434"
    QWEN_MODEL: str = "qwen2.5:7b"
    QWEN_API_KEY: str = ""
    VECTOR_DIMENSION: int = 384

    # Voice / Speech-to-Text
    VOICE_PROVIDER: str = "whisper"  # "whisper", "faster-whisper", "web_speech"
    WHISPER_MODEL_SIZE: str = "base"

    # OAuth - Google
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:5173/auth/google/callback"

    # OAuth - Apple
    APPLE_CLIENT_ID: str = ""
    APPLE_TEAM_ID: str = ""
    APPLE_KEY_ID: str = ""
    APPLE_PRIVATE_KEY: str = ""
    APPLE_REDIRECT_URI: str = "http://localhost:5173/auth/apple/callback"

    # OAuth Security Policy
    REQUIRE_OAUTH_EMAIL_OTP: bool = False

    # SMTP / Email for Verification OTP & Password Reset
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "SAI Property Finder"
    SMTP_FROM: str = "noreply@sai-platform.in"

    @property
    def sender_email(self) -> str:
        return self.SMTP_FROM_EMAIL or self.SMTP_FROM or "noreply@sai-platform.in"

    @property
    def sender_header(self) -> str:
        addr = self.sender_email
        name = self.SMTP_FROM_NAME or "SAI Property Finder"
        return f"{name} <{addr}>"

    # Super Admin 2FA
    ADMIN_2FA_ISSUER: str = "SAI Admin Platform"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("["):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Safety check for production environment
if settings.ENVIRONMENT == "production" and "development" in settings.SECRET_KEY.lower():
    raise RuntimeError("CRITICAL ERROR: Production environment detected with insecure development SECRET_KEY!")
