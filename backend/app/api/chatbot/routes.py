from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.chatbot import ChatbotRequest, ChatbotResponse
from app.ai.chat_service import process_chat_message

router = APIRouter(prefix="/chatbot", tags=["AI Chatbot"])

@router.post("/message")
async def chat_with_sai(
    request: ChatbotRequest,
    db: Session = Depends(get_db)
):
    """Bridge endpoint for existing frontend chatbot interface to full Qwen3 service."""
    res = await process_chat_message(
        db=db,
        message=request.message,
        conversation_id=request.conversation_id,
        language=request.language or "auto"
    )
    return {
        "reply": res["message"],
        "message": res["message"],
        "properties": res.get("properties", []),
        "comparison": res.get("comparison"),
        "suggestions": res.get("suggestions") or [
            "Compare top 2 properties",
            "Which is cheaper?",
            "Which has more area?",
            "Investment analysis"
        ],
        "detected_intent": res["intent"],
        "intent": res["intent"],
        "conversation_id": res["conversation_id"],
        "map_data": res.get("map_data"),
        "flat_3d": res.get("flat_3d"),
        "matching_flats": res.get("matching_flats"),
        "document_actions": res.get("document_actions", [])
    }
