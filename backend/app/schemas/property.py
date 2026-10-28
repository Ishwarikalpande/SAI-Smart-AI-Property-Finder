from typing import Optional, List, Any, Dict, Union
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class PropertyMediaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    media_type: str
    media_category: Optional[str] = "other"
    url: str
    file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    sort_order: int

class PropertyBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    property_type: str = Field(..., description="apartment, villa, plot, office, studio, penthouse")
    listing_type: str = Field(..., description="buy, rent, commercial, new-projects")
    bhk: Optional[int] = Field(None, ge=1, le=20)
    area_sqft: float = Field(..., gt=0)
    price: float = Field(..., gt=0)
    price_display: Optional[str] = None
    furnishing: Optional[str] = "unfurnished"
    amenities: List[str] = Field(default_factory=list)
    address: Optional[str] = None
    locality: str = Field(..., min_length=2, max_length=100)
    city: str = Field(..., min_length=2, max_length=100)
    state: Optional[str] = None
    country: Optional[str] = "India"
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = "available"
    is_verified: Optional[bool] = False
    is_rera: Optional[bool] = False
    badge: Optional[str] = "Standard"
    match_score: Optional[int] = 90
    rating: Optional[float] = 4.5
    dist_metro: Optional[str] = None
    sponsored: Optional[bool] = False
    sponsored_label: Optional[str] = None

class PropertyCreate(PropertyBase):
    media_urls: Optional[List[str]] = None

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[str] = None
    listing_type: Optional[str] = None
    bhk: Optional[int] = None
    area_sqft: Optional[float] = None
    price: Optional[float] = None
    price_display: Optional[str] = None
    furnishing: Optional[str] = None
    amenities: Optional[List[str]] = None
    address: Optional[str] = None
    locality: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = None
    is_verified: Optional[bool] = None
    is_rera: Optional[bool] = None
    badge: Optional[str] = None
    sponsored: Optional[bool] = None
    sponsored_label: Optional[str] = None

class PropertyResponse(PropertyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: Optional[int] = None
    agent_id: Optional[int] = None
    builder_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    media: List[PropertyMediaResponse] = []


class PropertyListResponse(BaseModel):
    items: List[PropertyResponse]
    total: int
    page: int
    limit: int
    pages: int

class PropertyCompareRequest(BaseModel):
    property_ids: List[Union[int, str]] = Field(..., min_length=2, max_length=4)
    conversation_id: Optional[str] = None
    user_requirements: Optional[Dict[str, Any]] = None
    priority: Optional[str] = "balanced"

class PropertyCompareItem(BaseModel):
    id: int
    title: str
    price: float
    price_display: Optional[str] = None
    bhk: Optional[int] = None
    area_sqft: float
    property_type: str
    listing_type: str
    furnishing: Optional[str] = None
    amenities: List[str] = Field(default_factory=list)
    locality: str
    city: str
    state: Optional[str] = None
    country: Optional[str] = None
    dist_metro: Optional[str] = None
    rating: float = 4.5
    is_rera: bool = False
    is_verified: bool = False
    image_url: Optional[str] = None
    price_per_sqft: Optional[float] = None
    price_per_sqft_display: Optional[str] = None
    possession_status: Optional[str] = None
    possession_date: Optional[str] = None
    has_parking: Optional[bool] = None
    parking_display: Optional[str] = None

class PropertyCompareResponse(BaseModel):
    properties: List[PropertyCompareItem]
    comparison: Optional[Dict[str, Any]] = None
    differences: List[str] = Field(default_factory=list)
    matrix: Dict[str, List[Any]] = Field(default_factory=dict)
    comparable_fields: Dict[str, List[Any]] = Field(default_factory=dict)
    requirement_match: Optional[List[Dict[str, Any]]] = None
    advantages: Optional[Dict[Union[str, int], Any]] = None
    considerations: Optional[Dict[Union[str, int], Any]] = None
    summary: Optional[str] = None
    common_amenities: List[str] = Field(default_factory=list)
    price_difference: Optional[float] = None
