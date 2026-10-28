from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    query_text = Column(String(500), nullable=False)
    query_type = Column(String(50), default="keyword") # "keyword", "natural_language", "voice"
    parsed_filters = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User")

class BuyerPreference(Base):
    __tablename__ = "buyer_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    preferred_cities = Column(JSON, default=list) # ["Pune", "Mumbai"]
    preferred_localities = Column(JSON, default=list)
    min_budget = Column(Integer, nullable=True)
    max_budget = Column(Integer, nullable=True)
    property_types = Column(JSON, default=list) # ["apartment", "villa"]
    preferred_bhks = Column(JSON, default=list) # [2, 3]
    amenities = Column(JSON, default=list)
    nearby_facilities = Column(JSON, default=list)
    accessibility_needs = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User")
