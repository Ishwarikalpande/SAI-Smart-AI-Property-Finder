from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class SiteVisitCreate(BaseModel):
    property_id: int
    scheduled_at: datetime
    notes: Optional[str] = None

class SiteVisitUpdateStatus(BaseModel):
    status: str = Field(..., description="PENDING, APPROVED, REJECTED, COMPLETED, CANCELLED, RESCHEDULED")
    notes: Optional[str] = None

class SiteVisitReschedule(BaseModel):
    scheduled_at: datetime
    notes: Optional[str] = None

class SiteVisitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    property_id: int
    buyer_id: int
    owner_id: Optional[int] = None
    agent_id: Optional[int] = None
    builder_id: Optional[int] = None
    scheduled_at: datetime
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

