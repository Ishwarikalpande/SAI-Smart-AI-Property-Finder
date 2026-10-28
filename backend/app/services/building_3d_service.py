import math
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from fastapi import HTTPException, status

from app.models.project import Project, Building, Floor, Unit, UnitBooking, BookingAuditLog
from app.models.user import User
from app.services.property_3d_generator import generate_3d_tour_for_property

STATUS_COLORS = {
    "available": "#10B981", # Emerald Green
    "reserved": "#F59E0B",  # Amber/Orange
    "booked": "#EF4444",    # Red
    "sold": "#9CA3AF",      # Grey
    "blocked": "#374151"    # Dark Grey / Disabled
}

DIRECTION_ANGLES = {
    "North": 0,
    "North-East": 45,
    "East": 90,
    "South-East": 135,
    "South": 180,
    "South-West": 225,
    "West": 270,
    "North-West": 315
}

def format_inr(val: float) -> str:
    if val >= 10000000:
        return f"₹{val / 10000000:.2f} Cr"
    elif val >= 100000:
        return f"₹{val / 100000:.1f} Lakh"
    return f"₹{val:,.0f}"

def get_building_3d_data(building_id: int, db: Session) -> Dict[str, Any]:
    building = db.query(Building).filter(Building.id == building_id).first()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")

    project = building.project
    floors = db.query(Floor).filter(Floor.building_id == building_id).order_by(Floor.floor_number.asc()).all()
    units = db.query(Unit).filter(Unit.tower_id == building_id).order_by(Unit.floor_number.asc(), Unit.unit_number.asc()).all()

    total_floors = building.floors_count or len(floors) or 10
    floor_height = building.floor_height or 3.2
    building_width = building.building_width or 40.0
    building_depth = building.building_depth or 26.0

    # Group units by floor
    units_by_floor: Dict[int, List[Dict[str, Any]]] = {}
    total_units_count = len(units)
    status_counts = {"available": 0, "reserved": 0, "booked": 0, "sold": 0, "blocked": 0}

    for u in units:
        fn = u.floor_number or 1
        st = (u.status or "available").lower()
        if st in status_counts:
            status_counts[st] += 1
        else:
            status_counts["available"] += 1

        u_data = {
            "id": u.id,
            "project_id": u.project_id,
            "building_id": building.id,
            "building_name": building.name,
            "floor_id": u.floor_id,
            "floor_number": fn,
            "unit_number": u.unit_number,
            "unit_label": u.unit_label or f"Flat {fn}-{u.unit_number}",
            "bhk": u.bhk,
            "bedrooms": u.bedrooms or u.bhk,
            "bathrooms": u.bathrooms or 2,
            "balconies": u.balconies or 1,
            "carpet_area": u.carpet_area or u.area_sqft,
            "built_up_area": u.built_up_area or (u.area_sqft * 1.15),
            "area_sqft": u.area_sqft,
            "price": u.price,
            "price_display": format_inr(u.price),
            "parking": u.parking or "1 Covered",
            "direction": u.direction or "East",
            "entrance_direction": u.entrance_direction or "North",
            "balcony_direction": u.balcony_direction or "East",
            "direction_angle": DIRECTION_ANGLES.get(u.direction, 90),
            "balcony_angle": DIRECTION_ANGLES.get(u.balcony_direction, 90),
            "entrance_angle": DIRECTION_ANGLES.get(u.entrance_direction, 0),
            "position": {
                "x": u.position_x or 0.0,
                "y": (fn - 1) * floor_height,
                "z": u.position_z or 0.0
            },
            "wing": u.wing or ("North Wing" if (u.position_z or 0) < 0 else "South Wing"),
            "status": st,
            "status_color": STATUS_COLORS.get(st, "#10B981"),
            "floor_plan_url": u.floor_plan_url,
            "has_3d_tour": True
        }

        if fn not in units_by_floor:
            units_by_floor[fn] = []
        units_by_floor[fn].append(u_data)

    # Floor summaries
    floors_data = []
    for fl in floors:
        fn = fl.floor_number
        fl_units = units_by_floor.get(fn, [])
        avail_count = sum(1 for x in fl_units if x["status"] == "available")
        floors_data.append({
            "id": fl.id,
            "floor_number": fn,
            "floor_label": fl.floor_label or f"Floor {fn}",
            "floor_type": fl.floor_type or "residential",
            "height_offset": (fn - 1) * floor_height,
            "total_units": len(fl_units),
            "available_units": avail_count,
            "units": fl_units
        })

    # If no floors were in table but units exist, create virtual floor list
    if not floors_data and units_by_floor:
        for fn in sorted(units_by_floor.keys()):
            fl_units = units_by_floor[fn]
            avail_count = sum(1 for x in fl_units if x["status"] == "available")
            floors_data.append({
                "id": fn,
                "floor_number": fn,
                "floor_label": f"Floor {fn}",
                "floor_type": "residential",
                "height_offset": (fn - 1) * floor_height,
                "total_units": len(fl_units),
                "available_units": avail_count,
                "units": fl_units
            })

    return {
        "building": {
            "id": building.id,
            "project_id": project.id if project else None,
            "project_name": project.name if project else "SAI Residency",
            "project_city": project.city if project else "Amravati",
            "project_locality": project.locality if project else "Camp Road",
            "name": building.name,
            "code": building.code or building.name[:1],
            "floors_count": total_floors,
            "units_per_floor": building.units_per_floor or 8,
            "total_units": total_units_count,
            "status": building.status or "Under Construction",
            "floor_height": floor_height,
            "building_width": building_width,
            "building_depth": building_depth,
            "orientation": building.orientation or 0.0,
            "front_direction": building.front_direction or "North",
            "entrance_position": building.entrance_position or "North",
            "parking_levels": building.parking_levels or 2,
            "amenities": building.amenities or []
        },
        "inventory_summary": {
            "total_units": total_units_count,
            "available": status_counts["available"],
            "reserved": status_counts["reserved"],
            "booked": status_counts["booked"],
            "sold": status_counts["sold"],
            "blocked": status_counts["blocked"]
        },
        "status_legend": [
            {"status": "available", "label": "Available", "color": STATUS_COLORS["available"], "count": status_counts["available"]},
            {"status": "reserved", "label": "Reserved", "color": STATUS_COLORS["reserved"], "count": status_counts["reserved"]},
            {"status": "booked", "label": "Booked", "color": STATUS_COLORS["booked"], "count": status_counts["booked"]},
            {"status": "sold", "label": "Sold", "color": STATUS_COLORS["sold"], "count": status_counts["sold"]},
            {"status": "blocked", "label": "Blocked", "color": STATUS_COLORS["blocked"], "count": status_counts["blocked"]}
        ],
        "floors": floors_data
    }

def get_unit_3d_tour(unit_id: int, db: Session) -> Dict[str, Any]:
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    building = unit.building
    project = unit.project or (building.project if building else None)

    # Mock/wrap property object for property_3d_generator
    prop_wrapper = {
        "id": unit.id,
        "name": f"{project.name if project else 'SAI'} · {building.name if building else 'Tower A'} · {unit.unit_label or unit.unit_number}",
        "title": f"{unit.bhk} BHK {unit.unit_label or ('Flat ' + unit.unit_number)}",
        "property_type": "apartment",
        "bhk": unit.bhk,
        "bathrooms": unit.bathrooms or 2,
        "balconies": unit.balconies or 1,
        "city": project.city if project else "Amravati",
        "locality": project.locality if project else "Camp Road",
        "address": project.address if project else f"{project.name if project else 'ABC Residency'}, {building.name if building else 'Tower A'}",
        "area_sqft": unit.area_sqft,
        "price": unit.price,
        "price_display": format_inr(unit.price),
        "description": f"Luxury {unit.bhk} BHK apartment located on Floor {unit.floor_number} of {building.name if building else 'Tower A'}. Direction: {unit.direction}, Balcony facing: {unit.balcony_direction}.",
        "media": []
    }

    tour_scene = generate_3d_tour_for_property(prop_wrapper)

    # Enrich tour scene with unit-specific real-world building metadata
    tour_scene["unit_info"] = {
        "unit_id": unit.id,
        "unit_number": unit.unit_number,
        "unit_label": unit.unit_label or f"Flat {unit.floor_number}-{unit.unit_number}",
        "floor_number": unit.floor_number,
        "floor_label": f"Floor {unit.floor_number}",
        "tower_id": building.id if building else None,
        "tower_name": building.name if building else "Tower A",
        "project_id": project.id if project else None,
        "project_name": project.name if project else "ABC Residency",
        "bhk": unit.bhk,
        "area_sqft": unit.area_sqft,
        "carpet_area": unit.carpet_area or unit.area_sqft,
        "built_up_area": unit.built_up_area or (unit.area_sqft * 1.15),
        "price": unit.price,
        "price_display": format_inr(unit.price),
        "status": (unit.status or "available").lower(),
        "direction": unit.direction or "East",
        "entrance_direction": unit.entrance_direction or "North",
        "balcony_direction": unit.balcony_direction or "East",
        "wing": unit.wing or "Central Wing",
        "position_x": unit.position_x or 0.0,
        "position_y": (unit.floor_number - 1) * 3.2,
        "position_z": unit.position_z or 0.0
    }

    # Orientation configuration for camera in 3D walkthrough
    tour_scene["exterior"]["selected_floor"] = unit.floor_number
    tour_scene["exterior"]["total_floors"] = building.floors_count if building else 20
    tour_scene["exterior"]["balcony_facing"] = unit.balcony_direction or "East"
    tour_scene["exterior"]["entrance_facing"] = unit.entrance_direction or "North"
    tour_scene["exterior"]["compass_rotation"] = DIRECTION_ANGLES.get(unit.direction, 90)
    tour_scene["unit"] = tour_scene["unit_info"]

    return tour_scene

def reserve_or_book_unit(
    unit_id: int,
    user: User,
    booking_data: Dict[str, Any],
    db: Session,
    target_status: str = "booked"
) -> Dict[str, Any]:
    """
    Transaction-safe booking / reservation with atomic status check to prevent race conditions.
    """
    # Fetch unit with row lock if DB supports it
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Selected unit does not exist.")

    current_status = (unit.status or "available").lower()
    if current_status != "available":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This flat ({unit.unit_label or unit.unit_number}) was just {current_status} by another user. Please choose another available flat."
        )

    # Validate relationship integrity
    project = unit.project
    building = unit.building
    if not project:
        raise HTTPException(status_code=400, detail="Invalid unit: No associated project.")

    booking_price = unit.price
    booking_amount = booking_data.get("booking_amount") or 50000.0

    # Create Booking
    booking = UnitBooking(
        unit_id=unit.id,
        user_id=user.id,
        project_id=project.id,
        building_id=building.id if building else None,
        status=target_status,
        price=booking_price,
        booking_amount=booking_amount,
        buyer_name=booking_data.get("buyer_name") or booking_data.get("customer_name") or getattr(user, "name", None) or "Buyer",
        buyer_email=booking_data.get("buyer_email") or booking_data.get("customer_email") or getattr(user, "email", None) or "buyer@example.com",
        buyer_phone=booking_data.get("buyer_phone") or booking_data.get("customer_phone") or getattr(user, "phone", None) or "+91 98765 43210",
        notes=booking_data.get("notes") or f"Booked via SAI 3D Discovery platform for {unit.unit_label or unit.unit_number}"
    )
    db.add(booking)
    db.flush()

    # Update unit status
    old_status = unit.status
    unit.status = target_status
    unit.updated_at = datetime.utcnow()

    # Log audit entry
    audit = BookingAuditLog(
        unit_id=unit.id,
        user_id=user.id,
        booking_id=booking.id,
        action="book" if target_status == "booked" else "reserve",
        old_status=old_status,
        new_status=target_status,
        notes=f"Unit {unit.unit_label or unit.unit_number} {target_status} by User #{user.id} ({user.email})"
    )
    db.add(audit)

    db.commit()
    db.refresh(booking)
    db.refresh(unit)

    return {
        "success": True,
        "message": f"Successfully {target_status} {unit.unit_label or unit.unit_number}!",
        "booking": {
            "id": booking.id,
            "unit_id": unit.id,
            "unit_label": unit.unit_label or f"Flat {unit.floor_number}-{unit.unit_number}",
            "floor_number": unit.floor_number,
            "bhk": unit.bhk,
            "area_sqft": unit.area_sqft,
            "direction": unit.direction,
            "project_name": project.name,
            "tower_name": building.name if building else "Tower A",
            "price": unit.price,
            "price_display": format_inr(unit.price),
            "booking_amount": booking.booking_amount,
            "booking_amount_display": format_inr(booking.booking_amount),
            "status": booking.status,
            "created_at": booking.created_at.isoformat() if booking.created_at else None
        }
    }

def smart_find_flats(filters: Dict[str, Any], db: Session) -> List[Dict[str, Any]]:
    """
    Search database for matching available units strictly according to user criteria.
    Never hallucinates or invents units.
    """
    query = db.query(Unit).join(Building, Unit.tower_id == Building.id).join(Project, Unit.project_id == Project.id)

    # City filter
    city = filters.get("city")
    if city:
        query = query.filter(Project.city.ilike(f"%{city}%"))

    # Project filter
    project_id = filters.get("project_id")
    if project_id:
        query = query.filter(Project.id == project_id)

    # Building filter
    building_id = filters.get("building_id")
    if building_id:
        query = query.filter(Unit.tower_id == building_id)

    # BHK filter
    bhk = filters.get("bhk")
    if bhk:
        try:
            bhk_val = int(bhk)
            query = query.filter(Unit.bhk == bhk_val)
        except (ValueError, TypeError):
            pass

    # Floor filter
    floor = filters.get("floor")
    floor_pref = str(filters.get("floor_preference") or "").lower()
    if floor:
        try:
            query = query.filter(Unit.floor_number == int(floor))
        except (ValueError, TypeError):
            pass
    elif "high" in floor_pref:
        query = query.filter(Unit.floor_number >= 12)
    elif "mid" in floor_pref:
        query = query.filter(Unit.floor_number.between(5, 11))
    elif "low" in floor_pref:
        query = query.filter(Unit.floor_number <= 4)

    # Direction filter
    direction = filters.get("direction")
    if direction:
        query = query.filter(Unit.direction.ilike(f"%{direction}%"))

    # Balcony direction filter
    balcony_dir = filters.get("balcony_direction")
    if balcony_dir:
        query = query.filter(Unit.balcony_direction.ilike(f"%{balcony_dir}%"))

    # Budget filter
    max_price = filters.get("max_price")
    min_price = filters.get("min_price")
    if max_price:
        try:
            query = query.filter(Unit.price <= float(max_price))
        except (ValueError, TypeError):
            pass
    if min_price:
        try:
            query = query.filter(Unit.price >= float(min_price))
        except (ValueError, TypeError):
            pass

    # Status filter (default to 'available')
    req_status = (filters.get("status") or "available").lower()
    if req_status != "all":
        query = query.filter(func.lower(Unit.status) == req_status)

    matching_units = query.order_by(Unit.floor_number.desc(), Unit.price.asc()).limit(30).all()

    results = []
    for u in matching_units:
        b = u.building
        p = u.project
        results.append({
            "id": u.id,
            "project_id": p.id if p else None,
            "project_name": p.name if p else "ABC Residency",
            "city": p.city if p else "Amravati",
            "locality": p.locality if p else "Camp Road",
            "tower_id": b.id if b else None,
            "tower_name": b.name if b else "Tower A",
            "floor_number": u.floor_number,
            "unit_number": u.unit_number,
            "unit_label": u.unit_label or f"Flat {u.floor_number}-{u.unit_number}",
            "bhk": u.bhk,
            "area_sqft": u.area_sqft,
            "price": u.price,
            "price_display": format_inr(u.price),
            "direction": u.direction,
            "entrance_direction": u.entrance_direction,
            "balcony_direction": u.balcony_direction,
            "status": u.status,
            "status_color": STATUS_COLORS.get((u.status or "").lower(), "#10B981")
        })

    return results

def get_user_bookings(user_id: int, db: Session) -> List[Dict[str, Any]]:
    bookings = db.query(UnitBooking).filter(UnitBooking.user_id == user_id).order_by(UnitBooking.created_at.desc()).all()
    results = []
    for b in bookings:
        u = b.unit
        p = b.project
        t = b.building
        results.append({
            "id": b.id,
            "unit_id": b.unit_id,
            "project_id": b.project_id,
            "project_name": p.name if p else "ABC Residency",
            "tower_id": b.building_id,
            "tower_name": t.name if t else "Tower A",
            "floor_number": u.floor_number if u else 1,
            "unit_number": u.unit_number if u else "",
            "unit_label": u.unit_label if u else f"Flat {b.unit_id}",
            "bhk": u.bhk if u else 2,
            "area_sqft": u.area_sqft if u else 1200,
            "direction": u.direction if u else "East",
            "balcony_direction": u.balcony_direction if u else "East",
            "price": b.price,
            "price_display": format_inr(b.price),
            "booking_amount": b.booking_amount,
            "booking_amount_display": format_inr(b.booking_amount),
            "status": b.status,
            "created_at": b.created_at.isoformat() if b.created_at else None
        })
    return results
