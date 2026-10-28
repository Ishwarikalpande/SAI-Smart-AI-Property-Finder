from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc

from app.models.property import Property
from app.schemas.search import PropertySearchParams
from app.services.geospatial_service import haversine_distance

def search_properties(db: Session, params: PropertySearchParams) -> Tuple[List[Property], int]:
    query = db.query(Property)

    # Status filter
    if params.status:
        query = query.filter(Property.status == params.status)

    # City filter (case-insensitive substring)
    if params.city:
        query = query.filter(Property.city.ilike(f"%{params.city}%"))

    # Locality filter
    if params.locality:
        query = query.filter(Property.locality.ilike(f"%{params.locality}%"))

    # State filter
    if params.state:
        query = query.filter(Property.state.ilike(f"%{params.state}%"))

    # Pincode filter
    if params.pincode:
        query = query.filter(Property.pincode == params.pincode)

    # Property type (e.g. apartment, villa, office)
    if params.property_type:
        query = query.filter(Property.property_type.ilike(f"%{params.property_type}%"))

    # Listing type (buy, rent, commercial, new-projects)
    if params.listing_type:
        query = query.filter(Property.listing_type == params.listing_type)

    # BHK filter
    if params.bhk:
        query = query.filter(Property.bhk == params.bhk)

    # Price range
    if params.min_price is not None:
        query = query.filter(Property.price >= params.min_price)
    if params.max_price is not None:
        query = query.filter(Property.price <= params.max_price)

    # Area range
    if params.min_area is not None:
        query = query.filter(Property.area_sqft >= params.min_area)
    if params.max_area is not None:
        query = query.filter(Property.area_sqft <= params.max_area)

    # Furnishing
    if params.furnishing:
        query = query.filter(Property.furnishing.ilike(f"%{params.furnishing}%"))

    # Free text search across title, description, locality, and city
    if params.q:
        q_term = f"%{params.q}%"
        query = query.filter(
            or_(
                Property.title.ilike(q_term),
                Property.description.ilike(q_term),
                Property.locality.ilike(q_term),
                Property.city.ilike(q_term),
                Property.property_type.ilike(q_term)
            )
        )

    # Sort options
    if params.sort_by == "price_low":
        query = query.order_by(asc(Property.price))
    elif params.sort_by == "price_high":
        query = query.order_by(desc(Property.price))
    elif params.sort_by == "newest":
        query = query.order_by(desc(Property.created_at))
    elif params.sort_by == "area":
        query = query.order_by(desc(Property.area_sqft))
    else:
        # Default / relevance: sponsored first, then match_score, then rating
        query = query.order_by(desc(Property.sponsored), desc(Property.match_score), desc(Property.rating))

    total = query.count()

    # Pagination
    offset = (params.page - 1) * params.limit
    results = query.offset(offset).limit(params.limit).all()

    # Geospatial post-filter if radius_km and coordinates are specified
    if params.latitude and params.longitude and params.radius_km:
        filtered_results = []
        for prop in results:
            if prop.latitude and prop.longitude:
                dist = haversine_distance(params.latitude, params.longitude, prop.latitude, prop.longitude)
                if dist <= params.radius_km:
                    filtered_results.append(prop)
        results = filtered_results
        total = len(results)

    return results, total
