from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.db.session import get_db
from app.models.user import User, UserRole, BuyerProfile, SellerProfile, AgentProfile, BuilderProfile
from app.models.search_history import BuyerPreference
from app.core.permissions import get_current_active_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/profile")
def get_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    profile_data = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role.value,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at
    }

    if current_user.role == UserRole.BUYER:
        prof = db.query(BuyerProfile).filter(BuyerProfile.user_id == current_user.id).first()
        if prof:
            profile_data["buyer_profile"] = {
                "preferred_city": prof.preferred_city,
                "preferred_language": prof.preferred_language,
                "budget_min": prof.budget_min,
                "budget_max": prof.budget_max,
                "preferred_bhk": prof.preferred_bhk,
                "accessibility_mode": prof.accessibility_mode
            }
    elif current_user.role == UserRole.SELLER:
        prof = db.query(SellerProfile).filter(SellerProfile.user_id == current_user.id).first()
        if prof:
            profile_data["seller_profile"] = {
                "company_name": prof.company_name,
                "pan_number": prof.pan_number
            }
    elif current_user.role == UserRole.AGENT:
        prof = db.query(AgentProfile).filter(AgentProfile.user_id == current_user.id).first()
        if prof:
            profile_data["agent_profile"] = {
                "agency_name": prof.agency_name,
                "license_number": prof.license_number,
                "experience_years": prof.experience_years,
                "rera_id": prof.rera_id
            }
    elif current_user.role == UserRole.BUILDER:
        prof = db.query(BuilderProfile).filter(BuilderProfile.user_id == current_user.id).first()
        if prof:
            profile_data["builder_profile"] = {
                "company_name": prof.company_name,
                "developer_registration_no": prof.developer_registration_no,
                "office_address": prof.office_address
            }

    return profile_data

@router.put("/preferences")
def update_buyer_preferences(
    prefs: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    buyer_pref = db.query(BuyerPreference).filter(BuyerPreference.user_id == current_user.id).first()
    if not buyer_pref:
        buyer_pref = BuyerPreference(user_id=current_user.id)
        db.add(buyer_pref)
    
    for key, val in prefs.items():
        if hasattr(buyer_pref, key):
            setattr(buyer_pref, key, val)

    db.commit()
    return {"message": "Preferences updated successfully"}
