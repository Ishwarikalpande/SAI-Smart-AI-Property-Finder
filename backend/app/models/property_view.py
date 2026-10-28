from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class PropertyView(Base):
    __tablename__ = "property_views"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    viewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    ip_address = Column(String(50), nullable=True)
    viewed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    property = relationship("Property", foreign_keys=[property_id])
    viewer = relationship("User", foreign_keys=[viewer_id])
