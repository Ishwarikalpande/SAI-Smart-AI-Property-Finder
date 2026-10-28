from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status

from app.models.verification import (
    VerificationDocument, VerificationReview, VerificationBadge, DocumentStatus
)
from app.models.user import User, UserRole, AgentProfile, BuilderProfile
from app.models.property import Property
from app.models.project import Project
from app.services.document_verification.storage_service import save_secure_document
from app.services.document_verification.ocr_service import extract_text_from_file
from app.services.document_verification.extraction_service import extract_structured_fields
from app.services.document_verification.consistency_service import perform_verification_checks
from app.services.notification_service import create_notification

def process_uploaded_verification_document(
    db: Session,
    user: User,
    file: UploadFile,
    document_type: str,
    account_type: str,
    property_id: Optional[int] = None,
    project_id: Optional[int] = None,
    parent_document_id: Optional[int] = None
) -> VerificationDocument:
    """
    Complete end-to-end verification pipeline:
    1. Secure storage outside public root
    2. Version control
    3. OCR & text extraction
    4. Structured entity extraction
    5. Database consistency checks
    6. Audit log & persistence
    7. Notification to user & admin
    """
    # 1. Save file securely
    dest_path, orig_name, file_size, file_hash = save_secure_document(file)

    # 2. Check versioning if resubmission
    version = 1
    if parent_document_id:
        parent_doc = db.query(VerificationDocument).filter(VerificationDocument.id == parent_document_id).first()
        if parent_doc:
            version = parent_doc.version + 1

    # 3. Context gathering for DB consistency comparison
    context_data = {
        "user_name": user.name,
        "user_email": user.email,
        "user_phone": user.phone,
    }

    if property_id:
        prop = db.query(Property).filter(Property.id == property_id).first()
        if prop:
            context_data.update({
                "property_title": prop.title,
                "property_address": f"{prop.address or ''}, {prop.locality}, {prop.city}",
                "city": prop.city,
                "locality": prop.locality,
                "property_price": prop.price_display or f"₹{prop.price:,.0f}"
            })

    if project_id:
        proj = db.query(Project).filter(Project.id == project_id).first()
        if proj:
            context_data.update({
                "project_name": proj.name,
                "city": proj.city,
                "locality": proj.locality,
                "company_name": user.name
            })

    if user.role == UserRole.AGENT and user.agent_profile:
        context_data.update({
            "agency_name": user.agent_profile.agency_name,
            "license_number": user.agent_profile.license_number,
            "rera_id": user.agent_profile.rera_id,
            "city": user.agent_profile.city
        })

    if user.role == UserRole.BUILDER and user.builder_profile:
        context_data.update({
            "company_name": user.builder_profile.company_name,
            "rera_id": user.builder_profile.rera_id,
            "office_address": user.builder_profile.office_address,
            "city": user.builder_profile.city
        })

    # 4. OCR / text extraction
    raw_text = extract_text_from_file(dest_path, file.content_type or "")

    # 5. Entity extraction
    extracted = extract_structured_fields(
        raw_text=raw_text,
        document_type=document_type,
        user_hint_name=user.name,
        context_data=context_data
    )

    # 6. Consistency checks
    checks = perform_verification_checks(
        extracted_fields=extracted,
        document_type=document_type,
        db_context=context_data
    )

    # 7. Create VerificationDocument record
    doc = VerificationDocument(
        user_id=user.id,
        property_id=property_id,
        project_id=project_id,
        account_type=account_type or user.role.value,
        document_type=document_type,
        file_name=orig_name,
        file_path=dest_path,
        mime_type=file.content_type or "application/octet-stream",
        file_size=file_size,
        document_hash=file_hash,
        version=version,
        status="UNDER_REVIEW", # Uploaded and AI analyzed -> Under review
        extracted_data=extracted,
        checks_data=checks,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # 8. Record audit log
    review_log = VerificationReview(
        document_id=doc.id,
        reviewer_id=user.id,
        action="SUBMITTED",
        reason=f"Uploaded version {version} for {document_type.replace('_', ' ').title()}",
        details={"extracted_confidence": extracted.get("confidence", 0.94)}
    )
    db.add(review_log)
    db.commit()

    # 9. Notify user
    create_notification(
        db=db,
        user_id=user.id,
        notif_type="verification_update",
        title="Document Submitted for Verification",
        message=f"Your {document_type.replace('_', ' ').title()} was submitted and is now under AI-assisted review.",
        data={"document_id": doc.id, "status": "UNDER_REVIEW"}
    )

    return doc

def approve_document(db: Session, document_id: int, reviewer: User, notes: Optional[str] = None) -> VerificationDocument:
    doc = db.query(VerificationDocument).filter(VerificationDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    doc.status = "VERIFIED"
    doc.reviewed_by = reviewer.id
    doc.reviewed_at = datetime.now(timezone.utc)
    doc.rejection_reason = None
    doc.resubmission_reason = None

    # Audit log
    audit = VerificationReview(
        document_id=doc.id,
        reviewer_id=reviewer.id,
        action="APPROVED",
        reason=notes or "Document verified and approved by admin."
    )
    db.add(audit)

    # Issue badge and update linked entities
    issue_verified_badges(db, doc)

    db.commit()
    db.refresh(doc)

    # Notify document owner
    create_notification(
        db=db,
        user_id=doc.user_id,
        notif_type="verification_update",
        title="Document Verified ✓",
        message=f"Your {doc.document_type.replace('_', ' ').title()} has been approved and verified by the SAI team.",
        data={"document_id": doc.id, "status": "VERIFIED"}
    )

    return doc

def reject_document(db: Session, document_id: int, reviewer: User, reason: str) -> VerificationDocument:
    if not reason or not reason.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rejection reason is mandatory")

    doc = db.query(VerificationDocument).filter(VerificationDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    doc.status = "REJECTED"
    doc.reviewed_by = reviewer.id
    doc.reviewed_at = datetime.now(timezone.utc)
    doc.rejection_reason = reason

    audit = VerificationReview(
        document_id=doc.id,
        reviewer_id=reviewer.id,
        action="REJECTED",
        reason=reason
    )
    db.add(audit)
    db.commit()
    db.refresh(doc)

    create_notification(
        db=db,
        user_id=doc.user_id,
        notif_type="verification_update",
        title="Document Verification Update",
        message=f"Your {doc.document_type.replace('_', ' ').title()} was rejected: {reason}",
        data={"document_id": doc.id, "status": "REJECTED", "reason": reason}
    )

    return doc

def request_resubmission(db: Session, document_id: int, reviewer: User, reason: str) -> VerificationDocument:
    if not reason or not reason.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Resubmission instructions/reason is mandatory")

    doc = db.query(VerificationDocument).filter(VerificationDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    doc.status = "RESUBMISSION_REQUIRED"
    doc.reviewed_by = reviewer.id
    doc.reviewed_at = datetime.now(timezone.utc)
    doc.resubmission_reason = reason

    audit = VerificationReview(
        document_id=doc.id,
        reviewer_id=reviewer.id,
        action="RESUBMISSION_REQUESTED",
        reason=reason
    )
    db.add(audit)
    db.commit()
    db.refresh(doc)

    create_notification(
        db=db,
        user_id=doc.user_id,
        notif_type="verification_update",
        title="Document Resubmission Required",
        message=f"Please resubmit your {doc.document_type.replace('_', ' ').title()}: {reason}",
        data={"document_id": doc.id, "status": "RESUBMISSION_REQUIRED", "reason": reason}
    )

    return doc

def issue_verified_badges(db: Session, doc: VerificationDocument):
    """Issues relevant verified badge when all necessary documents for an entity are approved."""
    # Check if user has verified KYC
    user = db.query(User).filter(User.id == doc.user_id).first()
    if not user:
        return

    # Check for Agent verification
    if doc.account_type == "agent" or user.role == UserRole.AGENT:
        # Check if has approved ID/KYC or professional doc
        has_approved_doc = db.query(VerificationDocument).filter(
            VerificationDocument.user_id == user.id,
            VerificationDocument.status == "VERIFIED"
        ).count() > 0
        if has_approved_doc:
            if user.agent_profile:
                user.agent_profile.verification_status = "VERIFIED"
            badge = db.query(VerificationBadge).filter(
                VerificationBadge.user_id == user.id,
                VerificationBadge.badge_type == "verified_agent"
            ).first()
            if not badge:
                db.add(VerificationBadge(user_id=user.id, badge_type="verified_agent", status="ACTIVE"))

    # Check for Builder verification
    elif doc.account_type == "builder" or user.role == UserRole.BUILDER:
        if user.builder_profile:
            user.builder_profile.verification_status = "VERIFIED"
        badge = db.query(VerificationBadge).filter(
            VerificationBadge.user_id == user.id,
            VerificationBadge.badge_type == "verified_builder"
        ).first()
        if not badge:
            db.add(VerificationBadge(user_id=user.id, badge_type="verified_builder", status="ACTIVE"))

    # Check for Property verification
    if doc.property_id:
        prop = db.query(Property).filter(Property.id == doc.property_id).first()
        if prop:
            prop.is_verified = True
            prop.verification_status = "VERIFIED"
            badge = db.query(VerificationBadge).filter(
                VerificationBadge.property_id == prop.id,
                VerificationBadge.badge_type == "verified_property"
            ).first()
            if not badge:
                db.add(VerificationBadge(property_id=prop.id, badge_type="verified_property", status="ACTIVE"))

    # Check for Project verification
    if doc.project_id:
        proj = db.query(Project).filter(Project.id == doc.project_id).first()
        if proj:
            badge = db.query(VerificationBadge).filter(
                VerificationBadge.project_id == proj.id,
                VerificationBadge.badge_type == "verified_project"
            ).first()
            if not badge:
                db.add(VerificationBadge(project_id=proj.id, badge_type="verified_project", status="ACTIVE"))
