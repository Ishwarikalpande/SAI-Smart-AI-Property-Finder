from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class UserShortResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: int
    name: str
    email: Optional[str] = None
    role: str


class MessageCreate(BaseModel):
    conversation_id: Optional[int] = None
    content: str = Field(..., min_length=1, max_length=5000)

class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    sender_id: int
    content: str
    is_read: bool = False
    created_at: datetime
    sender: Optional[UserShortResponse] = None

class ConversationParticipantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    joined_at: datetime
    user: Optional[UserShortResponse] = None

class ConversationCreate(BaseModel):
    recipient_id: int
    title: Optional[str] = None
    initial_message: Optional[str] = None

class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    participants: List[ConversationParticipantResponse] = []
    messages: List[MessageResponse] = []


