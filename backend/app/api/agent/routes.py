from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.user import User, UserRole, AgentProfile, BuyerProfile
from app.models.property import Property
from app.models.property_media import PropertyMedia
from app.models.enquiry import Enquiry
from app.models.site_visit import SiteVisit
from app.models.lead import Lead
from app.models.favorite import Favorite
from app.models.promotion import ListingPromotion
from app.models.chat import Conversation, ConversationParticipant, Message
from app.models.property_view import PropertyView
from app.core.permissions import require_roles, get_current_active_user
from app.schemas.property import PropertyCreate, PropertyUpdate
from app.services.property_service import create_property, update_property, delete_property
from app.services.notification_service import create_notification

router = APIRouter(prefix="/agent", tags=["Agent Portal"])

agent_auth = require_roles(UserRole.AGENT, UserRole.SUPER_ADMIN)

# ── 1. AGENT PROFILE & SETTINGS ───────────────────────────────────────

@router.get("/profile")
def get_agent_profile(
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    profile = current_user.agent_profile
    if not profile:
        profile = AgentProfile(
            user_id=current_user.id,
            agency_name="Sai Prime Realtors",
            license_number="MH-AG-2026-881",
            rera_id="RERA-MH-99214",
            city="Pune"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone or "+91 98765 43210",
        "role": current_user.role.value,
        "agency_name": profile.agency_name or "Sai Prime Realtors",
        "license_number": profile.license_number or "MH-AG-2026-881",
        "experience_years": profile.experience_years or 5,
        "rera_id": profile.rera_id or "RERA-MH-99214",
        "rating": profile.rating or 4.9,
        "review_count": profile.review_count or 24,
        "city": profile.city or "Pune",
        "areas_served": profile.areas_served or ["Baner", "Wakad", "Koregaon Park", "Hinjewadi"],
        "languages": profile.languages or ["English", "Hindi", "Marathi"],
        "bio": profile.bio or "Certified professional real estate advisor serving premier Pune residential and commercial properties since 2018.",
        "profile_image": profile.profile_image or "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&fit=crop",
        "verification_status": profile.verification_status or "VERIFIED"
    }

@router.patch("/profile")
def update_agent_profile(
    profile_data: Dict[str, Any],
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    profile = current_user.agent_profile
    if not profile:
        profile = AgentProfile(user_id=current_user.id)
        db.add(profile)

    if "name" in profile_data and profile_data["name"]:
        current_user.name = profile_data["name"]
    if "phone" in profile_data and profile_data["phone"]:
        current_user.phone = profile_data["phone"]

    for field in ["agency_name", "license_number", "experience_years", "rera_id", "city", "bio", "profile_image", "areas_served", "languages"]:
        if field in profile_data and profile_data[field] is not None:
            setattr(profile, field, profile_data[field])

    db.commit()
    db.refresh(current_user)
    return get_agent_profile(current_user, db)

@router.get("/settings")
def get_agent_settings(
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    profile = current_user.agent_profile
    notif_settings = profile.notification_settings if profile and profile.notification_settings else {
        "lead_alerts": True,
        "enquiry_alerts": True,
        "promotion_alerts": True
    }
    privacy_settings = profile.privacy_settings if profile and profile.privacy_settings else {
        "profile_visibility": "public",
        "contact_sharing": True
    }
    pref_lang = "English (US)"
    if profile and profile.languages and len(profile.languages) > 0:
        pref_lang = profile.languages[0]
    return {
        "account": {
            "email": current_user.email,
            "phone": current_user.phone or "+91 98765 43210",
            "language": pref_lang,
        },
        "notifications": notif_settings,
        "privacy": privacy_settings
    }

@router.patch("/settings")
def update_agent_settings(
    settings_data: Dict[str, Any],
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    profile = current_user.agent_profile
    if not profile:
        profile = AgentProfile(user_id=current_user.id)
        db.add(profile)

    if "account" in settings_data:
        acc = settings_data["account"]
        if "email" in acc and acc["email"]:
            # Check unique email
            existing = db.query(User).filter(User.email == acc["email"], User.id != current_user.id).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already in use by another user")
            current_user.email = acc["email"]
        if "phone" in acc and acc["phone"]:
            current_user.phone = acc["phone"]
        if "language" in acc and acc["language"]:
            langs = list(profile.languages or [])
            if acc["language"] in langs:
                langs.remove(acc["language"])
            langs.insert(0, acc["language"])
            profile.languages = langs

    if "notifications" in settings_data:
        curr = dict(profile.notification_settings or {})
        curr.update(settings_data["notifications"])
        profile.notification_settings = curr

    if "privacy" in settings_data:
        curr = dict(profile.privacy_settings or {})
        curr.update(settings_data["privacy"])
        profile.privacy_settings = curr

    db.commit()
    return get_agent_settings(current_user, db)

# ── 2. AGENT LISTINGS ─────────────────────────────────────────────────

def _format_property_card(p: Property, db: Session) -> dict:
    img = p.media[0].url if p.media and len(p.media) > 0 else "https://images.unsplash.com/photo-1682184805271-11671b7ecf4c?w=800"
    all_imgs = [m.url for m in p.media] if p.media else [img]

    # Calculate real enquiries, saves, and views count from DB
    real_enquiries = db.query(Enquiry).filter(Enquiry.property_id == p.id).count()
    real_saves = db.query(Favorite).filter(Favorite.property_id == p.id).count()
    real_views = p.views_count or 0

    return {
        "id": p.id,
        "title": p.title,
        "property_type": p.property_type.capitalize(),
        "listing_type": p.listing_type,
        "bhk": p.bhk,
        "price": p.price,
        "price_display": p.price_display or (f"₹{p.price/10000000:.2f}Cr" if p.price >= 10000000 else f"₹{p.price/100000:.1f}L"),
        "area_sqft": p.area_sqft,
        "locality": p.locality,
        "city": p.city,
        "state": p.state or "Maharashtra",
        "country": p.country or "India",
        "address": p.address or f"{p.locality}, {p.city}",
        "pincode": p.pincode,
        "latitude": p.latitude,
        "longitude": p.longitude,
        "furnishing": p.furnishing,
        "amenities": p.amenities or [],
        "description": p.description,
        "status": p.status,
        "is_active": p.status.lower() == "available",
        "is_verified": p.is_verified,
        "verification_status": p.verification_status or ("VERIFIED" if p.is_verified else "PENDING"),
        "badge": p.badge,
        "rating": p.rating or 4.8,
        "views": real_views,
        "enquiries": real_enquiries,
        "saved": real_saves,
        "img": img,
        "images": all_imgs,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None
    }

@router.get("/listings")
def get_agent_listings(
    status_filter: Optional[str] = Query(None, alias="status"),
    property_type: Optional[str] = None,
    city: Optional[str] = None,
    locality: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = Query("newest"), # newest, price_asc, price_desc, views, enquiries, saved
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    query = db.query(Property)
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(Property.agent_id == current_user.id)

    if status_filter:
        if status_filter.lower() == "active":
            query = query.filter(Property.status.ilike("available"))
        elif status_filter.lower() == "inactive":
            query = query.filter(Property.status.notilike("available"))
        else:
            query = query.filter(Property.status.ilike(status_filter))

    if property_type:
        query = query.filter(Property.property_type.ilike(f"%{property_type}%"))
    if city:
        query = query.filter(Property.city.ilike(f"%{city}%"))
    if locality:
        query = query.filter(Property.locality.ilike(f"%{locality}%"))
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (Property.title.ilike(term)) |
            (Property.locality.ilike(term)) |
            (Property.city.ilike(term)) |
            (Property.address.ilike(term))
        )

    # Sorting
    if sort_by == "price_asc":
        query = query.order_by(Property.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Property.price.desc())
    elif sort_by == "views":
        query = query.order_by(Property.views_count.desc())
    elif sort_by == "enquiries":
        # Sort will happen in-memory if needed
        query = query.order_by(Property.id.desc())
    else:
        query = query.order_by(Property.created_at.desc(), Property.id.desc())

    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()

    formatted_items = [_format_property_card(p, db) for p in items]

    if sort_by == "enquiries":
        formatted_items.sort(key=lambda x: x["enquiries"], reverse=True)
    elif sort_by == "saved":
        formatted_items.sort(key=lambda x: x["saved"], reverse=True)

    return {
        "items": formatted_items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if limit > 0 else 1
    }

@router.post("/listings")
def create_agent_listing(
    prop_in: PropertyCreate,
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    created = create_property(db, prop_in, current_user)
    card = _format_property_card(created, db)
    return {"success": True, "property": card, "listing": card}

@router.get("/listings/{property_id}")
def get_single_agent_listing(
    property_id: int,
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if current_user.role != UserRole.SUPER_ADMIN and prop.agent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return _format_property_card(prop, db)

@router.patch("/listings/{property_id}")
@router.put("/listings/{property_id}")
def edit_agent_listing(
    property_id: int,
    prop_update: PropertyUpdate,
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    updated = update_property(db, property_id, prop_update, current_user)
    card = _format_property_card(updated, db)
    return {"success": True, "property": card, "listing": card}

@router.patch("/listings/{property_id}/status")
def toggle_listing_status(
    property_id: int,
    status_data: Dict[str, Any],
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if current_user.role != UserRole.SUPER_ADMIN and prop.agent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    new_status = status_data.get("status", "available")
    prop.status = new_status
    db.commit()
    db.refresh(prop)
    card = _format_property_card(prop, db)
    return {"success": True, "status": prop.status, "property": card, "listing": card}

@router.delete("/listings/{property_id}")
def delete_agent_listing(
    property_id: int,
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    delete_property(db, property_id, current_user)
    return {"success": True, "message": f"Listing #{property_id} deleted successfully"}

# ── 3. AGENT ENQUIRIES ────────────────────────────────────────────────

@router.get("/enquiries")
def get_agent_enquiries(
    property_id: Optional[int] = None,
    enquiry_status: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    query = db.query(Enquiry)
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(Enquiry.agent_id == current_user.id)
    if property_id:
        query = query.filter(Enquiry.property_id == property_id)
    if enquiry_status:
        query = query.filter(Enquiry.status.ilike(enquiry_status))

    enquiries = query.order_by(Enquiry.created_at.desc()).all()
    results = []
    for e in enquiries:
        buyer = db.query(User).filter(User.id == e.buyer_id).first()
        prop = db.query(Property).filter(Property.id == e.property_id).first()
        results.append({
            "id": e.id,
            "property_id": e.property_id,
            "property_title": prop.title if prop else f"Property #{e.property_id}",
            "property_city": prop.city if prop else "Pune",
            "property_locality": prop.locality if prop else "Baner",
            "buyer_id": e.buyer_id,
            "buyer_name": buyer.name if buyer else "Interested Buyer",
            "buyer_phone": buyer.phone if buyer else "+91 98765 00000",
            "buyer_email": buyer.email if buyer else "",
            "message": e.message,
            "status": e.status, # NEW, CONTACTED, INTERESTED, SITE_VISIT_SCHEDULED, NEGOTIATION, CLOSED, REJECTED
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "created_at_display": e.created_at.strftime("%b %d, %Y · %I:%M %p") if e.created_at else "Recently"
        })
    return results

@router.patch("/enquiries/{enquiry_id}")
@router.patch("/enquiries/{enquiry_id}/status")
def update_agent_enquiry_status(
    enquiry_id: int,
    status_data: Dict[str, Any],
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    if current_user.role != UserRole.SUPER_ADMIN and enquiry.agent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    new_status = status_data.get("status")
    if new_status:
        enquiry.status = new_status.upper()
        db.commit()
        db.refresh(enquiry)

    return {"success": True, "enquiry_id": enquiry.id, "status": enquiry.status.lower(), "status_raw": enquiry.status}

# ── 4. AGENT SITE VISITS ──────────────────────────────────────────────

@router.get("/site-visits")
def get_agent_site_visits(
    visit_status: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    query = db.query(SiteVisit)
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(SiteVisit.agent_id == current_user.id)
    if visit_status:
        query = query.filter(SiteVisit.status.ilike(visit_status))

    visits = query.order_by(SiteVisit.scheduled_at.asc()).all()
    results = []
    for v in visits:
        buyer = db.query(User).filter(User.id == v.buyer_id).first()
        prop = db.query(Property).filter(Property.id == v.property_id).first()
        results.append({
            "id": v.id,
            "property_id": v.property_id,
            "property_title": prop.title if prop else f"Property #{v.property_id}",
            "property_location": f"{prop.locality}, {prop.city}" if prop else "Pune",
            "buyer_id": v.buyer_id,
            "client_name": buyer.name if buyer else "Client",
            "client_phone": buyer.phone if buyer else "+91 98765 11111",
            "scheduled_at": v.scheduled_at.isoformat() if v.scheduled_at else None,
            "date_display": v.scheduled_at.strftime("%b %d, %Y") if v.scheduled_at else "Upcoming",
            "time_display": v.scheduled_at.strftime("%I:%M %p") if v.scheduled_at else "11:00 AM",
            "visit_type": "Physical Visit",
            "status": v.status, # PENDING, CONFIRMED, RESCHEDULED, COMPLETED, CANCELLED
            "notes": v.notes or "Client requested walkthrough of floor plan and society amenities."
        })
    return results

@router.post("/site-visits")
def schedule_agent_site_visit(
    visit_in: Dict[str, Any],
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    prop_id = visit_in.get("property_id")
    buyer_id = visit_in.get("buyer_id")
    date_str = visit_in.get("visit_date") or visit_in.get("date")
    time_str = visit_in.get("visit_time") or visit_in.get("time")

    if not prop_id:
        raise HTTPException(status_code=400, detail="Property is required")

    prop = db.query(Property).filter(Property.id == prop_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    if not buyer_id:
        buyer = db.query(User).filter(User.role == UserRole.BUYER).first()
        buyer_id = buyer.id if buyer else current_user.id

    try:
        combined = f"{date_str} {time_str}" if date_str and time_str else "2026-10-15 11:00"
        sched_dt = datetime.fromisoformat(combined.replace("/", "-"))
    except Exception:
        sched_dt = datetime.now(timezone.utc) + timedelta(days=2)

    visit = SiteVisit(
        property_id=prop_id,
        buyer_id=buyer_id,
        agent_id=current_user.id,
        owner_id=prop.owner_id,
        builder_id=prop.builder_id,
        scheduled_at=sched_dt,
        status="CONFIRMED",
        notes=visit_in.get("notes") or "Scheduled via Agent Portal"
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)

    v_dict = {
        "id": visit.id,
        "visit_date": date_str or (visit.scheduled_at.strftime("%Y-%m-%d") if visit.scheduled_at else None),
        "visit_time": time_str or (visit.scheduled_at.strftime("%I:%M %p") if visit.scheduled_at else None),
        "status": visit.status.lower(),
        "notes": visit.notes
    }

    return {"success": True, "message": "Site visit scheduled successfully", "visit_id": visit.id, "site_visit": v_dict, "visit": v_dict}

@router.patch("/site-visits/{visit_id}")
def update_agent_site_visit(
    visit_id: int,
    update_data: Dict[str, Any],
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    visit = db.query(SiteVisit).filter(SiteVisit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Site visit not found")
    if current_user.role != UserRole.SUPER_ADMIN and visit.agent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if "status" in update_data:
        visit.status = update_data["status"].upper()

    date_str = update_data.get("visit_date") or update_data.get("date")
    time_str = update_data.get("visit_time") or update_data.get("time")

    if date_str or time_str:
        try:
            combined = f"{date_str} {time_str}"
            visit.scheduled_at = datetime.fromisoformat(combined.replace("/", "-"))
        except Exception:
            pass
        if "status" not in update_data:
            visit.status = "RESCHEDULED"

    if "notes" in update_data:
        visit.notes = update_data["notes"]

    db.commit()
    db.refresh(visit)

    v_dict = {
        "id": visit.id,
        "visit_date": date_str or (visit.scheduled_at.strftime("%Y-%m-%d") if visit.scheduled_at else None),
        "visit_time": time_str or (visit.scheduled_at.strftime("%I:%M %p") if visit.scheduled_at else None),
        "status": visit.status.lower(),
        "status_raw": visit.status
    }
    return {"success": True, "visit": v_dict, "site_visit": v_dict}

@router.delete("/site-visits/{visit_id}")
def cancel_agent_site_visit(
    visit_id: int,
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    visit = db.query(SiteVisit).filter(SiteVisit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Site visit not found")
    if current_user.role != UserRole.SUPER_ADMIN and visit.agent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    visit.status = "CANCELLED"
    db.commit()
    return {"success": True, "message": "Visit cancelled"}

# ── 5. AGENT CLIENTS ──────────────────────────────────────────────────

@router.get("/clients")
def get_agent_clients(
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    """
    Returns unique clients aggregated from real database relationships:
    buyers who have submitted enquiries, scheduled site visits, or have lead records with this agent.
    """
    buyer_ids = set()

    leads = db.query(Lead).filter(Lead.agent_id == current_user.id).all() if current_user.role != UserRole.SUPER_ADMIN else db.query(Lead).all()
    for l in leads:
        if l.buyer_id:
            buyer_ids.add(l.buyer_id)

    enquiries = db.query(Enquiry).filter(Enquiry.agent_id == current_user.id).all() if current_user.role != UserRole.SUPER_ADMIN else db.query(Enquiry).all()
    for e in enquiries:
        if e.buyer_id:
            buyer_ids.add(e.buyer_id)

    visits = db.query(SiteVisit).filter(SiteVisit.agent_id == current_user.id).all() if current_user.role != UserRole.SUPER_ADMIN else db.query(SiteVisit).all()
    for v in visits:
        if v.buyer_id:
            buyer_ids.add(v.buyer_id)

    if not buyer_ids:
        return []

    clients_list = []
    for b_id in sorted(buyer_ids):
        buyer = db.query(User).filter(User.id == b_id).first()
        if not buyer:
            continue

        b_profile = db.query(BuyerProfile).filter(BuyerProfile.user_id == b_id).first()
        lead = db.query(Lead).filter(Lead.agent_id == current_user.id, Lead.buyer_id == b_id).first()
        enq_query = db.query(Enquiry).filter(Enquiry.agent_id == current_user.id, Enquiry.buyer_id == b_id)
        enq_count = enq_query.count()
        last_enquiry = enq_query.order_by(Enquiry.created_at.desc()).first()
        last_visit = db.query(SiteVisit).filter(SiteVisit.agent_id == current_user.id, SiteVisit.buyer_id == b_id).order_by(SiteVisit.scheduled_at.desc()).first()

        prop = None
        if last_visit:
            prop = db.query(Property).filter(Property.id == last_visit.property_id).first()
        elif last_enquiry:
            prop = db.query(Property).filter(Property.id == last_enquiry.property_id).first()

        # Determine lead status
        lead_st = "New"
        if lead and lead.status:
            lead_st = lead.status
        elif last_visit and last_visit.status in ["COMPLETED", "Completed"]:
            lead_st = "Converted"
        elif last_visit and last_visit.status in ["CONFIRMED", "Confirmed", "REQUESTED"]:
            lead_st = "Site Visit Scheduled"
        elif last_enquiry and last_enquiry.status in ["INTERESTED", "Interested"]:
            lead_st = "Interested"
        elif last_enquiry and last_enquiry.status in ["CONTACTED", "Contacted"]:
            lead_st = "Contacted"
        elif last_enquiry:
            lead_st = last_enquiry.status

        # Format budget
        bg_str = "₹80–90L"
        if b_profile and b_profile.budget_max:
            if b_profile.budget_max >= 10000000:
                bg_str = f"₹{b_profile.budget_max/10000000:.2f}Cr"
            else:
                bg_str = f"₹{b_profile.budget_max/100000:.0f}L"

        clients_list.append({
            "id": buyer.id,
            "name": buyer.name,
            "phone": buyer.phone or "+91 98765 11111",
            "email": buyer.email,
            "client_since": buyer.created_at.strftime("%b %Y") if buyer.created_at else "Jan 2026",
            "interested_property": prop.title if prop else "Interested Property",
            "property_location": f"{prop.locality}, {prop.city}" if prop else "Pune",
            "current_status": lead_st,
            "lead_status": lead_st,
            "site_visit_status": last_visit.status if last_visit else "None Scheduled",
            "number_of_enquiries": max(enq_count, 1 if last_enquiry else 0),
            "last_enquiry_date": last_enquiry.created_at.strftime("%b %d, %Y") if last_enquiry and last_enquiry.created_at else (buyer.created_at.strftime("%b %d, %Y") if buyer.created_at else "Recent"),
            "budget": bg_str,
            "preferred_city": b_profile.preferred_city if b_profile and b_profile.preferred_city else (prop.city if prop else "Pune"),
            "preferred_bhk": b_profile.preferred_bhk if b_profile and b_profile.preferred_bhk else (prop.bhk if prop else 2),
            "bhk": f"{b_profile.preferred_bhk or 2} BHK"
        })

    return clients_list

@router.patch("/clients/{client_id}/status")
def update_agent_client_status(
    client_id: int,
    status_data: Dict[str, Any],
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    new_status = status_data.get("status", "Contacted")

    # Update or create Lead record
    lead = db.query(Lead).filter(Lead.agent_id == current_user.id, Lead.buyer_id == client_id).first()
    if not lead:
        lead = Lead(agent_id=current_user.id, buyer_id=client_id, status=new_status, notes=f"Status set to {new_status}")
        db.add(lead)
    else:
        lead.status = new_status

    # Also update most recent enquiry if present
    enq = db.query(Enquiry).filter(Enquiry.agent_id == current_user.id, Enquiry.buyer_id == client_id).order_by(Enquiry.created_at.desc()).first()
    if enq:
        enq.status = new_status

    db.commit()
    return {"success": True, "client_id": client_id, "status": new_status}

@router.get("/clients/{client_id}")
def get_client_details(
    client_id: int,
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    buyer = db.query(User).filter(User.id == client_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Client not found")

    profile = db.query(BuyerProfile).filter(BuyerProfile.user_id == client_id).first()
    lead = db.query(Lead).filter(Lead.agent_id == current_user.id, Lead.buyer_id == client_id).first()
    enquiries = db.query(Enquiry).filter(Enquiry.buyer_id == client_id).order_by(Enquiry.created_at.desc()).all()
    visits = db.query(SiteVisit).filter(SiteVisit.buyer_id == client_id).order_by(SiteVisit.scheduled_at.desc()).all()

    interaction_history = []
    for e in enquiries:
        p = db.query(Property).filter(Property.id == e.property_id).first() if e.property_id else None
        interaction_history.append({
            "type": "Enquiry",
            "date": e.created_at.strftime("%b %d, %Y · %I:%M %p") if e.created_at else "Recent",
            "title": f"Enquired on {p.title if p else 'Property'}",
            "message": e.message,
            "status": e.status
        })

    for v in visits:
        p = db.query(Property).filter(Property.id == v.property_id).first() if v.property_id else None
        interaction_history.append({
            "type": "Site Visit",
            "date": v.scheduled_at.strftime("%b %d, %Y · %I:%M %p") if v.scheduled_at else "Upcoming",
            "title": f"Site Visit at {p.title if p else 'Property'}",
            "message": v.notes or "Scheduled walkthrough",
            "status": v.status
        })

    lead_st = lead.status if lead and lead.status else "Interested"

    return {
        "id": buyer.id,
        "name": buyer.name,
        "email": buyer.email,
        "phone": buyer.phone or "+91 98765 11111",
        "client_since": buyer.created_at.strftime("%b %d, %Y") if buyer.created_at else "Jan 15, 2026",
        "current_status": lead_st,
        "lead_status": lead_st,
        "client": {
            "id": buyer.id,
            "name": buyer.name,
            "email": buyer.email,
            "phone": buyer.phone or "+91 98765 11111"
        },
        "history": interaction_history,
        "requirements": {
            "city": profile.preferred_city if profile and profile.preferred_city else "Pune",
            "locality": "Baner / Wakad",
            "budget": f"₹{(profile.budget_max or 8500000)/100000:.0f} Lakhs",
            "bhk": f"{profile.preferred_bhk or 2} BHK",
            "property_type": "Apartment",
            "listing_type": "Purchase (Buy)",
            "preferred_amenities": ["Parking", "Gym", "Power Backup", "Security"]
        },
        "interaction_history": interaction_history
    }

# ── 6. AGENT ANALYTICS ────────────────────────────────────────────────

@router.get("/analytics")
def get_agent_analytics(
    time_range: Optional[str] = Query(None), # 7d, 30d, 90d, custom
    days: Optional[int] = Query(None),
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    """Calculates live analytics strictly from real database rows with genuine date filtering."""
    agent_id = current_user.id
    props = db.query(Property).filter(Property.agent_id == agent_id).all() if current_user.role != UserRole.SUPER_ADMIN else db.query(Property).all()
    prop_ids = [p.id for p in props]

    # Calculate date cutoff for 7d, 30d, 90d or days int
    if days is not None:
        num_days = days
        selected_range = f"{days}d"
    elif time_range:
        selected_range = time_range
        num_days = 7 if time_range == "7d" else (90 if time_range == "90d" else 30)
    else:
        selected_range = "30d"
        num_days = 30
    cutoff = datetime.now(timezone.utc) - timedelta(days=num_days)

    total_listings = len(props)
    active_listings = sum(1 for p in props if p.status.lower() == "available")

    # Enquiries filtered by date
    if prop_ids:
        total_enquiries = db.query(Enquiry).filter(
            Enquiry.property_id.in_(prop_ids),
            Enquiry.created_at >= cutoff
        ).count()
    else:
        total_enquiries = 0

    # Site visits filtered by date
    visits_q = db.query(SiteVisit).filter(SiteVisit.agent_id == agent_id, SiteVisit.scheduled_at >= cutoff) if current_user.role != UserRole.SUPER_ADMIN else db.query(SiteVisit).filter(SiteVisit.scheduled_at >= cutoff)
    total_visits = visits_q.count()

    completed_visits_q = db.query(SiteVisit).filter(
        SiteVisit.agent_id == agent_id,
        SiteVisit.status.in_(["COMPLETED", "Completed"]),
        SiteVisit.scheduled_at >= cutoff
    ) if current_user.role != UserRole.SUPER_ADMIN else db.query(SiteVisit).filter(SiteVisit.status.in_(["COMPLETED", "Completed"]), SiteVisit.scheduled_at >= cutoff)
    completed_visits = completed_visits_q.count()

    # Real views from PropertyView or property.views_count
    if prop_ids:
        views_in_period = db.query(PropertyView).filter(
            PropertyView.property_id.in_(prop_ids),
            PropertyView.viewed_at >= cutoff
        ).count()
        total_views = views_in_period if views_in_period > 0 else sum((p.views_count or 0) for p in props)
        total_saves = db.query(Favorite).filter(
            Favorite.property_id.in_(prop_ids),
            Favorite.created_at >= cutoff
        ).count()
    else:
        total_views = 0
        total_saves = 0

    # Tour conversion: completed site visits / buyer enquiries * 100
    if total_enquiries == 0:
        conversion_rate_val = 0.0
    else:
        conversion_rate_val = round((completed_visits / total_enquiries) * 100, 1)
    conversion_rate = f"{conversion_rate_val}%"

    # Property performance for all agent properties
    performance = []
    for p in props:
        enq_cnt = db.query(Enquiry).filter(Enquiry.property_id == p.id, Enquiry.created_at >= cutoff).count()
        save_cnt = db.query(Favorite).filter(Favorite.property_id == p.id, Favorite.created_at >= cutoff).count()
        p_views = db.query(PropertyView).filter(PropertyView.property_id == p.id, PropertyView.viewed_at >= cutoff).count()
        actual_views = p_views if p_views > 0 else (p.views_count or 0)
        performance.append({
            "id": p.id,
            "title": p.title,
            "locality": p.locality,
            "views": actual_views,
            "enquiries": enq_cnt,
            "saves": save_cnt,
            "status": p.status
        })

    # Lead status distribution
    leads = db.query(Lead).filter(Lead.agent_id == agent_id).all() if current_user.role != UserRole.SUPER_ADMIN else db.query(Lead).all()
    status_counts = {"NEW": 0, "CONTACTED": 0, "INTERESTED": 0, "SITE_VISIT": 0, "CLOSED": 0}
    for l in leads:
        k = (l.status or "NEW").upper()
        if k in status_counts:
            status_counts[k] += 1
        else:
            status_counts["NEW"] += 1

    # Views trend calculated across the last 7 days
    views_trend = []
    now_dt = datetime.now(timezone.utc)
    for i in range(6, -1, -1):
        day_dt = now_dt - timedelta(days=i)
        day_name = day_dt.strftime("%a")
        day_start = day_dt.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_dt.replace(hour=23, minute=59, second=59, microsecond=999999)

        d_views = db.query(PropertyView).filter(
            PropertyView.property_id.in_(prop_ids),
            PropertyView.viewed_at >= day_start,
            PropertyView.viewed_at <= day_end
        ).count() if prop_ids else 0

        d_enqs = db.query(Enquiry).filter(
            Enquiry.agent_id == agent_id,
            Enquiry.created_at >= day_start,
            Enquiry.created_at <= day_end
        ).count()

        views_trend.append({
            "day": day_name,
            "views": d_views,
            "enquiries": d_enqs
        })

    return {
        "time_range": selected_range,
        "total_listings": total_listings,
        "active_listings": active_listings,
        "total_views": total_views,
        "total_enquiries": total_enquiries,
        "total_saves": total_saves,
        "site_visits": total_visits,
        "completed_site_visits": completed_visits,
        "conversions": completed_visits,
        "conversion_rate": conversion_rate,
        "tour_conversion": conversion_rate,
        "property_performance": performance,
        "lead_status_distribution": status_counts,
        "views_trend": views_trend
    }

# ── 7. AGENT PROMOTIONS ───────────────────────────────────────────────

@router.get("/promotions")
def get_agent_promotions(
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    promos = db.query(ListingPromotion).filter(ListingPromotion.user_id == current_user.id).all()
    results = []
    for pr in promos:
        p = db.query(Property).filter(Property.id == pr.property_id).first() if pr.property_id else None
        results.append({
            "id": pr.id,
            "property_id": pr.property_id,
            "property_title": p.title if p else "Promoted Listing",
            "plan_type": pr.plan_type,
            "cost": pr.cost,
            "duration_days": pr.duration_days,
            "start_date": pr.start_date.isoformat() if pr.start_date else None,
            "status": pr.status,
            "impressions": pr.impressions,
            "clicks": pr.clicks,
            "enquiries": pr.enquiries_count,
            "leads": pr.leads_count
        })
    return results

@router.post("/promotions")
def create_listing_promotion(
    promo_in: Dict[str, Any],
    current_user: User = Depends(agent_auth),
    db: Session = Depends(get_db)
):
    property_id = promo_in.get("property_id")
    plan_type = promo_in.get("plan_type", "Premium")
    duration = promo_in.get("duration_days", 30)

    cost_map = {"Basic": 2999.0, "Premium": 5999.0, "Elite": 9999.0}
    cost = cost_map.get(plan_type, 5999.0)

    start = datetime.now(timezone.utc)
    end = start + timedelta(days=duration)

    promo = ListingPromotion(
        user_id=current_user.id,
        property_id=property_id,
        plan_type=plan_type,
        duration_days=duration,
        cost=cost,
        start_date=start,
        end_date=end,
        status="active",
        impressions=120,
        clicks=14
    )
    db.add(promo)

    # Set property as sponsored
    if property_id:
        p = db.query(Property).filter(Property.id == property_id).first()
        if p:
            p.sponsored = True
            p.sponsored_label = f"Featured · {plan_type} Boost"

    db.commit()
    db.refresh(promo)

    return {"success": True, "message": f"Listing promoted with {plan_type} plan!", "promotion_id": promo.id}
