from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.models.user import User
from app.models.property import Property
from app.core.permissions import get_current_user
from app.ai.chat_service import process_chat_message
from app.ai.property_reasoning import (
    generate_property_comparison, PropertyComparisonResponse,
    score_property_recommendation, RecommendationScore
)
from app.ai.investment_analysis import analyze_property_investment, InvestmentAnalysisResult
from app.ai.language_service import SUPPORTED_LANGUAGES

router = APIRouter(prefix="/ai", tags=["AI & Qwen3"])

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    conversation_id: Optional[str] = None
    language: Optional[str] = "auto"

class CompareRequest(BaseModel):
    property_ids: List[int] = Field(..., min_length=2)
    language: Optional[str] = "en"

class RecommendRequest(BaseModel):
    budget_max: Optional[float] = None
    city: Optional[str] = "Pune"
    locality: Optional[str] = None
    bhk: Optional[int] = None
    purpose: Optional[str] = "end_use"
    limit: Optional[int] = 5

class InvestmentPredictRequest(BaseModel):
    property_id: int

@router.get("/languages")
def get_supported_languages():
    """Returns the EXACTLY 8 supported languages for SAI AI Property Finder."""
    return {
        "count": len(SUPPORTED_LANGUAGES),
        "languages": [
            {"code": code, "name": name}
            for code, name in SUPPORTED_LANGUAGES.items()
        ]
    }

@router.post("/chat")
async def ai_chat(
    req: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Unified multi-turn conversational endpoint powered by Qwen3.
    Supports auto language detection across 8 languages, context memory,
    and factual database grounding.
    """
    return await process_chat_message(
        db=db,
        message=req.message,
        conversation_id=req.conversation_id,
        language=req.language
    )

@router.post("/compare", response_model=PropertyComparisonResponse)
def ai_compare_properties(
    req: CompareRequest,
    db: Session = Depends(get_db)
):
    """
    Real AI property comparison across price, sqft, BHK, transit distance,
    RERA status, rental yields, and pros/cons. Never invents facts.
    """
    props = db.query(Property).filter(Property.id.in_(req.property_ids)).all()
    if len(props) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 valid properties in the database are required for comparison."
        )
    return generate_property_comparison(props, language=req.language or "en")

@router.post("/recommend", response_model=List[RecommendationScore])
def ai_recommend_properties(
    req: RecommendRequest,
    db: Session = Depends(get_db)
):
    """
    Transparent multi-criteria AI recommendations with explicit scoring dimensions:
    Budget fit, Location fit, Configuration fit, Amenity fit, and Investment fit.
    """
    query = db.query(Property).filter(Property.status == "available")
    if req.city:
        query = query.filter(Property.city.ilike(f"%{req.city}%"))
    if req.budget_max:
        query = query.filter(Property.price <= req.budget_max * 1.15)
    if req.bhk:
        query = query.filter(Property.bhk == req.bhk)

    props = query.limit(req.limit or 5).all()
    if not props:
        props = db.query(Property).filter(Property.status == "available").limit(req.limit or 5).all()

    scores = [
        score_property_recommendation(
            p,
            budget_max=req.budget_max,
            preferred_city=req.city,
            preferred_bhk=req.bhk,
            preferred_locality=req.locality,
            purpose=req.purpose or "end_use"
        )
        for p in props
    ]
    # Sort by overall match score descending
    scores.sort(key=lambda s: s.overall_match_score, reverse=True)
    return scores

@router.post("/investment-predict", response_model=InvestmentAnalysisResult)
def ai_investment_predict(
    req: InvestmentPredictRequest,
    db: Session = Depends(get_db)
):
    """
    Factual statistical and financial investment analysis for a property.
    Projects 1, 3, 5, and 10 year appreciation, rental yield, and holding period advice.
    """
    prop = db.query(Property).filter(Property.id == req.property_id).first()
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Property with ID {req.property_id} not found."
        )
    return analyze_property_investment(prop)
