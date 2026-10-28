from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class VerificationReviewResponse(BaseModel):
    id: int
    reviewer_id: Optional[int] = None
    action: str
    reason: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class VerificationDocumentResponse(BaseModel):
    id: int
    user_id: int
    property_id: Optional[int] = None
    project_id: Optional[int] = None
    account_type: str
    document_type: str
    file_name: str
    mime_type: str
    file_size: int
    version: int
    status: str
    extracted_data: Optional[Dict[str, Any]] = None
    checks_data: Optional[Dict[str, Any]] = None
    rejection_reason: Optional[str] = None
    resubmission_reason: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    uploaded_at: datetime
    updated_at: datetime
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    property_title: Optional[str] = None
    project_name: Optional[str] = None
    reviews: Optional[List[VerificationReviewResponse]] = None

    class Config:
        from_attributes = True

class VerificationDecisionRequest(BaseModel):
    reason: Optional[str] = None
    notes: Optional[str] = None

class VerificationStatsResponse(BaseModel):
    total_documents: int
    pending_review: int
    under_review: int
    verified: int
    rejected: int
    resubmission_required: int
    total: Optional[int] = None
    pending: Optional[int] = None
