from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.enquiry import Enquiry
from app.models.property import Property
from app.schemas.enquiry import EnquiryCreate, EnquiryUpdateStatus, EnquiryResponse
from app.core.permissions import get_current_active_user
from app.services.notification_service import create_notification

router = APIRouter(prefix="/enquiries", tags=["Enquiries"])

@router.post("/", response_model=EnquiryResponse, status_code=status.HTTP_201_CREATED)
def submit_enquiry(
    enquiry_in: EnquiryCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == enquiry_in.property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    enquiry = Enquiry(
        property_id=prop.id,
        buyer_id=current_user.id,
        owner_id=prop.owner_id,
        agent_id=prop.agent_id,
        builder_id=prop.builder_id,
        message=enquiry_in.message,
        status="NEW"
    )
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)

    # Notify property owner or agent
    recipient_id = prop.owner_id or prop.agent_id or prop.builder_id
    if recipient_id:
        create_notification(
            db=db,
            user_id=recipient_id,
            notif_type="enquiry",
            title=f"New enquiry for {prop.title}",
            message=f"{current_user.name} enquired: '{enquiry_in.message[:60]}...'",
            data={"enquiry_id": enquiry.id, "property_id": prop.id}
        )

    return enquiry

@router.get("/", response_model=List[EnquiryResponse])
def get_my_enquiries(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role == UserRole.BUYER:
        return db.query(Enquiry).filter(Enquiry.buyer_id == current_user.id).order_by(Enquiry.created_at.desc()).all()
    elif current_user.role == UserRole.SELLER:
        return db.query(Enquiry).filter(Enquiry.owner_id == current_user.id).order_by(Enquiry.created_at.desc()).all()
    elif current_user.role == UserRole.AGENT:
        return db.query(Enquiry).filter(Enquiry.agent_id == current_user.id).order_by(Enquiry.created_at.desc()).all()
    elif current_user.role == UserRole.BUILDER:
        return db.query(Enquiry).filter(Enquiry.builder_id == current_user.id).order_by(Enquiry.created_at.desc()).all()
    elif current_user.role == UserRole.SUPER_ADMIN:
        return db.query(Enquiry).order_by(Enquiry.created_at.desc()).all()
    return []

@router.patch("/{enquiry_id}/status", response_model=EnquiryResponse)
def update_enquiry_status(
    enquiry_id: int,
    status_update: EnquiryUpdateStatus,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enquiry not found")

    # Authorization check
    is_authorized = (
        current_user.role == UserRole.SUPER_ADMIN or
        enquiry.owner_id == current_user.id or
        enquiry.agent_id == current_user.id or
        enquiry.builder_id == current_user.id
    )
    if not is_authorized:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this enquiry")

    enquiry.status = status_update.status
    db.commit()
    db.refresh(enquiry)

    # Notify buyer of status update
    create_notification(
        db=db,
        user_id=enquiry.buyer_id,
        notif_type="enquiry_update",
        title="Enquiry Status Updated",
        message=f"Your enquiry status was updated to {enquiry.status}.",
        data={"enquiry_id": enquiry.id}
    )

    return enquiry
