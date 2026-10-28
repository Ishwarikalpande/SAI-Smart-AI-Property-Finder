from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.site_visit import SiteVisit
from app.models.property import Property
from app.schemas.site_visit import SiteVisitCreate, SiteVisitUpdateStatus, SiteVisitResponse, SiteVisitReschedule
from app.core.permissions import get_current_active_user
from app.services.notification_service import create_notification

router = APIRouter(prefix="/site-visits", tags=["Site Visits"])

@router.post("/", response_model=SiteVisitResponse, status_code=status.HTTP_201_CREATED)
def request_site_visit(
    visit_in: SiteVisitCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == visit_in.property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    visit = SiteVisit(
        property_id=prop.id,
        buyer_id=current_user.id,
        owner_id=prop.owner_id,
        agent_id=prop.agent_id,
        builder_id=prop.builder_id,
        scheduled_at=visit_in.scheduled_at,
        notes=visit_in.notes,
        status="PENDING"
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)

    # Notify property owner or agent
    recipient_id = prop.owner_id or prop.agent_id or prop.builder_id
    if recipient_id:
        create_notification(
            db=db,
            user_id=recipient_id,
            notif_type="site_visit",
            title=f"Site visit request for {prop.title}",
            message=f"{current_user.name} requested a site visit on {visit_in.scheduled_at.strftime('%b %d, %Y %I:%M %p')}.",
            data={"site_visit_id": visit.id, "property_id": prop.id}
        )

    return visit

@router.get("/", response_model=List[SiteVisitResponse])
def list_site_visits(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role == UserRole.BUYER:
        return db.query(SiteVisit).filter(SiteVisit.buyer_id == current_user.id).order_by(SiteVisit.scheduled_at.asc()).all()
    elif current_user.role == UserRole.SELLER:
        return db.query(SiteVisit).filter(SiteVisit.owner_id == current_user.id).order_by(SiteVisit.scheduled_at.asc()).all()
    elif current_user.role == UserRole.AGENT:
        return db.query(SiteVisit).filter(SiteVisit.agent_id == current_user.id).order_by(SiteVisit.scheduled_at.asc()).all()
    elif current_user.role == UserRole.BUILDER:
        return db.query(SiteVisit).filter(SiteVisit.builder_id == current_user.id).order_by(SiteVisit.scheduled_at.asc()).all()
    elif current_user.role == UserRole.SUPER_ADMIN:
        return db.query(SiteVisit).order_by(SiteVisit.scheduled_at.asc()).all()
    return []

@router.patch("/{site_visit_id}/status", response_model=SiteVisitResponse)
def update_site_visit_status(
    site_visit_id: int,
    status_update: SiteVisitUpdateStatus,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    visit = db.query(SiteVisit).filter(SiteVisit.id == site_visit_id).first()
    if not visit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site visit not found")

    is_authorized = (
        current_user.role == UserRole.SUPER_ADMIN or
        visit.owner_id == current_user.id or
        visit.agent_id == current_user.id or
        visit.builder_id == current_user.id or
        (visit.buyer_id == current_user.id and status_update.status == "CANCELLED")
    )
    if not is_authorized:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this visit")

    visit.status = status_update.status
    if status_update.notes:
        visit.notes = status_update.notes

    db.commit()
    db.refresh(visit)

    # Notify buyer
    create_notification(
        db=db,
        user_id=visit.buyer_id,
        notif_type="site_visit_update",
        title="Site Visit Status Update",
        message=f"Your visit for property has been {visit.status.lower()}.",
        data={"site_visit_id": visit.id}
    )

    return visit

@router.put("/{site_visit_id}/reschedule", response_model=SiteVisitResponse)
@router.post("/{site_visit_id}/reschedule", response_model=SiteVisitResponse)
def reschedule_site_visit(
    site_visit_id: int,
    reschedule_in: SiteVisitReschedule,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    visit = db.query(SiteVisit).filter(SiteVisit.id == site_visit_id).first()
    if not visit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site visit not found")

    is_authorized = (
        current_user.role == UserRole.SUPER_ADMIN or
        visit.buyer_id == current_user.id or
        visit.owner_id == current_user.id or
        visit.agent_id == current_user.id or
        visit.builder_id == current_user.id
    )
    if not is_authorized:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to reschedule this visit")

    visit.scheduled_at = reschedule_in.scheduled_at
    visit.status = "RESCHEDULED"
    if reschedule_in.notes:
        visit.notes = reschedule_in.notes

    db.commit()
    db.refresh(visit)

    prop = db.query(Property).filter(Property.id == visit.property_id).first()
    prop_title = prop.title if prop else "the property"

    recipient_id = prop.owner_id or prop.agent_id if prop else None
    if recipient_id and recipient_id != current_user.id:
        create_notification(
            db=db,
            user_id=recipient_id,
            notif_type="site_visit_rescheduled",
            title="Site Visit Rescheduled",
            message=f"{current_user.name} rescheduled their visit for {prop_title} to {visit.scheduled_at.strftime('%b %d, %Y %I:%M %p')}.",
            data={"site_visit_id": visit.id}
        )

    return visit

@router.delete("/{site_visit_id}", status_code=status.HTTP_200_OK)
def cancel_site_visit(
    site_visit_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    visit = db.query(SiteVisit).filter(SiteVisit.id == site_visit_id).first()
    if not visit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site visit not found")

    is_authorized = (
        current_user.role == UserRole.SUPER_ADMIN or
        visit.buyer_id == current_user.id or
        visit.owner_id == current_user.id or
        visit.agent_id == current_user.id or
        visit.builder_id == current_user.id
    )
    if not is_authorized:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to cancel this visit")

    visit.status = "CANCELLED"
    db.commit()
    return {"success": True, "message": "Site visit cancelled successfully", "id": site_visit_id}

visits_router = APIRouter(prefix="/visits", tags=["Visits"])
visits_router.add_api_route("/", request_site_visit, methods=["POST"], response_model=SiteVisitResponse, status_code=status.HTTP_201_CREATED)
visits_router.add_api_route("/", list_site_visits, methods=["GET"], response_model=List[SiteVisitResponse])
visits_router.add_api_route("/{site_visit_id}/status", update_site_visit_status, methods=["PATCH"], response_model=SiteVisitResponse)
visits_router.add_api_route("/{site_visit_id}/reschedule", reschedule_site_visit, methods=["PUT", "POST"], response_model=SiteVisitResponse)
visits_router.add_api_route("/{site_visit_id}", cancel_site_visit, methods=["DELETE"])
