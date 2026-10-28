from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class WalkthroughRoom(BaseModel):
    id: str
    name: str
    type: str # "exterior", "entrance", "living_room", "dining", "kitchen", "bedroom", "bathroom", "balcony", "amenities", "location", "summary", etc.
    order: int = 1
    duration: int = 4
    image_url: Optional[str] = None
    has_actual_image: bool = False
    bedroom_number: Optional[int] = None
    bathroom_number: Optional[int] = None
    balcony_number: Optional[int] = None
    data: Optional[Dict[str, Any]] = None

class WalkthroughScene(BaseModel):
    id: str
    title: str
    name: Optional[str] = None
    type: Optional[str] = None
    order: Optional[int] = 1
    duration: int = 4
    image_url: Optional[str] = None
    has_actual_image: Optional[bool] = False
    category: Optional[str] = None
    animation: Optional[str] = "ken-burns"
    subtitle: Optional[str] = None
    bedroom_number: Optional[int] = None
    bathroom_number: Optional[int] = None
    balcony_number: Optional[int] = None
    data: Optional[Dict[str, Any]] = None

class WalkthroughPropertyInfo(BaseModel):
    title: str
    property_type: Optional[str] = None
    bhk: Optional[int] = None
    area: Optional[str] = None
    price: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None

class PropertyWalkthroughResponse(BaseModel):
    property_id: int
    title: str
    duration: int
    property: Optional[WalkthroughPropertyInfo] = None
    rooms: List[WalkthroughRoom] = Field(default_factory=list)
    scenes: List[WalkthroughScene] = Field(default_factory=list)
    theme: Optional[str] = "premium-real-estate"
    transition: Optional[str] = "cinematic"

class WalkthroughGenerateRequest(BaseModel):
    force: bool = False

class WalkthroughGenerateResponse(BaseModel):
    property_id: int
    status: str
    walkthrough_id: str
    scene_count: int
    version: int

class WalkthroughRenderJobResponse(BaseModel):
    status: str
    job_id: str
    property_id: int
    video_url: Optional[str] = None
    progress: Optional[int] = 0
    message: Optional[str] = None

