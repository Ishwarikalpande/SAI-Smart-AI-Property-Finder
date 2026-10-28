from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class EnquiryCreate(BaseModel):
    property_id: int
    message: str = Field(..., min_length=5, max_length=2000)

class EnquiryUpdateStatus(BaseModel):
    status: str = Field(..., description="NEW, CONTACTED, INTERESTED, CLOSED, CANCELLED")

class EnquiryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    property_id: int
    buyer_id: int
    owner_id: Optional[int] = None
    agent_id: Optional[int] = None
    builder_id: Optional[int] = None
    message: str
    status: str
    created_at: datetime
    updated_at: datetime

