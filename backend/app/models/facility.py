from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    type = Column(String(50), nullable=False, index=True)   # "hospital", "school", "metro", "temple", "company", "market", "park", "bank"
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(255), nullable=True)
    metadata_json = Column(JSON, default=dict)

    property_links = relationship("PropertyFacility", back_populates="facility", cascade="all, delete-orphan")

class PropertyFacility(Base):
    __tablename__ = "property_facilities"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    facility_id = Column(Integer, ForeignKey("facilities.id", ondelete="CASCADE"), nullable=False, index=True)
    distance_meters = Column(Float, nullable=True)

    property = relationship("Property", back_populates="facility_links")
    facility = relationship("Facility", back_populates="property_links")
