"""
Dynamic Location API — Database-driven endpoints for cities, localities, states.
No hardcoded city lists. All data comes from the properties and projects tables.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import distinct, func

from app.db.session import get_db
from app.models.property import Property
from app.models.project import Project

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("/cities", response_model=List[str])
def get_cities(
    state: Optional[str] = None,
    country: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns all distinct cities from properties + projects. Fully dynamic — no hardcoding."""
    prop_cities = db.query(distinct(func.lower(Property.city))).filter(Property.city.isnot(None))
    proj_cities = db.query(distinct(func.lower(Project.city))).filter(Project.city.isnot(None))

    if state:
        prop_cities = prop_cities.filter(Property.state.ilike(f"%{state}%"))
        proj_cities = proj_cities.filter(Project.state.ilike(f"%{state}%"))
    if country:
        prop_cities = prop_cities.filter(Property.country.ilike(f"%{country}%"))
        proj_cities = proj_cities.filter(Project.country.ilike(f"%{country}%"))

    all_cities_lower = set()
    for (c,) in prop_cities.all():
        if c:
            all_cities_lower.add(c.strip())
    for (c,) in proj_cities.all():
        if c:
            all_cities_lower.add(c.strip())

    # Return title-cased, sorted
    return sorted([c.title() for c in all_cities_lower])


@router.get("/localities", response_model=List[str])
def get_localities(
    city: Optional[str] = None,
    state: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns all distinct localities, optionally filtered by city."""
    query = db.query(distinct(Property.locality)).filter(Property.locality.isnot(None))
    if city:
        query = query.filter(Property.city.ilike(f"%{city}%"))
    if state:
        query = query.filter(Property.state.ilike(f"%{state}%"))

    localities = sorted(set(loc.strip().title() for (loc,) in query.all() if loc))
    return localities


@router.get("/states", response_model=List[str])
def get_states(
    country: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns all distinct states from properties."""
    query = db.query(distinct(Property.state)).filter(Property.state.isnot(None))
    if country:
        query = query.filter(Property.country.ilike(f"%{country}%"))

    states = sorted(set(s.strip().title() for (s,) in query.all() if s))
    return states


@router.get("/search", response_model=List[dict])
def search_locations(
    q: str = Query(..., min_length=1, max_length=100, description="Search query for city/locality/pincode"),
    db: Session = Depends(get_db)
):
    """
    Generic location search — searches across city, locality, state, and pincode.
    Used by autocomplete/typeahead in the frontend.
    """
    term = f"%{q}%"
    results = []
    seen = set()

    # Search cities
    city_matches = db.query(
        Property.city, Property.state, Property.country
    ).filter(
        Property.city.ilike(term)
    ).distinct().limit(10).all()

    for city, state, country in city_matches:
        key = f"city:{city}"
        if key not in seen and city:
            seen.add(key)
            results.append({
                "type": "city",
                "name": city.strip().title(),
                "state": (state or "").strip().title(),
                "country": (country or "India").strip().title()
            })

    # Search localities
    loc_matches = db.query(
        Property.locality, Property.city, Property.state
    ).filter(
        Property.locality.ilike(term)
    ).distinct().limit(10).all()

    for locality, city, state in loc_matches:
        key = f"locality:{locality}:{city}"
        if key not in seen and locality:
            seen.add(key)
            results.append({
                "type": "locality",
                "name": locality.strip().title(),
                "city": (city or "").strip().title(),
                "state": (state or "").strip().title()
            })

    # Search pincodes
    if q.isdigit():
        pin_matches = db.query(
            Property.pincode, Property.city, Property.state
        ).filter(
            Property.pincode.ilike(term)
        ).distinct().limit(5).all()

        for pincode, city, state in pin_matches:
            key = f"pincode:{pincode}"
            if key not in seen and pincode:
                seen.add(key)
                results.append({
                    "type": "pincode",
                    "name": pincode,
                    "city": (city or "").strip().title(),
                    "state": (state or "").strip().title()
                })

    return results
