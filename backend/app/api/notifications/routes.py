from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, NotificationMarkRead
from app.core.permissions import get_current_active_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[NotificationResponse])
def get_user_notifications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).limit(50).all()

@router.post("/mark-read", status_code=status.HTTP_200_OK)
def mark_notifications_read(
    payload: NotificationMarkRead,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if payload.mark_all:
        db.query(Notification).filter(Notification.user_id == current_user.id).update({"is_read": True})
    elif payload.notification_ids:
        db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.id.in_(payload.notification_ids)
        ).update({"is_read": True}, synchronize_session=False)
    
    db.commit()
    return {"message": "Notifications updated"}
