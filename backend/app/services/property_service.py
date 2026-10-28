from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.property import Property
from app.models.property_media import PropertyMedia
from app.models.property_walkthrough import PropertyWalkthrough
from app.models.user import User, UserRole
from app.schemas.property import (
    PropertyCreate, PropertyUpdate, PropertyCompareItem, PropertyCompareResponse
)
from app.core.permissions import verify_property_ownership
from app.ai.nlp_parser import invalidate_location_cache

def create_property(db: Session, property_in: PropertyCreate, current_user: User) -> Property:
    prop_data = property_in.model_dump(exclude={"media_urls"})
    
    # Assign creator IDs strictly based on authenticated role
    if current_user.role == UserRole.SELLER:
        prop_data["owner_id"] = current_user.id
    elif current_user.role == UserRole.AGENT:
        prop_data["agent_id"] = current_user.id
    elif current_user.role == UserRole.BUILDER:
        prop_data["builder_id"] = current_user.id
    elif current_user.role == UserRole.SUPER_ADMIN:
        prop_data["owner_id"] = current_user.id
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Buyers are not permitted to create property listings"
        )
    
    prop = Property(**prop_data)
    db.add(prop)
    db.commit()
    db.refresh(prop)

    # Add media items if provided
    if property_in.media_urls:
        for idx, url in enumerate(property_in.media_urls):
            media = PropertyMedia(
                property_id=prop.id,
                url=url,
                media_type="image",
                sort_order=idx
            )
            db.add(media)
        db.commit()
        db.refresh(prop)

    # Invalidate NLP cache so new city/locality is immediately searchable
    invalidate_location_cache()

    return prop

def get_property_by_id(db: Session, property_id: int) -> Property:
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Property with ID {property_id} not found"
        )
    return prop

def update_property(
    db: Session,
    property_id: int,
    property_update: PropertyUpdate,
    current_user: User
) -> Property:
    prop = get_property_by_id(db, property_id)
    verify_property_ownership(prop, current_user)

    update_data = property_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prop, field, value)

    # Invalidate cached walkthrough so next request regenerates with updated property data
    db.query(PropertyWalkthrough).filter(PropertyWalkthrough.property_id == property_id).delete()

    db.commit()
    db.refresh(prop)
    return prop

def delete_property(db: Session, property_id: int, current_user: User) -> None:
    prop = get_property_by_id(db, property_id)
    verify_property_ownership(prop, current_user)

    db.delete(prop)
    db.commit()

def get_my_properties(db: Session, current_user: User) -> List[Property]:
    if current_user.role == UserRole.SELLER:
        return db.query(Property).filter(Property.owner_id == current_user.id).all()
    elif current_user.role == UserRole.AGENT:
        return db.query(Property).filter(Property.agent_id == current_user.id).all()
    elif current_user.role == UserRole.BUILDER:
        return db.query(Property).filter(Property.builder_id == current_user.id).all()
    elif current_user.role == UserRole.SUPER_ADMIN:
        return db.query(Property).all()
    return []

def compare_properties(
    db: Session,
    property_ids: List[Any],
    user_requirements: Optional[Dict[str, Any]] = None,
    priority: str = "balanced"
) -> PropertyCompareResponse:
    clean_ids = []
    for pid in property_ids:
        try:
            clean_ids.append(int(pid))
        except (ValueError, TypeError):
            continue

    if len(clean_ids) > 4:
        clean_ids = clean_ids[:4]

    props = db.query(Property).filter(Property.id.in_(clean_ids)).all()
    if len(props) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least two valid properties are required for comparison"
        )
    
    # Preserve requested order
    prop_map = {p.id: p for p in props}
    ordered_props = [prop_map[pid] for pid in clean_ids if pid in prop_map]

    from app.services.property_comparison_service import PropertyComparisonService
    comp_result = PropertyComparisonService.compare(
        db=db,
        properties=ordered_props,
        user_requirements=user_requirements,
        priority=priority
    )

    items = [PropertyCompareItem(**p) for p in comp_result["properties"]]

    return PropertyCompareResponse(
        properties=items,
        comparison=comp_result,
        differences=comp_result["differences"],
        matrix=comp_result["matrix"],
        comparable_fields=comp_result["comparable_fields"],
        requirement_match=comp_result["requirement_match"],
        advantages=comp_result["advantages"],
        considerations=comp_result["considerations"],
        summary=comp_result["summary"],
        common_amenities=comp_result["amenity_comparison"]["common"],
        price_difference=comp_result["price_analysis"]["difference"]
    )

