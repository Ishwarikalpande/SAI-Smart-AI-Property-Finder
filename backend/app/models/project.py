from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    builder_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    address = Column(Text, nullable=True)
    locality = Column(String(100), nullable=False, index=True)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=True, index=True)
    country = Column(String(100), nullable=True, default="India", index=True)
    pincode = Column(String(10), nullable=True, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    construction_status = Column(String(50), default="Under Construction") # "Under Construction", "Ready to Move", "New Launch"
    expected_completion_date = Column(String(50), nullable=True)
    amenities = Column(JSON, default=list)
    status = Column(String(50), default="active")
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    builder = relationship("User", back_populates="builder_projects")
    buildings = relationship("Building", back_populates="project", cascade="all, delete-orphan")
    units = relationship("Unit", back_populates="project", cascade="all, delete-orphan")
    bookings = relationship("UnitBooking", back_populates="project", cascade="all, delete-orphan")

class Building(Base):
    __tablename__ = "buildings"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False) # e.g. "Tower A", "Tower C"
    code = Column(String(50), nullable=True) # e.g. "A"
    floors_count = Column(Integer, default=10, nullable=True)
    units_per_floor = Column(Integer, default=4, nullable=True)
    total_units = Column(Integer, default=40, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="Under Construction", nullable=True) # "Under Construction", "Ready to Move", "Completed"
    floor_height = Column(Float, default=3.2, nullable=True) # in meters
    building_width = Column(Float, default=36.0, nullable=True) # in meters
    building_depth = Column(Float, default=24.0, nullable=True) # in meters
    orientation = Column(Float, default=0.0, nullable=True) # degrees rotation from North (0 = North)
    front_direction = Column(String(50), default="North", nullable=True)
    entrance_position = Column(String(50), default="North", nullable=True)
    parking_levels = Column(Integer, default=2, nullable=True)
    amenities = Column(JSON, default=list)
    metadata_json = Column(JSON, default=dict)

    project = relationship("Project", back_populates="buildings")
    floors = relationship("Floor", back_populates="building", cascade="all, delete-orphan")
    units = relationship("Unit", back_populates="building", cascade="all, delete-orphan", foreign_keys="[Unit.tower_id]")
    bookings = relationship("UnitBooking", back_populates="building", cascade="all, delete-orphan")

class Floor(Base):
    __tablename__ = "floors"

    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False, index=True)
    floor_number = Column(Integer, nullable=False)
    floor_label = Column(String(50), nullable=True) # "Floor 20", "Penthouse Level"
    floor_type = Column(String(50), default="residential", nullable=True) # "residential", "parking", "amenity", "commercial", "podium", "penthouse"
    height_offset = Column(Float, nullable=True) # Y position in 3D meters
    metadata_json = Column(JSON, default=dict)

    building = relationship("Building", back_populates="floors")
    units = relationship("Unit", back_populates="floor", cascade="all, delete-orphan", foreign_keys="[Unit.floor_id]")

class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    tower_id = Column(Integer, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=True, index=True)
    floor_id = Column(Integer, ForeignKey("floors.id", ondelete="SET NULL"), nullable=True, index=True)
    floor_number = Column(Integer, default=1, nullable=True)
    unit_number = Column(String(50), nullable=False) # e.g. "C" or "20-C" or "2003"
    unit_label = Column(String(50), nullable=True) # e.g. "Flat 20-C"
    bhk = Column(Integer, nullable=False)
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True, default=2)
    balconies = Column(Integer, nullable=True, default=1)
    area_sqft = Column(Float, nullable=False)
    carpet_area = Column(Float, nullable=True)
    built_up_area = Column(Float, nullable=True)
    price = Column(Float, nullable=False)
    parking = Column(String(50), default="1 Covered")
    direction = Column(String(50), default="East", nullable=True) # North, South, East, West, North-East, North-West, South-East, South-West
    entrance_direction = Column(String(50), default="North", nullable=True)
    balcony_direction = Column(String(50), default="East", nullable=True)
    position_x = Column(Float, default=0.0, nullable=True) # X coordinate in floor grid
    position_y = Column(Float, default=0.0, nullable=True) # Y coordinate (height / floor)
    position_z = Column(Float, default=0.0, nullable=True) # Z coordinate in floor grid
    wing = Column(String(50), nullable=True) # "East Wing", "Corridor Left"
    floor_plan_url = Column(String(500), nullable=True)
    floor_plan_data = Column(JSON, default=dict)
    config_3d_id = Column(Integer, nullable=True)
    status = Column(String(50), default="available", nullable=False, index=True) # "available", "reserved", "booked", "sold", "blocked"
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    project = relationship("Project", back_populates="units")
    building = relationship("Building", back_populates="units", foreign_keys=[tower_id])
    floor = relationship("Floor", back_populates="units", foreign_keys=[floor_id])
    bookings = relationship("UnitBooking", back_populates="unit", cascade="all, delete-orphan")
    audit_logs = relationship("BookingAuditLog", back_populates="unit", cascade="all, delete-orphan")

class UnitBooking(Base):
    __tablename__ = "unit_bookings"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=True, index=True)
    status = Column(String(50), default="booked", nullable=False, index=True) # "reserved", "booked", "cancelled", "completed"
    price = Column(Float, nullable=False)
    booking_amount = Column(Float, default=50000.0, nullable=False)
    buyer_name = Column(String(100), nullable=True)
    buyer_email = Column(String(100), nullable=True)
    buyer_phone = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    unit = relationship("Unit", back_populates="bookings")
    user = relationship("User")
    project = relationship("Project", back_populates="bookings")
    building = relationship("Building", back_populates="bookings")

class BookingAuditLog(Base):
    __tablename__ = "booking_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    booking_id = Column(Integer, ForeignKey("unit_bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(50), nullable=False) # "reserve", "book", "cancel", "block", "release"
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    unit = relationship("Unit", back_populates="audit_logs")
    user = relationship("User")
