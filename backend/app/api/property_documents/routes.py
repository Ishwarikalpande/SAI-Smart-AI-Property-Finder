import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header, Body
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.verification import VerificationDocument
from app.models.property import Property
from app.core.security import decode_access_token
from app.core.permissions import get_current_active_user, require_super_admin
from app.services.document_verification.storage_service import get_document_file_path
from app.services.document_verification.verification_service import approve_document, reject_document
from app.services.document_verification.property_documents_service import format_property_document

router = APIRouter(prefix="/property-documents", tags=["Property Documents"])

def resolve_user_from_token_or_header(
    token_query: Optional[str],
    auth_header: Optional[str],
    db: Session
) -> Optional[User]:
    token = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
    elif token_query:
        token = token_query.strip()
    
    if not token:
        return None
        
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        return None
        
    try:
        user_id = int(payload.get("sub"))
        return db.query(User).filter(User.id == user_id, User.is_active == True).first()
    except (ValueError, TypeError):
        return None

@router.get("/{document_id}")
def get_property_document_details(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve metadata and verification status for a specific property document."""
    doc = db.query(VerificationDocument).filter(VerificationDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Authorization check
    is_admin = current_user.role == UserRole.SUPER_ADMIN
    is_uploader = doc.user_id == current_user.id
    
    # Check if user is associated with property (buyer can see verified property documents)
    is_verified_prop_doc = doc.property_id is not None and doc.status == "VERIFIED"
    
    if not (is_admin or is_uploader or is_verified_prop_doc):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this document."
        )

    return {
        "success": True,
        "document": format_property_document(doc, db)
    }

@router.get("/{document_id}/view")
def view_property_document_secure(
    document_id: int,
    token: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Secure authenticated document streaming/preview endpoint.
    Supports both Authorization header and query param token (for iframes/images).
    Prevents public access and strictly verifies buyer/user authorization.
    """
    user = resolve_user_from_token_or_header(token, authorization, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to view secure documents."
        )

    doc = db.query(VerificationDocument).filter(VerificationDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    is_admin = user.role == UserRole.SUPER_ADMIN
    is_uploader = doc.user_id == user.id

    # If document is associated with a property:
    # Buyers and users can view verified documents
    # Owners and uploader can view under-review docs for their property
    can_view = False
    if is_admin or is_uploader:
        can_view = True
    elif doc.property_id is not None:
        # Check property ownership
        prop = db.query(Property).filter(Property.id == doc.property_id).first()
        if prop and (prop.owner_id == user.id or prop.agent_id == user.id or prop.builder_id == user.id):
            can_view = True
        elif doc.status == "VERIFIED":
            # Any authenticated buyer can preview approved verified property documents
            can_view = True

    if not can_view:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Document is not verified or does not belong to authorized records."
        )

    file_abs_path = get_document_file_path(doc.file_path)
    if not os.path.exists(file_abs_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file was not found on secure storage."
        )

    return FileResponse(
        path=file_abs_path,
        media_type=doc.mime_type or "application/pdf",
        filename=doc.file_name,
        headers={
            "Content-Disposition": f'inline; filename="{doc.file_name}"',
            "Cache-Control": "private, max-age=3600"
        }
    )

@router.put("/{document_id}/verify")
@router.post("/{document_id}/verify")
def verify_document_endpoint(
    document_id: int,
    payload: Optional[dict] = Body(None),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to approve and verify a property document."""
    notes = (payload or {}).get("notes") or "Document verified and approved by admin."
    doc = approve_document(db, document_id, current_user, notes=notes)
    return {
        "success": True,
        "message": f"Document #{document_id} verified successfully.",
        "document": format_property_document(doc, db)
    }

@router.put("/{document_id}/reject")
@router.post("/{document_id}/reject")
def reject_document_endpoint(
    document_id: int,
    payload: dict = Body(...),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to reject a property document with a mandatory reason."""
    reason = payload.get("reason")
    if not reason or not reason.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejection reason is required."
        )
    doc = reject_document(db, document_id, current_user, reason=reason.strip())
    return {
        "success": True,
        "message": f"Document #{document_id} marked as rejected.",
        "document": format_property_document(doc, db)
    }

@router.delete("/{document_id}")
def delete_document_endpoint(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a property document (admin or uploader)."""
    doc = db.query(VerificationDocument).filter(VerificationDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    is_admin = current_user.role == UserRole.SUPER_ADMIN
    is_uploader = doc.user_id == current_user.id
    if not (is_admin or is_uploader):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    db.delete(doc)
    db.commit()
    return {"success": True, "message": f"Document #{document_id} deleted."}
