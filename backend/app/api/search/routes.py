from typing import Optional, List
from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.property import PropertyListResponse, PropertyResponse
from app.schemas.search import (
    PropertySearchParams, NaturalLanguageSearchRequest, NaturalLanguageSearchResponse,
    VoiceSearchResponse
)
from app.services.search_service import search_properties
from app.ai.nlp_parser import parse_natural_language_query
from app.ai.voice import transcribe_audio_bytes

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("/", response_model=PropertyListResponse)
def structured_search(
    q: Optional[str] = None,
    city: Optional[str] = None,
    locality: Optional[str] = None,
    property_type: Optional[str] = None,
    listing_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_area: Optional[float] = None,
    max_area: Optional[float] = None,
    bhk: Optional[int] = None,
    furnishing: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_km: Optional[float] = None,
    sort_by: Optional[str] = "relevance",
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    params = PropertySearchParams(
        q=q,
        city=city,
        locality=locality,
        property_type=property_type,
        listing_type=listing_type,
        min_price=min_price,
        max_price=max_price,
        min_area=min_area,
        max_area=max_area,
        bhk=bhk,
        furnishing=furnishing,
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        sort_by=sort_by,
        page=page,
        limit=limit
    )
    items, total = search_properties(db, params)
    pages = (total + limit - 1) // limit if limit > 0 else 1

    return PropertyListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@router.post("/natural-language", response_model=NaturalLanguageSearchResponse)
async def natural_language_search(
    request: NaturalLanguageSearchRequest,
    db: Session = Depends(get_db)
):
    intent = await parse_natural_language_query(request.query, language=request.language)
    
    # Map intent to structured search parameters safely
    search_params = PropertySearchParams(
        city=intent.city or request.city,
        locality=intent.locality,
        property_type=intent.property_type,
        listing_type=intent.listing_type,
        bhk=intent.bhk,
        max_price=intent.max_price,
        min_price=intent.min_price,
        limit=20
    )
    items, total = search_properties(db, search_params)

    # Fallback to city/broad search if narrow parsed filters yield zero
    if total == 0 and intent.city:
        fallback_params = PropertySearchParams(city=intent.city, limit=20)
        items, total = search_properties(db, fallback_params)

    return NaturalLanguageSearchResponse(
        query=request.query,
        detected_language=request.language or "en",
        parsed_intent=intent,
        structured_filters=search_params.model_dump(exclude_none=True),
        items=[PropertyResponse.model_validate(p) for p in items],
        total=total
    )

@router.post("/voice", response_model=VoiceSearchResponse)
async def voice_search(
    audio: UploadFile = File(...),
    language: Optional[str] = Form("en"),
    city: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    audio_bytes = await audio.read()
    transcription, detected_lang = transcribe_audio_bytes(
        audio_bytes,
        content_type=audio.content_type or "audio/wav",
        target_language=language
    )

    intent = await parse_natural_language_query(transcription, language=detected_lang)
    search_params = PropertySearchParams(
        city=intent.city or city,
        locality=intent.locality,
        property_type=intent.property_type,
        listing_type=intent.listing_type,
        bhk=intent.bhk,
        max_price=intent.max_price,
        limit=20
    )
    items, total = search_properties(db, search_params)

    return VoiceSearchResponse(
        transcription=transcription,
        detected_language=detected_lang,
        parsed_intent=intent,
        items=[PropertyResponse.model_validate(p) for p in items],
        total=total
    )
