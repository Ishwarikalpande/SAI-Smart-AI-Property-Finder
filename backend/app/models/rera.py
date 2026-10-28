from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class RERARegistration(Base):
    __tablename__ = "rera_registrations"

    id = Column(Integer, primary_key=True, index=True)
    rera_number = Column(String(100), unique=True, index=True, nullable=False)
    project_name = Column(String(200), nullable=False, index=True)
    promoter_name = Column(String(200), nullable=False, index=True)
    state = Column(String(100), default="Maharashtra", index=True)
    district = Column(String(100), default="Pune", index=True)
    project_type = Column(String(100), default="Residential")
    valid_until = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="REGISTERED", index=True)  # REGISTERED, EXPIRED, REVOKED, WITHDRAWN
    verification_status = Column(String(50), default="VERIFIED", index=True)  # VERIFIED, PENDING, REJECTED
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    source_url = Column(String(500), nullable=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="SET NULL"), nullable=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    verifier = relationship("User", foreign_keys=[verified_by])
    property = relationship("Property", foreign_keys=[property_id])
    project = relationship("Project", foreign_keys=[project_id])
