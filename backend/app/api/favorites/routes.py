from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.favorite import Favorite
from app.models.property import Property
from app.schemas.property import PropertyResponse
from app.core.permissions import get_current_active_user

router = APIRouter(prefix="/favorites", tags=["Favorites"])

@router.get("", response_model=List[PropertyResponse])
@router.get("/", response_model=List[PropertyResponse])
def list_favorites(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    favs = db.query(Favorite).filter(Favorite.user_id == current_user.id).all()
    prop_ids = [f.property_id for f in favs]
    if not prop_ids:
        return []
    return db.query(Property).filter(Property.id.in_(prop_ids)).all()

@router.post("/{property_id}", status_code=status.HTTP_201_CREATED)
def add_favorite(
    property_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    
    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.property_id == property_id
    ).first()
    if existing:
        return {"message": "Property already in favorites"}

    fav = Favorite(user_id=current_user.id, property_id=property_id)
    db.add(fav)
    db.commit()
    return {"message": "Property added to favorites"}

@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    property_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.property_id == property_id
    ).first()
    if fav:
        db.delete(fav)
        db.commit()
    return None

saved_properties_router = APIRouter(prefix="/saved-properties", tags=["Saved Properties"])
saved_properties_router.add_api_route("", list_favorites, methods=["GET"], response_model=List[PropertyResponse])
saved_properties_router.add_api_route("/", list_favorites, methods=["GET"], response_model=List[PropertyResponse])
saved_properties_router.add_api_route("/{property_id}", add_favorite, methods=["POST"], status_code=status.HTTP_201_CREATED)
saved_properties_router.add_api_route("/{property_id}", remove_favorite, methods=["DELETE"], status_code=status.HTTP_204_NO_CONTENT)
