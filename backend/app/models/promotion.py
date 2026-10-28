from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class ListingPromotion(Base):
    __tablename__ = "listing_promotions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)

    plan_type = Column(String(50), nullable=False) # "Basic", "Premium", "Elite"
    duration_days = Column(Integer, default=30, nullable=False)
    cost = Column(Float, nullable=False)
    start_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="active", nullable=False, index=True) # "active", "pending_payment", "expired"

    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    enquiries_count = Column(Integer, default=0)
    leads_count = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", foreign_keys=[user_id])
    property = relationship("Property", foreign_keys=[property_id])
    project = relationship("Project", foreign_keys=[project_id])
