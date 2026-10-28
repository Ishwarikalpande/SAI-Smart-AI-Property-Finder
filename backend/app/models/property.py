from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    property_type = Column(String(50), nullable=False, index=True)   # "apartment", "villa", "plot", "office", "studio", "penthouse"
    listing_type = Column(String(50), nullable=False, index=True)    # "buy", "rent", "commercial", "new-projects"
    bhk = Column(Integer, nullable=True, index=True)                 # 1, 2, 3, 4, etc.
    area_sqft = Column(Float, nullable=False, index=True)
    price = Column(Float, nullable=False, index=True)                # in INR
    price_display = Column(String(50), nullable=True)                # e.g., "₹85L", "₹32,000/mo"
    furnishing = Column(String(50), default="unfurnished", index=True) # "furnished", "semi-furnished", "unfurnished"
    amenities = Column(JSON, default=list)                           # ["Gym", "Pool", "Parking"]
    address = Column(Text, nullable=True)
    locality = Column(String(100), nullable=False, index=True)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=True, index=True)
    country = Column(String(100), nullable=True, default="India", index=True)
    pincode = Column(String(10), nullable=True, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String(50), default="available", nullable=False, index=True) # "available", "sold", "rented", "inactive"

    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    agent_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    builder_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    is_verified = Column(Boolean, default=False)
    is_rera = Column(Boolean, default=False)
    badge = Column(String(50), default="Standard")                  # "AI Pick", "Top Rated", "Premium", "Budget Pick"
    match_score = Column(Integer, default=90)
    rating = Column(Float, default=4.5)
    dist_metro = Column(String(50), nullable=True)                   # "0.8 km Metro"
    sponsored = Column(Boolean, default=False)
    sponsored_label = Column(String(100), nullable=True)
    views_count = Column(Integer, default=0)
    saves_count = Column(Integer, default=0)
    verification_status = Column(String(50), default="PENDING", index=True) # "NOT_SUBMITTED", "PENDING", "UNDER_REVIEW", "PARTIALLY_VERIFIED", "VERIFIED", "REJECTED"

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id], back_populates="owned_properties")
    agent = relationship("User", foreign_keys=[agent_id], back_populates="agent_properties")
    media = relationship("PropertyMedia", back_populates="property", cascade="all, delete-orphan", order_by="PropertyMedia.sort_order")
    favorites = relationship("Favorite", back_populates="property", cascade="all, delete-orphan")
    enquiries = relationship("Enquiry", back_populates="property", cascade="all, delete-orphan")
    site_visits = relationship("SiteVisit", back_populates="property", cascade="all, delete-orphan")
    facility_links = relationship("PropertyFacility", back_populates="property", cascade="all, delete-orphan")
    reports = relationship("PropertyReport", back_populates="property", cascade="all, delete-orphan")
    walkthrough = relationship("PropertyWalkthrough", back_populates="property", uselist=False, cascade="all, delete-orphan")
