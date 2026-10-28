from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class LeadCreate(BaseModel):
    buyer_id: Optional[int] = None
    property_id: Optional[int] = None
    status: Optional[str] = "NEW"
    notes: Optional[str] = None

class LeadUpdate(BaseModel):
    status: Optional[str] = Field(None, description="NEW, CONTACTED, INTERESTED, SITE_VISIT, NEGOTIATION, CLOSED")
    notes: Optional[str] = None

class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    agent_id: int
    buyer_id: Optional[int] = None
    property_id: Optional[int] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

