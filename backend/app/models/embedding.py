from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class PropertyEmbedding(Base):
    __tablename__ = "property_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), unique=True, nullable=False)
    embedding_json = Column(JSON, nullable=False) # list of floats for embedding vector
    embedding_model = Column(String(100), default="all-MiniLM-L6-v2")
    source_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    property = relationship("Property")
