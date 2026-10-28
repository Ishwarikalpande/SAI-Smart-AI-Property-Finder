from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.property import Property
from app.models.comparison import PropertyComparison
from app.schemas.property import PropertyResponse
from app.core.permissions import get_current_active_user

router = APIRouter(prefix="/compare", tags=["Compare"])

MAX_COMPARISON_LIMIT = 4

@router.get("")
@router.get("/")
def get_user_comparisons(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Returns user's saved compared properties with comparison matrix and metrics.
    """
    comparisons = (
        db.query(PropertyComparison)
        .filter(PropertyComparison.user_id == current_user.id)
        .order_by(PropertyComparison.created_at.desc())
        .limit(MAX_COMPARISON_LIMIT)
        .all()
    )
    property_ids = [c.property_id for c in comparisons]
    
    if not property_ids:
        return {
            "total": 0,
            "properties": [],
            "matrix": {}
        }

    props = db.query(Property).filter(Property.id.in_(property_ids)).all()
    
    # Sort in the order saved
    props_dict = {p.id: p for p in props}
    ordered_props = [props_dict[pid] for pid in property_ids if pid in props_dict]

    # Calculate comparison matrix
    matrix = {
        "Price": [p.price_display or f"₹{p.price:,.0f}" for p in ordered_props],
        "Price / Sq.Ft": [f"₹{round(p.price / p.area_sqft):,}/sq.ft" if p.area_sqft > 0 else "N/A" for p in ordered_props],
        "BHK": [f"{p.bhk} BHK" if p.bhk else "N/A" for p in ordered_props],
        "Area": [f"{p.area_sqft:,.0f} sq.ft" for p in ordered_props],
        "Property Type": [p.property_type.capitalize() for p in ordered_props],
        "Listing Type": [p.listing_type.upper() for p in ordered_props],
        "Locality": [p.locality for p in ordered_props],
        "City": [p.city for p in ordered_props],
        "Furnishing": [(p.furnishing or "Unfurnished").capitalize() for p in ordered_props],
        "RERA Verified": ["Yes" if p.is_rera else "Pending" for p in ordered_props],
        "AI Match Score": [f"{p.match_score}%" for p in ordered_props],
        "Rating": [f"★ {p.rating}" for p in ordered_props],
        "Amenities": [", ".join(p.amenities[:5]) if p.amenities else "Basic" for p in ordered_props],
        "Status": [p.status.capitalize() for p in ordered_props],
    }

    serialized_props = []
    for p in ordered_props:
        img_url = p.media[0].url if p.media and len(p.media) > 0 else None
        serialized_props.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "property_type": p.property_type,
            "listing_type": p.listing_type,
            "bhk": p.bhk,
            "area_sqft": p.area_sqft,
            "price": p.price,
            "price_display": p.price_display,
            "locality": p.locality,
            "city": p.city,
            "furnishing": p.furnishing,
            "amenities": p.amenities or [],
            "is_verified": p.is_verified,
            "is_rera": p.is_rera,
            "match_score": p.match_score,
            "rating": p.rating,
            "badge": p.badge,
            "status": p.status,
            "image": img_url,
            "images": [m.url for m in p.media] if p.media else []
        })

    return {
        "total": len(ordered_props),
        "properties": serialized_props,
        "matrix": matrix
    }

@router.post("/{property_id}", status_code=status.HTTP_201_CREATED)
def add_to_comparison(
    property_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    existing = db.query(PropertyComparison).filter(
        PropertyComparison.user_id == current_user.id,
        PropertyComparison.property_id == property_id
    ).first()
    if existing:
        count = db.query(PropertyComparison).filter(PropertyComparison.user_id == current_user.id).count()
        return {"message": "Property already in comparison", "comparison_count": count}

    count = db.query(PropertyComparison).filter(PropertyComparison.user_id == current_user.id).count()
    if count >= MAX_COMPARISON_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You can compare at most {MAX_COMPARISON_LIMIT} properties at a time. Remove one first."
        )

    comp = PropertyComparison(user_id=current_user.id, property_id=property_id)
    db.add(comp)
    db.commit()

    new_count = db.query(PropertyComparison).filter(PropertyComparison.user_id == current_user.id).count()
    return {"message": "Property added to comparison", "comparison_count": new_count}

@router.delete("/{property_id}", status_code=status.HTTP_200_OK)
def remove_from_comparison(
    property_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    comp = db.query(PropertyComparison).filter(
        PropertyComparison.user_id == current_user.id,
        PropertyComparison.property_id == property_id
    ).first()
    if comp:
        db.delete(comp)
        db.commit()

    new_count = db.query(PropertyComparison).filter(PropertyComparison.user_id == current_user.id).count()
    return {"message": "Property removed from comparison", "comparison_count": new_count}
