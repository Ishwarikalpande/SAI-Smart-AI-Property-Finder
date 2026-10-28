from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.property import PropertyResponse

class PropertySearchParams(BaseModel):
    q: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    property_type: Optional[str] = None
    listing_type: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_area: Optional[float] = None
    max_area: Optional[float] = None
    bhk: Optional[int] = None
    furnishing: Optional[str] = None
    amenities: Optional[List[str]] = None
    status: Optional[str] = "available"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: Optional[float] = None
    nearby_facility: Optional[str] = None
    sort_by: Optional[str] = "relevance" # "newest", "price_low", "price_high", "area", "distance", "relevance"
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)

class NaturalLanguageSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500, description="e.g. 2 BHK near hospital in Pune under 60 lakh")
    city: Optional[str] = None
    language: Optional[str] = "en"

class ParsedIntent(BaseModel):
    bhk: Optional[int] = None
    max_price: Optional[float] = None
    min_price: Optional[float] = None
    property_type: Optional[str] = None
    listing_type: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None
    nearby_facility: Optional[str] = None
    radius_meters: Optional[int] = 2000
    preferences: List[str] = Field(default_factory=list)
    confidence: float = 0.9

class NaturalLanguageSearchResponse(BaseModel):
    query: str
    detected_language: str
    parsed_intent: ParsedIntent
    structured_filters: Dict[str, Any]
    items: List[PropertyResponse]
    total: int

class VoiceSearchResponse(BaseModel):
    transcription: str
    detected_language: str
    parsed_intent: ParsedIntent
    items: List[PropertyResponse]
    total: int
