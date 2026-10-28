from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.property import Property
from app.models.user import User
from app.models.search_history import BuyerPreference, SearchHistory
from app.models.favorite import Favorite

def get_personalized_recommendations(db: Session, user: User, limit: int = 6) -> List[Property]:
    """
    Hybrid recommendation engine:
    1. Check user BuyerPreference (budget, preferred city, bhk, property types).
    2. Check favorite properties for common traits.
    3. Filter matching properties, rank by score, return top matches.
    """
    pref = db.query(BuyerPreference).filter(BuyerPreference.user_id == user.id).first()
    
    query = db.query(Property).filter(Property.status == "available")

    if pref:
        if pref.preferred_cities:
            query = query.filter(Property.city.in_(pref.preferred_cities))
        if pref.max_budget:
            query = query.filter(Property.price <= pref.max_budget)
        if pref.min_budget:
            query = query.filter(Property.price >= pref.min_budget)
        if pref.preferred_bhks:
            query = query.filter(Property.bhk.in_(pref.preferred_bhks))
        if pref.property_types:
            query = query.filter(Property.property_type.in_(pref.property_types))

    # Order by match score, rating, and verified status
    recs = query.order_by(
        desc(Property.is_verified),
        desc(Property.match_score),
        desc(Property.rating)
    ).limit(limit).all()

    # Fallback if preferences return fewer results, strictly within preferred cities if set
    if len(recs) < limit:
        remaining = limit - len(recs)
        existing_ids = [p.id for p in recs]
        fallback_query = db.query(Property).filter(
            Property.status == "available",
            Property.id.notin_(existing_ids)
        )
        if pref and pref.preferred_cities:
            fallback_query = fallback_query.filter(Property.city.in_(pref.preferred_cities))
        fallback = fallback_query.order_by(desc(Property.match_score), desc(Property.rating)).limit(remaining).all()
        recs.extend(fallback)

    return recs
