import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class UserRole(str, enum.Enum):
    BUYER = "buyer"
    SELLER = "seller"   # Displayed as "Owner" in frontend
    AGENT = "agent"
    BUILDER = "builder"
    SUPER_ADMIN = "super_admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, values_callable=lambda x: [e.value for e in x]), nullable=False, default=UserRole.BUYER)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # 2FA (TOTP)
    totp_secret = Column(String(100), nullable=True)
    is_totp_enabled = Column(Boolean, default=False, nullable=False)
    totp_recovery_codes = Column(JSON, default=list, nullable=True)

    # Password Reset
    password_reset_token_hash = Column(String(255), nullable=True)
    password_reset_expires_at = Column(DateTime(timezone=True), nullable=True)

    # OAuth
    oauth_provider = Column(String(50), nullable=True)  # "google", "apple"
    oauth_id = Column(String(100), nullable=True, index=True)
    google_id = Column(String(100), nullable=True, index=True)
    apple_id = Column(String(100), nullable=True, index=True)
    apple_private_relay_email = Column(String(255), nullable=True)
    is_email_verified = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    buyer_profile = relationship("BuyerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    seller_profile = relationship("SellerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    agent_profile = relationship("AgentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    builder_profile = relationship("BuilderProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

    owned_properties = relationship("Property", foreign_keys="[Property.owner_id]", back_populates="owner")
    agent_properties = relationship("Property", foreign_keys="[Property.agent_id]", back_populates="agent")
    builder_projects = relationship("Project", back_populates="builder")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class BuyerProfile(Base):
    __tablename__ = "buyer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    preferred_city = Column(String(100), default="Pune")
    preferred_language = Column(String(10), default="en")
    budget_min = Column(Float, nullable=True)
    budget_max = Column(Float, nullable=True)
    preferred_bhk = Column(Integer, nullable=True)
    accessibility_mode = Column(Boolean, default=False)

    user = relationship("User", back_populates="buyer_profile")

class SellerProfile(Base):
    __tablename__ = "seller_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_name = Column(String(150), nullable=True)
    pan_number = Column(String(50), nullable=True)

    user = relationship("User", back_populates="seller_profile")

class AgentProfile(Base):
    __tablename__ = "agent_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    agency_name = Column(String(150), nullable=True)
    license_number = Column(String(100), nullable=True)
    experience_years = Column(Integer, default=1)
    rera_id = Column(String(100), nullable=True)
    rating = Column(Float, default=4.9)
    review_count = Column(Integer, default=24)
    city = Column(String(100), default="Pune")
    areas_served = Column(JSON, default=list)
    languages = Column(JSON, default=lambda: ["English", "Hindi", "Marathi"])
    bio = Column(Text, nullable=True)
    profile_image = Column(String(500), nullable=True)
    notification_settings = Column(JSON, default=lambda: {"lead_alerts": True, "enquiry_alerts": True, "promotion_alerts": True})
    privacy_settings = Column(JSON, default=lambda: {"profile_visibility": "public", "contact_sharing": True})
    verification_status = Column(String(50), default="PENDING")

    user = relationship("User", back_populates="agent_profile")

class BuilderProfile(Base):
    __tablename__ = "builder_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_name = Column(String(150), nullable=True)
    developer_registration_no = Column(String(100), nullable=True)
    office_address = Column(Text, nullable=True)
    rera_id = Column(String(100), nullable=True)
    support_email = Column(String(255), nullable=True)
    city = Column(String(100), default="Pune")
    company_type = Column(String(100), default="Real Estate Developer")
    rating = Column(Float, default=4.8)
    notification_settings = Column(JSON, default=lambda: {"new_buyer_enquiry": True, "unit_booking_alert": True, "promotion_status": True})
    privacy_settings = Column(JSON, default=lambda: {"project_visibility": "public", "contact_sharing": True})
    verification_status = Column(String(50), default="PENDING")

    user = relationship("User", back_populates="builder_profile")

