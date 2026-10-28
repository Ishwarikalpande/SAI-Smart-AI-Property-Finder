import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class DocumentStatus(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    RESUBMISSION_REQUIRED = "RESUBMISSION_REQUIRED"

class VerificationDocument(Base):
    __tablename__ = "verification_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)

    account_type = Column(String(50), nullable=False, index=True) # buyer, seller/owner, agent, builder
    document_type = Column(String(100), nullable=False, index=True) # aadhaar, pan, passport, sale_deed, tax_receipt, rera, incorporation, etc.
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    document_hash = Column(String(64), nullable=True)
    version = Column(Integer, default=1, nullable=False)

    status = Column(String(50), default="PENDING", nullable=False, index=True)

    # AI Extraction & Consistency Checks results stored as JSON
    extracted_data = Column(JSON, default=dict)
    checks_data = Column(JSON, default=dict)

    rejection_reason = Column(Text, nullable=True)
    resubmission_reason = Column(Text, nullable=True)

    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    property = relationship("Property", foreign_keys=[property_id])
    project = relationship("Project", foreign_keys=[project_id])
    reviews = relationship("VerificationReview", back_populates="document", cascade="all, delete-orphan", order_by="VerificationReview.created_at.desc()")

class VerificationReview(Base):
    __tablename__ = "verification_reviews"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("verification_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(50), nullable=False) # SUBMITTED, AI_ANALYZED, APPROVED, REJECTED, RESUBMISSION_REQUESTED
    reason = Column(Text, nullable=True)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    document = relationship("VerificationDocument", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id])

class VerificationBadge(Base):
    __tablename__ = "verification_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    badge_type = Column(String(50), nullable=False, index=True) # verified_buyer, verified_owner, verified_agent, verified_builder, verified_property, verified_project
    status = Column(String(50), default="ACTIVE", nullable=False)
    issued_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", foreign_keys=[user_id])
    property = relationship("Property", foreign_keys=[property_id])
    project = relationship("Project", foreign_keys=[project_id])
