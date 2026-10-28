from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class PropertyMedia(Base):
    __tablename__ = "property_media"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    media_type = Column(String(20), default="image", nullable=False)   # "image", "video", "360"
    media_category = Column(String(50), default="other", nullable=False, index=True) # "exterior", "living_room", "kitchen", "bedroom", "bathroom", "balcony", "amenity", "location", "other"
    url = Column(String(1000), nullable=False)
    thumbnail_url = Column(String(1000), nullable=True)
    storage_key = Column(String(500), nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    @property
    def file_url(self) -> str:
        return self.url

    property = relationship("Property", back_populates="media")
