from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class UnitBase(BaseModel):
    unit_number: str
    bhk: int = Field(..., ge=1, le=10)
    area_sqft: float = Field(..., gt=0)
    carpet_area: Optional[float] = None
    price: float = Field(..., gt=0)
    parking: Optional[str] = "1 Covered"
    status: Optional[str] = "available"

class UnitCreate(UnitBase):
    project_id: int
    floor_id: Optional[int] = None

class UnitResponse(UnitBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    floor_id: Optional[int]
    created_at: datetime

class FloorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    building_id: int
    floor_number: int
    units: List[UnitResponse] = []

class BuildingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    name: str
    floors: List[FloorResponse] = []

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    address: Optional[str] = None
    locality: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    construction_status: Optional[str] = "Under Construction"
    expected_completion_date: Optional[str] = None
    amenities: List[str] = []

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    builder_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    buildings: List[BuildingResponse] = []
    units: List[UnitResponse] = []

