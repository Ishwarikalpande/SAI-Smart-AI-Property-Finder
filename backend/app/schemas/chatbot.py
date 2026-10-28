from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.property import PropertyResponse

class ChatMessageItem(BaseModel):
    role: str # "user", "assistant", "system"
    content: str

class ChatbotRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None
    history: Optional[List[ChatMessageItem]] = []
    language: Optional[str] = "en"

class ChatbotResponse(BaseModel):
    reply: str
    message: Optional[str] = None
    properties: Optional[List[PropertyResponse]] = []
    comparison: Optional[Dict[str, Any]] = None
    suggestions: List[str] = []
    detected_intent: Optional[str] = None
    intent: Optional[str] = None
    conversation_id: Optional[str] = None
