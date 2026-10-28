from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.project import Project, Building, Floor, Unit, UnitBooking, BookingAuditLog
from app.core.permissions import get_current_active_user, get_current_user_optional, require_roles
from app.services.building_3d_service import (
    get_building_3d_data,
    get_unit_3d_tour,
    reserve_or_book_unit,
    smart_find_flats,
    get_user_bookings
)

router = APIRouter(tags=["SAI 3D Discovery & Flat Booking"])

# ── 1. PROJECT BUILDINGS ──────────────────────────────────────────────────

@router.get("/projects/{project_id}/buildings")
def get_project_buildings(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    buildings = db.query(Building).filter(Building.project_id == project_id).all()
    result = []
    for b in buildings:
        units_count = db.query(Unit).filter(Unit.tower_id == b.id).count()
        avail_count = db.query(Unit).filter(Unit.tower_id == b.id, Unit.status == "available").count()
        result.append({
            "id": b.id,
            "project_id": b.project_id,
            "name": b.name,
            "code": b.code,
            "floors_count": b.floors_count or 10,
            "units_per_floor": b.units_per_floor or 4,
            "total_units": units_count or b.total_units or 40,
            "available_units": avail_count,
            "description": b.description,
            "status": b.status,
            "orientation": b.orientation or 0.0,
            "front_direction": b.front_direction or "North",
            "floor_height": b.floor_height or 3.2,
            "building_width": b.building_width or 40.0,
            "building_depth": b.building_depth or 26.0
        })
    return result

# ── 2. BUILDING DETAILS & 3D SCENE DATA ───────────────────────────────────

@router.get("/buildings/{building_id}")
def get_building_details(building_id: int, db: Session = Depends(get_db)):
    building = db.query(Building).filter(Building.id == building_id).first()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    return {
        "id": building.id,
        "project_id": building.project_id,
        "name": building.name,
        "code": building.code,
        "floors_count": building.floors_count,
        "units_per_floor": building.units_per_floor,
        "total_units": building.total_units,
        "status": building.status,
        "orientation": building.orientation,
        "front_direction": building.front_direction,
        "floor_height": building.floor_height,
        "building_width": building.building_width,
        "building_depth": building.building_depth,
        "amenities": building.amenities
    }

@router.get("/buildings/{building_id}/3d-data")
@router.get("/buildings/{building_id}/3d-model")
def get_building_3d(building_id: int, db: Session = Depends(get_db)):
    return get_building_3d_data(building_id, db)

@router.get("/buildings/{building_id}/floors")
def get_building_floors(building_id: int, db: Session = Depends(get_db)):
    floors = db.query(Floor).filter(Floor.building_id == building_id).order_by(Floor.floor_number.asc()).all()
    result = []
    for f in floors:
        units = db.query(Unit).filter(Unit.floor_id == f.id).all()
        avail = sum(1 for u in units if (u.status or "").lower() == "available")
        result.append({
            "id": f.id,
            "building_id": f.building_id,
            "floor_number": f.floor_number,
            "floor_label": f.floor_label or f"Floor {f.floor_number}",
            "floor_type": f.floor_type or "residential",
            "height_offset": f.height_offset or ((f.floor_number - 1) * 3.2),
            "total_units": len(units),
            "available_units": avail
        })
    return result

# ── 3. FLOOR UNITS ─────────────────────────────────────────────────────────

@router.get("/floors/{floor_id}/units")
def get_floor_units(floor_id: int, db: Session = Depends(get_db)):
    floor = db.query(Floor).filter(Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")

    units = db.query(Unit).filter(Unit.floor_id == floor_id).order_by(Unit.unit_number.asc()).all()
    result = []
    for u in units:
        result.append({
            "id": u.id,
            "project_id": u.project_id,
            "tower_id": u.tower_id,
            "floor_id": u.floor_id,
            "floor_number": u.floor_number,
            "unit_number": u.unit_number,
            "unit_label": u.unit_label or f"Flat {u.floor_number}-{u.unit_number}",
            "bhk": u.bhk,
            "bedrooms": u.bedrooms or u.bhk,
            "bathrooms": u.bathrooms or 2,
            "balconies": u.balconies or 1,
            "area_sqft": u.area_sqft,
            "carpet_area": u.carpet_area or u.area_sqft,
            "built_up_area": u.built_up_area or (u.area_sqft * 1.15),
            "price": u.price,
            "direction": u.direction,
            "entrance_direction": u.entrance_direction,
            "balcony_direction": u.balcony_direction,
            "position_x": u.position_x,
            "position_y": u.position_y,
            "position_z": u.position_z,
            "wing": u.wing,
            "status": u.status
        })
    return result

# ── 4. UNIT DISCOVERY & DETAILS ───────────────────────────────────────────

@router.get("/units/find")
@router.get("/units/search")
def find_units_smart(
    city: Optional[str] = None,
    project_id: Optional[int] = None,
    building_id: Optional[int] = None,
    bhk: Optional[int] = None,
    floor: Optional[int] = None,
    floor_preference: Optional[str] = None,
    direction: Optional[str] = None,
    balcony_direction: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    status: Optional[str] = "available",
    db: Session = Depends(get_db)
):
    filters = {
        "city": city,
        "project_id": project_id,
        "building_id": building_id,
        "bhk": bhk,
        "floor": floor,
        "floor_preference": floor_preference,
        "direction": direction,
        "balcony_direction": balcony_direction,
        "min_price": min_price,
        "max_price": max_price,
        "status": status
    }
    return smart_find_flats(filters, db)

@router.get("/units/{unit_id}")
def get_unit_details(unit_id: int, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    building = unit.building
    project = unit.project

    return {
        "id": unit.id,
        "project_id": unit.project_id,
        "project_name": project.name if project else None,
        "project_city": project.city if project else None,
        "project_locality": project.locality if project else None,
        "tower_id": unit.tower_id,
        "tower_name": building.name if building else "Tower A",
        "floor_id": unit.floor_id,
        "floor_number": unit.floor_number,
        "unit_number": unit.unit_number,
        "unit_label": unit.unit_label or f"Flat {unit.floor_number}-{unit.unit_number}",
        "bhk": unit.bhk,
        "bedrooms": unit.bedrooms or unit.bhk,
        "bathrooms": unit.bathrooms or 2,
        "balconies": unit.balconies or 1,
        "area_sqft": unit.area_sqft,
        "carpet_area": unit.carpet_area or unit.area_sqft,
        "built_up_area": unit.built_up_area or (unit.area_sqft * 1.15),
        "price": unit.price,
        "parking": unit.parking,
        "direction": unit.direction or "East",
        "entrance_direction": unit.entrance_direction or "North",
        "balcony_direction": unit.balcony_direction or "East",
        "position_x": unit.position_x,
        "position_y": unit.position_y,
        "position_z": unit.position_z,
        "wing": unit.wing,
        "status": unit.status,
        "floor_plan_url": unit.floor_plan_url,
        "floor_plan_data": unit.floor_plan_data or {}
    }

@router.get("/units/{unit_id}/availability")
def get_unit_availability(unit_id: int, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return {
        "unit_id": unit.id,
        "status": (unit.status or "available").lower(),
        "is_available": (unit.status or "available").lower() == "available",
        "price": unit.price,
        "updated_at": unit.updated_at.isoformat() if unit.updated_at else None
    }

@router.get("/units/{unit_id}/3d-tour")
def get_unit_walkthrough_3d(unit_id: int, db: Session = Depends(get_db)):
    return get_unit_3d_tour(unit_id, db)

@router.get("/units/{unit_id}/floor-plan")
def get_unit_floor_plan(unit_id: int, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return {
        "unit_id": unit.id,
        "unit_label": unit.unit_label or f"Flat {unit.floor_number}-{unit.unit_number}",
        "bhk": unit.bhk,
        "carpet_area": unit.carpet_area or unit.area_sqft,
        "built_up_area": unit.built_up_area or (unit.area_sqft * 1.15),
        "floor_plan_url": unit.floor_plan_url,
        "floor_plan_data": unit.floor_plan_data or {
            "rooms": [
                {"name": "Living Room", "dimensions": "18'0\" x 12'6\""},
                {"name": "Kitchen", "dimensions": "10'0\" x 8'6\""},
                {"name": "Master Bedroom", "dimensions": "14'0\" x 12'0\""},
                {"name": "Bedroom 2", "dimensions": "12'0\" x 11'0\""},
                {"name": "Balcony", "dimensions": "12'0\" x 5'0\""}
            ]
        }
    }

# ── 5. TRANSACTION-SAFE BOOKING & RESERVATION ──────────────────────────────

@router.post("/units/{unit_id}/reserve")
def reserve_unit_endpoint(
    unit_id: int,
    payload: Dict[str, Any] = Body(default={}),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = current_user or db.query(User).filter(User.role == UserRole.BUYER).first()
    if not user:
        user = db.query(User).first()
    return reserve_or_book_unit(unit_id, user, payload, db, target_status="reserved")

@router.post("/units/{unit_id}/book")
@router.post("/bookings")
def book_unit_endpoint(
    payload: Dict[str, Any] = Body(...),
    unit_id: Optional[int] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    target_unit_id = unit_id or payload.get("unit_id")
    if not target_unit_id:
        raise HTTPException(status_code=400, detail="Unit ID is required for booking.")

    user = current_user or db.query(User).filter(User.role == UserRole.BUYER).first()
    if not user:
        user = db.query(User).first()
    return reserve_or_book_unit(target_unit_id, user, payload, db, target_status="booked")

@router.get("/bookings/my")
def get_my_bookings(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user = current_user or db.query(User).filter(User.role == UserRole.BUYER).first()
    if not user:
        user = db.query(User).first()
    if not user:
        return []
    return get_user_bookings(user.id, db)

# ── 6. BUILDER / ADMIN INVENTORY MANAGEMENT ───────────────────────────────

@router.post("/buildings/{building_id}/generate-units")
def generate_building_units(
    building_id: int,
    payload: Dict[str, Any] = Body(default={}),
    current_user: User = Depends(require_roles(UserRole.BUILDER, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    building = db.query(Building).filter(Building.id == building_id).first()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")

    total_floors = payload.get("floors") or building.floors_count or 10
    units_per_floor = payload.get("units_per_floor") or building.units_per_floor or 4
    base_price = payload.get("base_price") or 7000000.0

    building.floors_count = total_floors
    building.units_per_floor = units_per_floor
    building.total_units = total_floors * units_per_floor

    # Ensure floors exist
    existing_floors = {f.floor_number: f for f in db.query(Floor).filter(Floor.building_id == building_id).all()}
    for fn in range(1, total_floors + 1):
        if fn not in existing_floors:
            fl = Floor(
                building_id=building_id,
                floor_number=fn,
                floor_label=f"Floor {fn}",
                height_offset=(fn - 1) * (building.floor_height or 3.2)
            )
            db.add(fl)
            db.flush()
            existing_floors[fn] = fl

    # Unit letters
    letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"][:units_per_floor]
    existing_units = {(u.floor_number, u.unit_number): u for u in db.query(Unit).filter(Unit.tower_id == building_id).all()}

    created_count = 0
    for fn in range(1, total_floors + 1):
        fl = existing_floors[fn]
        for idx, ltr in enumerate(letters):
            if (fn, ltr) not in existing_units:
                u = Unit(
                    project_id=building.project_id,
                    tower_id=building.id,
                    floor_id=fl.id,
                    floor_number=fn,
                    unit_number=ltr,
                    unit_label=f"Flat {fn}-{ltr}",
                    bhk=2 if idx % 2 == 0 else 3,
                    bedrooms=2 if idx % 2 == 0 else 3,
                    bathrooms=2,
                    balconies=1 if idx % 2 == 0 else 2,
                    area_sqft=1100.0 if idx % 2 == 0 else 1450.0,
                    carpet_area=1100.0 if idx % 2 == 0 else 1450.0,
                    built_up_area=1250.0 if idx % 2 == 0 else 1650.0,
                    price=base_price + ((fn - 1) * 35000) + (idx * 200000),
                    parking="1 Covered",
                    direction="East" if idx % 2 == 0 else "North",
                    entrance_direction="South",
                    balcony_direction="East" if idx % 2 == 0 else "North",
                    position_x=-15.0 + (idx * 10.0),
                    position_y=(fn - 1) * 3.2,
                    position_z=-7.0 if idx < units_per_floor / 2 else 7.0,
                    status="available"
                )
                db.add(u)
                created_count += 1

    db.commit()
    return {
        "success": True,
        "message": f"Successfully generated {created_count} units across {total_floors} floors.",
        "total_units": total_floors * units_per_floor
    }

@router.patch("/units/{unit_id}/status")
def update_unit_status(
    unit_id: int,
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(require_roles(UserRole.BUILDER, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    new_status = payload.get("status")
    if not new_status or new_status.lower() not in ["available", "reserved", "booked", "sold", "blocked"]:
        raise HTTPException(status_code=400, detail="Invalid status value.")

    old_status = unit.status
    unit.status = new_status.lower()

    audit = BookingAuditLog(
        unit_id=unit.id,
        user_id=current_user.id,
        action="status_change",
        old_status=old_status,
        new_status=new_status.lower(),
        notes=payload.get("notes") or f"Status changed to {new_status} by User #{current_user.id}"
    )
    db.add(audit)
    db.commit()

    return {"success": True, "unit_id": unit.id, "old_status": old_status, "new_status": unit.status}
