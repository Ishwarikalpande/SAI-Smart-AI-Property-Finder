import math
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.models.property import Property
from app.schemas.search import PropertySearchParams
from app.services.search_service import search_properties as db_search_properties
from app.ai.property_reasoning import generate_property_comparison, score_property_recommendation
from app.ai.investment_analysis import analyze_property_investment, format_inr

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points in kilometers."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

PROPERTY_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_properties",
            "description": "Searches verified properties from the real PostgreSQL database using structured filters.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "Target city name, e.g., 'Pune', 'Mumbai'"},
                    "locality": {"type": "string", "description": "Micro-market or locality, e.g., 'Baner', 'Wakad', 'Whitefield'"},
                    "bhk": {"type": "integer", "description": "Number of bedrooms (BHK), e.g., 1, 2, 3, 4"},
                    "min_price": {"type": "number", "description": "Minimum budget in INR"},
                    "max_price": {"type": "number", "description": "Maximum budget in INR"},
                    "property_type": {"type": "string", "enum": ["apartment", "villa", "plot", "office", "studio", "penthouse"]},
                    "listing_type": {"type": "string", "enum": ["buy", "rent", "commercial", "new-projects"]},
                    "amenities": {"type": "array", "items": {"type": "string"}, "description": "Required amenities e.g. Gym, Swimming Pool, Parking"},
                    "limit": {"type": "integer", "description": "Maximum number of results to return (default 6, max 50)"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_near_location",
            "description": "Searches properties within a geographic radius (km) of specified coordinates or landmark.",
            "parameters": {
                "type": "object",
                "properties": {
                    "latitude": {"type": "number", "description": "Center latitude"},
                    "longitude": {"type": "number", "description": "Center longitude"},
                    "radius_km": {"type": "number", "description": "Radius in kilometers, e.g., 5.0"},
                    "city": {"type": "string", "description": "City name for filtering"},
                    "max_price": {"type": "number", "description": "Optional maximum budget"}
                },
                "required": ["latitude", "longitude"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_property_details",
            "description": "Fetches verified database information for a specific property ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "property_id": {"type": "integer", "description": "The exact database ID of the property"}
                },
                "required": ["property_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "compare_properties",
            "description": "Compares 2 or more properties factually on price, sqft, amenities, transit, and investment metrics.",
            "parameters": {
                "type": "object",
                "properties": {
                    "property_ids": {
                        "type": "array",
                        "items": {"type": "integer"},
                        "description": "List of property IDs to compare (minimum 2)"
                    }
                },
                "required": ["property_ids"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "recommend_properties",
            "description": "Recommends properties from PostgreSQL ranked with explicit multi-criteria scoring.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name"},
                    "locality": {"type": "string", "description": "Preferred locality"},
                    "budget_max": {"type": "number", "description": "Maximum budget"},
                    "bhk": {"type": "integer", "description": "Preferred BHK"},
                    "purpose": {"type": "string", "enum": ["end_use", "investment", "rental_yield"]},
                    "limit": {"type": "integer", "description": "Number of recommendations"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_investment",
            "description": "Computes statistical investment return, CAGR, 3/5/10 year growth, and rental yield for a property.",
            "parameters": {
                "type": "object",
                "properties": {
                    "property_id": {"type": "integer", "description": "The property ID to analyze"}
                },
                "required": ["property_id"]
            }
        }
    }
]

def format_property_result(p: Property, distance_km: Optional[float] = None) -> Dict[str, Any]:
    images = [m.url for m in getattr(p, "media", [])] if hasattr(p, "media") else []
    primary_img = images[0] if images else "https://images.unsplash.com/photo-1682184805271-11671b7ecf4c?w=800&h=600&fit=crop&auto=format"
    price_val = float(getattr(p, "price", 0))

    res = {
        "id": p.id,
        "title": p.title,
        "description": p.description,
        "property_type": p.property_type,
        "listing_type": p.listing_type,
        "price": price_val,
        "price_display": p.price_display or format_inr(price_val),
        "bhk": p.bhk,
        "area_sqft": float(p.area_sqft) if p.area_sqft else None,
        "locality": p.locality,
        "city": p.city,
        "state": getattr(p, 'state', None),
        "country": getattr(p, 'country', None) or "India",
        "pincode": getattr(p, 'pincode', None),
        "address": p.address,
        "latitude": float(p.latitude) if p.latitude is not None else None,
        "longitude": float(p.longitude) if p.longitude is not None else None,
        "amenities": p.amenities or [],
        "furnishing": p.furnishing,
        "dist_metro": p.dist_metro,
        "is_rera": bool(p.is_rera),
        "is_verified": bool(p.is_verified),
        "rating": float(p.rating) if p.rating else 4.5,
        "badge": p.badge or "Standard",
        "match_score": p.match_score or 90,
        "status": p.status,
        "image": primary_img,
        "images": images
    }
    if distance_km is not None:
        res["distance_km"] = round(distance_km, 2)
        res["distance_display"] = f"{distance_km:.1f} km away"
    return res

def execute_tool_call(db: Session, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes a vetted backend tool against the real PostgreSQL database and returns factual structured data.
    """
    if tool_name == "search_properties":
        limit_val = min(int(arguments.get("limit", 6) or 6), 50)
        params = PropertySearchParams(
            city=arguments.get("city"),
            locality=arguments.get("locality"),
            bhk=arguments.get("bhk"),
            min_price=arguments.get("min_price"),
            max_price=arguments.get("max_price"),
            property_type=arguments.get("property_type"),
            listing_type=arguments.get("listing_type"),
            amenities=arguments.get("amenities"),
            limit=limit_val
        )
        props, total = db_search_properties(db, params)
        return {
            "total_matches": total,
            "properties": [format_property_result(p) for p in props]
        }

    elif tool_name == "search_near_location":
        center_lat = float(arguments.get("latitude"))
        center_lng = float(arguments.get("longitude"))
        radius_km = float(arguments.get("radius_km", 5.0) or 5.0)
        city = arguments.get("city")
        max_price = arguments.get("max_price")

        query = db.query(Property).filter(
            Property.status == "available",
            Property.latitude.isnot(None),
            Property.longitude.isnot(None)
        )
        if city:
            query = query.filter(Property.city.ilike(f"%{city}%"))
        if max_price:
            query = query.filter(Property.price <= float(max_price))

        candidates = query.limit(100).all()
        results_with_dist = []
        for p in candidates:
            dist = haversine_distance(center_lat, center_lng, float(p.latitude), float(p.longitude))
            if dist <= radius_km:
                results_with_dist.append((p, dist))

        results_with_dist.sort(key=lambda x: x[1])
        top_results = results_with_dist[:10]

        return {
            "total_matches": len(top_results),
            "radius_km": radius_km,
            "center": {"latitude": center_lat, "longitude": center_lng},
            "properties": [format_property_result(p, dist) for p, dist in top_results]
        }

    elif tool_name == "get_property_details":
        pid = arguments.get("property_id")
        p = db.query(Property).filter(Property.id == pid).first()
        if not p:
            return {"error": f"Property with ID {pid} was not found in the verified database."}
        return {
            "property": format_property_result(p)
        }

    elif tool_name == "compare_properties":
        pids = arguments.get("property_ids", [])
        props = db.query(Property).filter(Property.id.in_(pids)).all()
        if len(props) < 2:
            return {"error": "Fewer than 2 valid properties found in database for comparison."}
        cmp_res = generate_property_comparison(
            props,
            language=arguments.get("language", "en"),
            user_requirements=arguments.get("user_requirements"),
            priority=arguments.get("priority", "balanced")
        )
        return {
            "comparison": cmp_res.model_dump(),
            "properties": [format_property_result(p) for p in props]
        }

    elif tool_name == "recommend_properties":
        city = arguments.get("city")
        locality = arguments.get("locality")
        budget_max = arguments.get("budget_max")
        bhk = arguments.get("bhk")
        purpose = arguments.get("purpose", "end_use")
        limit_cnt = min(int(arguments.get("limit", 5) or 5), 20)

        query = db.query(Property).filter(Property.status == "available")
        if city:
            query = query.filter(Property.city.ilike(f"%{city}%"))
        if budget_max:
            query = query.filter(Property.price <= float(budget_max) * 1.15)
        if bhk:
            query = query.filter(Property.bhk == int(bhk))

        props = query.limit(limit_cnt * 2).all()
        if not props and city:
            # If specific city had no results, don't substitute another city
            return {
                "total_recommendations": 0,
                "recommendations": [],
                "message": f"No properties found in {city} matching your criteria."
            }
        elif not props:
            # No city specified, show top available
            props = db.query(Property).filter(Property.status == "available").limit(limit_cnt).all()

        scored = []
        for p in props:
            sc = score_property_recommendation(
                p,
                budget_max=float(budget_max) if budget_max else None,
                preferred_city=city,
                preferred_bhk=int(bhk) if bhk else None,
                preferred_locality=locality,
                purpose=purpose
            )
            scored.append((p, sc))

        scored.sort(key=lambda x: x[1].overall_match_score, reverse=True)
        top_scored = scored[:limit_cnt]

        return {
            "total_recommendations": len(top_scored),
            "recommendations": [
                {
                    "property": format_property_result(p),
                    "scoring": sc.model_dump()
                }
                for p, sc in top_scored
            ]
        }

    elif tool_name == "analyze_investment":
        pid = arguments.get("property_id")
        p = db.query(Property).filter(Property.id == pid).first()
        if not p:
            return {"error": f"Property ID {pid} not found in database for investment analysis."}
        inv_res = analyze_property_investment(p)
        return {
            "analysis": inv_res.model_dump(),
            "property": format_property_result(p)
        }

    return {"error": f"Unknown tool name: {tool_name}"}
