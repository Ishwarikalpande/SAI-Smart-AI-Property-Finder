from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.facility import Facility
from app.services.geospatial_service import haversine_distance

router = APIRouter(prefix="/facilities", tags=["Facilities"])

@router.get("/")
def list_facilities(
    type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Facility)
    if type:
        query = query.filter(Facility.type == type)
    return query.limit(100).all()

@router.get("/nearby")
def get_nearby_facilities(
    lat: float = Query(...),
    lon: float = Query(...),
    radius_km: float = Query(5.0),
    type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Facility)
    if type:
        query = query.filter(Facility.type == type)
    all_facs = query.all()

    nearby = []
    for f in all_facs:
        dist = haversine_distance(lat, lon, f.latitude, f.longitude)
        if dist <= radius_km:
            nearby.append({
                "id": f.id,
                "name": f.name,
                "type": f.type,
                "latitude": f.latitude,
                "longitude": f.longitude,
                "address": f.address,
                "distance_km": dist
            })
    
    nearby.sort(key=lambda x: x["distance_km"])
    return nearby
