from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification

def create_notification(
    db: Session,
    user_id: int,
    notif_type: str,
    title: str,
    message: str,
    data: Optional[Dict[str, Any]] = None
) -> Notification:
    notif = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
        data=data or {},
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
