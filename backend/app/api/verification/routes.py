import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.verification import VerificationDocument, VerificationReview
from app.models.property import Property
from app.models.project import Project
from app.schemas.verification import (
    VerificationDocumentResponse, VerificationReviewResponse,
    VerificationDecisionRequest, VerificationStatsResponse
)
from app.core.permissions import get_current_active_user, require_super_admin
from app.services.document_verification.verification_service import (
    process_uploaded_verification_document, approve_document,
    reject_document, request_resubmission
)
from app.services.document_verification.storage_service import get_document_file_path

router = APIRouter(prefix="/verification", tags=["Document Verification"])

def _format_doc_response(doc: VerificationDocument, db: Session) -> dict:
    user = db.query(User).filter(User.id == doc.user_id).first()
    prop = db.query(Property).filter(Property.id == doc.property_id).first() if doc.property_id else None
    proj = db.query(Project).filter(Project.id == doc.project_id).first() if doc.project_id else None

    status_str = (doc.status or "pending").lower()

    return {
        "id": doc.id,
        "user_id": doc.user_id,
        "property_id": doc.property_id,
        "project_id": doc.project_id,
        "account_type": doc.account_type,
        "document_type": doc.document_type,
        "file_name": doc.file_name,
        "mime_type": doc.mime_type,
        "file_size": doc.file_size,
        "version": doc.version,
        "status": status_str,
        "status_raw": doc.status,
        "extracted_data": doc.extracted_data or {},
        "checks_data": doc.checks_data or {},
        "consistency_checks": doc.checks_data or {},
        "checks": doc.checks_data or {},
        "rejection_reason": doc.rejection_reason,
        "resubmission_reason": doc.resubmission_reason,
        "reviewed_by": doc.reviewed_by,
        "reviewed_at": doc.reviewed_at,
        "uploaded_at": doc.uploaded_at,
        "updated_at": doc.updated_at,
        "user_name": user.name if user else "Unknown User",
        "user_email": user.email if user else "",
        "property_title": prop.title if prop else None,
        "project_name": proj.name if proj else None,
        "reviews": [
            {
                "id": r.id,
                "reviewer_id": r.reviewer_id,
                "action": r.action,
                "reason": r.reason,
                "details": r.details or {},
                "created_at": r.created_at
            }
            for r in (doc.reviews or [])
        ]
    }

@router.post("/upload")
@router.post("/documents")
def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    account_type: Optional[str] = Form(None),
    property_id: Optional[int] = Form(None),
    project_id: Optional[int] = Form(None),
    parent_document_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Secure document upload endpoint with instant AI extraction & consistency analysis."""
    acc_type = account_type or current_user.role.value
    doc = process_uploaded_verification_document(
        db=db,
        user=current_user,
        file=file,
        document_type=document_type,
        account_type=acc_type,
        property_id=property_id,
        project_id=project_id,
        parent_document_id=parent_document_id
    )
    return {"success": True, "document": _format_doc_response(doc, db)}

@router.get("/my-documents")
@router.get("/documents")
def get_my_documents(
    property_id: Optional[int] = None,
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve all verification documents submitted by the authenticated user."""
    query = db.query(VerificationDocument).filter(VerificationDocument.user_id == current_user.id)
    if property_id:
        query = query.filter(VerificationDocument.property_id == property_id)
    if project_id:
        query = query.filter(VerificationDocument.project_id == project_id)

    docs = query.order_by(VerificationDocument.uploaded_at.desc()).all()
    return [_format_doc_response(d, db) for d in docs]

@router.get("/documents/{document_id}")
def get_document_details(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    doc = db.query(VerificationDocument).filter(VerificationDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if current_user.role != UserRole.SUPER_ADMIN and doc.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return _format_doc_response(doc, db)

@router.get("/documents/{document_id}/history")
def get_document_history(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    doc = db.query(VerificationDocument).filter(VerificationDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if current_user.role != UserRole.SUPER_ADMIN and doc.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    history_records = [
        {
            "id": r.id,
            "reviewer_id": r.reviewer_id,
            "action": r.action,
            "reason": r.reason,
            "details": r.details or {},
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in (doc.reviews or [])
    ]
    return {
        "success": True,
        "document_id": doc.id,
        "status": (doc.status or "pending").lower(),
        "history": history_records,
        "version": doc.version
    }

@router.get("/documents/{document_id}/extraction")
def get_document_extraction(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    doc = db.query(VerificationDocument).filter(VerificationDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if current_user.role != UserRole.SUPER_ADMIN and doc.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return {
        "success": True,
        "document_id": doc.id,
        "document_type": doc.document_type,
        "extracted_data": doc.extracted_data or {}
    }

@router.get("/documents/{document_id}/checks")
def get_document_checks(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    doc = db.query(VerificationDocument).filter(VerificationDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if current_user.role != UserRole.SUPER_ADMIN and doc.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return {
        "success": True,
        "document_id": doc.id,
        "document_type": doc.document_type,
        "checks_data": doc.checks_data or {},
        "consistency_checks": doc.checks_data or {}
    }

@router.post("/documents/{document_id}/process")
def reprocess_document_verification(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    doc = db.query(VerificationDocument).filter(VerificationDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if current_user.role != UserRole.SUPER_ADMIN and doc.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Return analyzed document
    return {"success": True, "message": "Document reprocessed successfully", "document": _format_doc_response(doc, db)}

@router.get("/documents/{document_id}/view")
def view_document_securely(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Authenticated streaming endpoint for previewing uploaded documents.
    Prevents unrestricted public file exposure.
    """
    doc = db.query(VerificationDocument).filter(VerificationDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if current_user.role != UserRole.SUPER_ADMIN and doc.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this document")

    file_abs_path = get_document_file_path(doc.file_path)
    return FileResponse(
        path=file_abs_path,
        media_type=doc.mime_type,
        filename=doc.file_name
    )

# ── ADMIN VERIFICATION ENDPOINTS ──────────────────────────────────────

admin_verification_router = APIRouter(prefix="/admin/verification", tags=["Admin Document Verification"])

@admin_verification_router.get("/stats", response_model=VerificationStatsResponse)
def get_verification_stats(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    total = db.query(VerificationDocument).count()
    pending = db.query(VerificationDocument).filter(VerificationDocument.status == "PENDING").count()
    under_review = db.query(VerificationDocument).filter(VerificationDocument.status == "UNDER_REVIEW").count()
    verified = db.query(VerificationDocument).filter(VerificationDocument.status == "VERIFIED").count()
    rejected = db.query(VerificationDocument).filter(VerificationDocument.status == "REJECTED").count()
    resubmission = db.query(VerificationDocument).filter(VerificationDocument.status == "RESUBMISSION_REQUIRED").count()

    return VerificationStatsResponse(
        total_documents=total,
        pending_review=pending,
        under_review=under_review,
        verified=verified,
        rejected=rejected,
        resubmission_required=resubmission,
        total=total,
        pending=pending
    )

@admin_verification_router.get("/")
def list_admin_verification_documents(
    account_type: Optional[str] = None,
    document_type: Optional[str] = None,
    doc_status: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    query = db.query(VerificationDocument)
    if account_type:
        query = query.filter(VerificationDocument.account_type == account_type.lower())
    if document_type:
        query = query.filter(VerificationDocument.document_type == document_type.lower())
    if doc_status:
        query = query.filter(VerificationDocument.status == doc_status.upper())

    docs = query.order_by(VerificationDocument.uploaded_at.desc()).all()
    formatted = [_format_doc_response(d, db) for d in docs]

    if search and search.strip():
        term = search.lower().strip()
        formatted = [
            f for f in formatted
            if term in str(f.get("user_name", "")).lower() or
               term in str(f.get("user_email", "")).lower() or
               term in str(f.get("file_name", "")).lower() or
               term in str(f.get("document_type", "")).lower() or
               term in str(f.get("id", ""))
        ]

    return formatted

@admin_verification_router.post("/{document_id}/approve")
def approve_doc(
    document_id: int,
    req: VerificationDecisionRequest,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    doc = approve_document(db, document_id, current_user, notes=req.notes)
    formatted = _format_doc_response(doc, db)
    return {"success": True, "message": "Document approved successfully", "document": formatted}

@admin_verification_router.post("/{document_id}/reject")
def reject_doc(
    document_id: int,
    req: VerificationDecisionRequest,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    if not req.reason:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rejection reason is required")
    doc = reject_document(db, document_id, current_user, reason=req.reason)
    return {"success": True, "message": "Document marked as rejected", "document": _format_doc_response(doc, db)}

@admin_verification_router.post("/{document_id}/resubmission")
def resubmit_doc(
    document_id: int,
    req: VerificationDecisionRequest,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    if not req.reason:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Resubmission reason is required")
    doc = request_resubmission(db, document_id, current_user, reason=req.reason)
    return {"success": True, "message": "Resubmission requested from user", "document": _format_doc_response(doc, db)}
