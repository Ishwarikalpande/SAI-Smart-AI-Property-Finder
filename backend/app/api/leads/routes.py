from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.lead import Lead
from app.schemas.lead import LeadCreate, LeadUpdate, LeadResponse
from app.core.permissions import require_roles

router = APIRouter(prefix="/leads", tags=["Leads"])

@router.get("/", response_model=List[LeadResponse])
def get_agent_leads(
    current_user: User = Depends(require_roles(UserRole.AGENT, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    if current_user.role == UserRole.SUPER_ADMIN:
        return db.query(Lead).order_by(Lead.updated_at.desc()).all()
    return db.query(Lead).filter(Lead.agent_id == current_user.id).order_by(Lead.updated_at.desc()).all()

@router.post("/", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_agent_lead(
    lead_in: LeadCreate,
    current_user: User = Depends(require_roles(UserRole.AGENT, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    lead = Lead(
        agent_id=current_user.id,
        buyer_id=lead_in.buyer_id,
        property_id=lead_in.property_id,
        status=lead_in.status or "NEW",
        notes=lead_in.notes
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead

@router.patch("/{lead_id}", response_model=LeadResponse)
def update_agent_lead(
    lead_id: int,
    lead_update: LeadUpdate,
    current_user: User = Depends(require_roles(UserRole.AGENT, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    query = db.query(Lead).filter(Lead.id == lead_id)
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(Lead.agent_id == current_user.id)
    
    lead = query.first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    if lead_update.status:
        lead.status = lead_update.status
    if lead_update.notes is not None:
        lead.notes = lead_update.notes

    db.commit()
    db.refresh(lead)
    return lead
