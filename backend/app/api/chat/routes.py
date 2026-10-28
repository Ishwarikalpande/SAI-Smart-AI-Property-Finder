from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.db.session import get_db, SessionLocal
from app.models.user import User
from app.models.chat import Conversation, ConversationParticipant, Message
from app.schemas.chat import (
    ConversationCreate, ConversationResponse, MessageCreate, MessageResponse
)
from app.core.permissions import get_current_active_user
from app.core.security import decode_access_token

router = APIRouter(prefix="/chat", tags=["Chat"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, conversation_id: int, websocket: WebSocket):
        await websocket.accept()
        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = []
        self.active_connections[conversation_id].append(websocket)

    def disconnect(self, conversation_id: int, websocket: WebSocket):
        if conversation_id in self.active_connections:
            if websocket in self.active_connections[conversation_id]:
                self.active_connections[conversation_id].remove(websocket)

    async def broadcast(self, conversation_id: int, message: dict):
        if conversation_id in self.active_connections:
            for connection in self.active_connections[conversation_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()

@router.get("/conversations", response_model=List[ConversationResponse])
def get_user_conversations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    parts = db.query(ConversationParticipant).filter(ConversationParticipant.user_id == current_user.id).all()
    conv_ids = [p.conversation_id for p in parts]
    if not conv_ids:
        return []
    return db.query(Conversation).filter(Conversation.id.in_(conv_ids)).order_by(Conversation.updated_at.desc()).all()

@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def start_conversation(
    conv_in: ConversationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    recipient = db.query(User).filter(User.id == conv_in.recipient_id).first()
    recipient_name = recipient.name if recipient else f"User #{conv_in.recipient_id}"
    conv = Conversation(title=conv_in.title or f"Chat with {recipient_name}")
    db.add(conv)
    db.commit()
    db.refresh(conv)

    p1 = ConversationParticipant(conversation_id=conv.id, user_id=current_user.id)
    p2 = ConversationParticipant(conversation_id=conv.id, user_id=conv_in.recipient_id)
    db.add_all([p1, p2])

    if conv_in.initial_message:
        msg = Message(conversation_id=conv.id, sender_id=current_user.id, content=conv_in.initial_message)
        db.add(msg)

    db.commit()
    db.refresh(conv)
    return conv

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
def get_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    part = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == current_user.id
    ).first()
    if not part and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a participant in this conversation")

    # Mark incoming messages as read
    unread_msgs = db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user.id,
        Message.is_read == False
    ).all()
    for m in unread_msgs:
        m.is_read = True
    if unread_msgs:
        db.commit()

    return db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()

@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: int,
    msg_in: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    part = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == current_user.id
    ).first()
    if not part and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a participant in this conversation")

    msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=msg_in.content
    )
    db.add(msg)
    conv.updated_at = func.now()
    db.commit()
    db.refresh(msg)


    # Broadcast via WebSocket
    await manager.broadcast(conversation_id, {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "sender_id": msg.sender_id,
        "content": msg.content,
        "created_at": msg.created_at.isoformat()
    })

    return msg

@router.websocket("/ws/{conversation_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    conversation_id: int,
    token: str = Query(...)
):
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    user_id = int(payload.get("sub", 0))
    db = SessionLocal()
    try:
        part = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id
        ).first()
        if not part:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    finally:
        db.close()

    await manager.connect(conversation_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            content = data.get("content", "").strip()
            if content:
                db = SessionLocal()
                try:
                    new_msg = Message(conversation_id=conversation_id, sender_id=user_id, content=content)
                    db.add(new_msg)
                    db.commit()
                    db.refresh(new_msg)
                    broadcast_data = {
                        "id": new_msg.id,
                        "conversation_id": conversation_id,
                        "sender_id": user_id,
                        "content": content,
                        "created_at": new_msg.created_at.isoformat()
                    }
                finally:
                    db.close()
                await manager.broadcast(conversation_id, broadcast_data)
    except WebSocketDisconnect:
        manager.disconnect(conversation_id, websocket)


from pydantic import BaseModel, Field
from typing import Optional, Any
from app.ai.chat_service import process_chat_message

class UniversalAIChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str = Field(..., min_length=1)
    language: Optional[str] = "en"

@router.post("", tags=["AI Chatbot"])
@router.post("/", tags=["AI Chatbot"])
async def universal_ai_chat_endpoint(
    req: UniversalAIChatRequest,
    db: Session = Depends(get_db)
):
    """
    POST /api/chat
    Direct SAI AI Chatbot endpoint compliant with Prompt specification §36.
    """
    res = await process_chat_message(
        db=db,
        message=req.message,
        conversation_id=req.conversation_id,
        language=req.language or "en"
    )
    return {
        "message": res["message"],
        "reply": res["message"],
        "intent": res["intent"],
        "properties": res.get("properties", []),
        "comparison": res.get("comparison"),
        "suggestions": [
            "Compare top properties",
            "Which is cheaper?",
            "Which has more area?",
            "Investment analysis"
        ],
        "conversation_id": res["conversation_id"],
        "language": res.get("language", "en"),
        "map_data": res.get("map_data")
    }

