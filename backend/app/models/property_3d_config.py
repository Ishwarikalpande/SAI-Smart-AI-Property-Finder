from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class PropertyRoom(Base):
    __tablename__ = "property_rooms"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    room_type = Column(String(50), nullable=False, index=True) # "living_room", "kitchen", "bedroom", "bathroom", "balcony", etc.
    position_x = Column(Float, default=0.0)
    position_y = Column(Float, default=0.0)
    position_z = Column(Float, default=0.0)
    width = Column(Float, default=4.0)
    length = Column(Float, default=4.0)
    height = Column(Float, default=2.85)
    order_index = Column(Integer, default=1)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    property = relationship("Property", backref="configured_rooms")


class Property3DConfig(Base):
    __tablename__ = "property_3d_configs"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    version = Column(Integer, default=1, nullable=False)
    scene_json = Column(JSON, nullable=False)
    camera_path_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    property = relationship("Property", backref="three_d_config")
