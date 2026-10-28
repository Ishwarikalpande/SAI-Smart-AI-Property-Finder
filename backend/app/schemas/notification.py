from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    type: str
    title: str
    message: str
    data: Dict[str, Any] = {}
    is_read: bool
    created_at: datetime


class NotificationMarkRead(BaseModel):
    notification_ids: Optional[list[int]] = None
    mark_all: Optional[bool] = False
