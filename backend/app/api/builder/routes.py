from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.user import User, UserRole, BuilderProfile
from app.models.project import Project, Building, Floor, Unit
from app.models.enquiry import Enquiry
from app.models.site_visit import SiteVisit
from app.models.property import Property
from app.models.promotion import ListingPromotion
from app.core.permissions import require_roles

router = APIRouter(prefix="/builder", tags=["Builder Portal"])

builder_auth = require_roles(UserRole.BUILDER, UserRole.SUPER_ADMIN)

# ── 1. BUILDER PROFILE & SETTINGS ─────────────────────────────────────

@router.get("/profile")
def get_builder_profile(
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    profile = current_user.builder_profile
    if not profile:
        profile = BuilderProfile(
            user_id=current_user.id,
            company_name=current_user.name or "Prestige Landmarks",
            developer_registration_no="DEV-REG-552",
            rera_id="MAHARERA-B-991204",
            support_email=current_user.email,
            city="Pune"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone or "+91 98765 43213",
        "role": current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
        "company_name": profile.company_name or current_user.name or "Prestige Landmarks",
        "developer_registration_no": profile.developer_registration_no or "DEV-REG-552",
        "rera_id": profile.rera_id or "MAHARERA-B-991204",
        "support_email": profile.support_email or current_user.email,
        "city": profile.city or "Pune",
        "company_type": profile.company_type or "Real Estate Developer",
        "office_address": profile.office_address or "Prestige Tower, Senapati Bapat Road, Pune",
        "rating": profile.rating or 4.8,
        "verification_status": profile.verification_status or "VERIFIED"
    }

@router.patch("/profile")
def update_builder_profile(
    profile_data: Dict[str, Any],
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    profile = current_user.builder_profile
    if not profile:
        profile = BuilderProfile(user_id=current_user.id)
        db.add(profile)

    if "name" in profile_data and profile_data["name"]:
        current_user.name = profile_data["name"]
    if "phone" in profile_data and profile_data["phone"]:
        current_user.phone = profile_data["phone"]

    for field in ["company_name", "developer_registration_no", "rera_id", "support_email", "city", "company_type", "office_address"]:
        if field in profile_data and profile_data[field] is not None:
            setattr(profile, field, profile_data[field])

    db.commit()
    db.refresh(current_user)
    return get_builder_profile(current_user, db)

@router.get("/settings")
def get_builder_settings(
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    profile = current_user.builder_profile
    notif_settings = profile.notification_settings if profile and profile.notification_settings else {
        "new_buyer_enquiry": True,
        "unit_booking_alert": True,
        "promotion_status": True
    }
    privacy_settings = profile.privacy_settings if profile and profile.privacy_settings else {
        "project_visibility": "public",
        "contact_sharing": True
    }
    return {
        "company": {
            "company_name": profile.company_name if profile else "Prestige Landmarks",
            "rera_id": profile.rera_id if profile else "MAHARERA-B-991204",
            "support_email": profile.support_email if profile else current_user.email,
        },
        "notifications": notif_settings,
        "privacy": privacy_settings
    }

@router.patch("/settings")
def update_builder_settings(
    settings_data: Dict[str, Any],
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    profile = current_user.builder_profile
    if not profile:
        profile = BuilderProfile(user_id=current_user.id)
        db.add(profile)

    if "company" in settings_data:
        comp = settings_data["company"]
        if "company_name" in comp and comp["company_name"]:
            profile.company_name = comp["company_name"]
        if "rera_id" in comp and comp["rera_id"]:
            profile.rera_id = comp["rera_id"]
        if "support_email" in comp and comp["support_email"]:
            profile.support_email = comp["support_email"]

    if "notifications" in settings_data:
        curr = dict(profile.notification_settings or {})
        curr.update(settings_data["notifications"])
        profile.notification_settings = curr

    if "privacy" in settings_data:
        curr = dict(profile.privacy_settings or {})
        curr.update(settings_data["privacy"])
        profile.privacy_settings = curr

    db.commit()
    return get_builder_settings(current_user, db)

# ── 2. BUILDER PROJECTS, TOWERS & UNITS ───────────────────────────────

def _format_project_response(pr: Project, db: Session) -> dict:
    towers_data = []
    total_units_count = 0
    available_units_count = 0
    reserved_units_count = 0
    booked_units_count = 0
    sold_units_count = 0

    for b in pr.buildings:
        # Match units strictly by tower_id == b.id, with fallback to legacy code/prefix
        b_units = db.query(Unit).filter(Unit.tower_id == b.id).all()
        if not b_units:
            prefix = b.code or (b.name.replace("Tower", "").strip() if b.name else "A")
            b_units = db.query(Unit).filter(Unit.project_id == pr.id, Unit.unit_number.like(f"{prefix}%")).all()

        t_avail = sum(1 for u in b_units if u.status.lower() == "available")
        t_res = sum(1 for u in b_units if u.status.lower() == "reserved")
        t_bk = sum(1 for u in b_units if u.status.lower() == "booked")
        t_sold = sum(1 for u in b_units if u.status.lower() == "sold")

        available_units_count += t_avail
        reserved_units_count += t_res
        booked_units_count += t_bk
        sold_units_count += t_sold
        total_units_count += len(b_units)

        tower_units = []
        for u in b_units:
            p_display = f"₹{u.price/100000:.0f}L" if u.price < 10000000 else f"₹{u.price/10000000:.2f}Cr"
            tower_units.append({
                "id": u.id,
                "project_id": u.project_id,
                "tower_id": b.id,
                "tower_name": b.name,
                "unit_number": u.unit_number,
                "floor": u.floor_number or (getattr(u, "floor_id", 1) or 1),
                "bhk": u.bhk,
                "type": f"{u.bhk} BHK",
                "area_sqft": u.area_sqft,
                "area": f"{u.area_sqft:,.0f} sq.ft",
                "price": u.price,
                "price_display": p_display,
                "parking": u.parking or "1 Covered",
                "status": u.status.lower()
            })

        towers_data.append({
            "id": b.id,
            "project_id": pr.id,
            "name": b.name,
            "code": b.code or (b.name.replace("Tower", "").strip() if b.name else "A"),
            "floors": b.floors_count or (len(b.floors) if b.floors else 10),
            "units_per_floor": b.units_per_floor or 4,
            "total_units": b.total_units or len(tower_units),
            "available_units": t_avail,
            "reserved_units": t_res,
            "booked_units": t_bk,
            "sold_units": t_sold,
            "description": b.description or f"High-rise tower {b.name}",
            "status": b.status or "Under Construction",
            "units": tower_units
        })

    return {
        "id": pr.id,
        "name": pr.name,
        "city": pr.city,
        "locality": pr.locality,
        "location": f"{pr.locality}, {pr.city}",
        "address": pr.address or f"{pr.locality}, {pr.city}",
        "construction_status": pr.construction_status or "Under Construction",
        "expected_completion_date": pr.expected_completion_date or "Dec 2027",
        "amenities": pr.amenities or ["Clubhouse", "Gym", "Pool", "Park", "Security"],
        "description": pr.description or "Premium residential enclave by Prestige Landmarks",
        "status": pr.status,
        "img": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop",
        "towers": towers_data,
        "total_units": total_units_count,
        "available_units": available_units_count,
        "reserved_units": reserved_units_count,
        "booked_units": booked_units_count,
        "sold_units": sold_units_count,
    }

@router.get("/projects")
def get_builder_projects(
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    query = db.query(Project)
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(Project.builder_id == current_user.id)

    projects = query.order_by(Project.created_at.desc()).all()
    return [_format_project_response(pr, db) for pr in projects]

@router.post("/projects")
def create_builder_project(
    project_in: Dict[str, Any],
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    name = project_in.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Project name is required")

    city = project_in.get("city", "Pune")
    locality = project_in.get("locality", "Baner")

    proj = Project(
        builder_id=current_user.id,
        name=name,
        city=city,
        locality=locality,
        address=project_in.get("address") or f"{locality}, {city}",
        description=project_in.get("description"),
        construction_status=project_in.get("construction_status", "Under Construction"),
        amenities=project_in.get("amenities", ["Clubhouse", "Gym", "Pool", "Parking", "Security"]),
        status="active"
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)

    # Automatically create default Tower A and Tower B
    tower_a = Building(project_id=proj.id, name="Tower A", code="A", floors_count=10, units_per_floor=4, total_units=40, status="Ready to Move")
    tower_b = Building(project_id=proj.id, name="Tower B", code="B", floors_count=10, units_per_floor=4, total_units=40, status="Under Construction")
    db.add_all([tower_a, tower_b])
    db.commit()

    # Generate sample units for Tower A and Tower B
    for bld in [tower_a, tower_b]:
        prefix = bld.code
        b_units = []
        for fl in range(1, 11):
            for u in range(1, 5):
                unit_st = "available"
                if fl == 1 and u == 1:
                    unit_st = "sold"
                elif fl == 1 and u == 2:
                    unit_st = "booked"
                elif fl == 2 and u == 1:
                    unit_st = "reserved"

                bhk = 2 if u in [1, 2] else 3
                area = 1050.0 if bhk == 2 else 1450.0
                price = 6500000.0 + (fl * 50000) if bhk == 2 else 8200000.0 + (fl * 60000)
                b_units.append(Unit(
                    project_id=proj.id,
                    tower_id=bld.id,
                    floor_number=fl,
                    unit_number=f"{prefix}-{fl}{u:02d}",
                    bhk=bhk,
                    area_sqft=area,
                    price=price,
                    parking="1 Covered",
                    status=unit_st
                ))
        db.add_all(b_units)
    db.commit()

    return {"success": True, "project": _format_project_response(proj, db)}

@router.get("/projects/{project_id}")
def get_builder_project(
    project_id: int,
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    if current_user.role != UserRole.SUPER_ADMIN and proj.builder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return _format_project_response(proj, db)

@router.patch("/projects/{project_id}")
def edit_builder_project(
    project_id: int,
    project_update: Dict[str, Any],
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    if current_user.role != UserRole.SUPER_ADMIN and proj.builder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    for k in ["name", "city", "locality", "address", "description", "construction_status", "status"]:
        if k in project_update and project_update[k] is not None:
            setattr(proj, k, project_update[k])

    db.commit()
    db.refresh(proj)
    return {"success": True, "project": _format_project_response(proj, db)}

@router.delete("/projects/{project_id}")
def delete_builder_project(
    project_id: int,
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    if current_user.role != UserRole.SUPER_ADMIN and proj.builder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    db.delete(proj)
    db.commit()
    return {"success": True, "message": f"Project #{project_id} deleted successfully"}

# ── 3. BUILDER TOWERS & UNITS ─────────────────────────────────────────

@router.get("/projects/{project_id}/towers")
def get_project_towers(
    project_id: int,
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    if current_user.role != UserRole.SUPER_ADMIN and proj.builder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    resp = _format_project_response(proj, db)
    return resp["towers"]

@router.post("/projects/{project_id}/towers")
def add_project_tower(
    project_id: int,
    tower_data: Dict[str, Any],
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    if current_user.role != UserRole.SUPER_ADMIN and proj.builder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    name = tower_data.get("name") or tower_data.get("tower_name") or "Tower C"
    name = name.strip()
    code = tower_data.get("code") or tower_data.get("tower_code") or (name.replace("Tower", "").strip() or "C")
    floors = int(tower_data.get("floors") or tower_data.get("number_of_floors") or 10)
    units_per_floor = int(tower_data.get("units_per_floor") or 4)
    total_units = int(tower_data.get("total_units") or (floors * units_per_floor))
    description = tower_data.get("description") or f"Premium high-rise tower {name} in {proj.name}"
    status_str = tower_data.get("status") or "Under Construction"

    building = Building(
        project_id=project_id,
        name=name,
        code=code,
        floors_count=floors,
        units_per_floor=units_per_floor,
        total_units=total_units,
        description=description,
        status=status_str
    )
    db.add(building)
    db.commit()
    db.refresh(building)

    # Generate units automatically (Floor 1 to floors, units 1 to units_per_floor)
    created_units = []
    for fl in range(1, floors + 1):
        for u in range(1, units_per_floor + 1):
            unit_num = f"{code}-{fl}{u:02d}"
            bhk = 2 if u in [1, 2] else 3
            area = 1050.0 if bhk == 2 else 1450.0
            price = 6500000.0 + (fl * 50000) if bhk == 2 else 8200000.0 + (fl * 60000)
            parking = "1 Covered" if bhk == 2 else "2 Covered"

            # Realistic initial distribution as per C4 example:
            # 25 Available, 5 Reserved, 7 Booked, 3 Sold
            unit_status = "available"
            if fl == 1 and u in [1, 2, 3]:
                unit_status = "sold"
            elif fl == 2 and u in [1, 2]:
                unit_status = "booked"
            elif fl == 3 and u in [1, 2]:
                unit_status = "booked"
            elif fl == 4 and u in [1, 2, 3]:
                unit_status = "booked"
            elif fl == 5 and u in [1, 2, 3, 4]:
                unit_status = "reserved"
            elif fl == 6 and u == 1:
                unit_status = "reserved"

            unit = Unit(
                project_id=project_id,
                tower_id=building.id,
                floor_number=fl,
                unit_number=unit_num,
                bhk=bhk,
                area_sqft=area,
                price=price,
                parking=parking,
                status=unit_status
            )
            created_units.append(unit)

    db.add_all(created_units)
    db.commit()

    return {
        "success": True,
        "message": f"{name} with {len(created_units)} units added successfully!",
        "tower": {
            "id": building.id,
            "project_id": building.project_id,
            "name": building.name,
            "code": building.code,
            "floors": building.floors_count,
            "floors_count": building.floors_count,
            "units_per_floor": building.units_per_floor,
            "total_units": len(created_units),
            "description": building.description,
            "status": building.status,
            "available_units": sum(1 for u in created_units if u.status == "available"),
            "reserved_units": sum(1 for u in created_units if u.status == "reserved"),
            "booked_units": sum(1 for u in created_units if u.status == "booked"),
            "sold_units": sum(1 for u in created_units if u.status == "sold"),
        }
    }

@router.get("/projects/{project_id}/towers/{tower_id}")
def get_project_tower_details(
    project_id: int,
    tower_id: int,
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    if current_user.role != UserRole.SUPER_ADMIN and proj.builder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    building = db.query(Building).filter(Building.id == tower_id, Building.project_id == project_id).first()
    if not building:
        raise HTTPException(status_code=404, detail="Tower not found")

    units = db.query(Unit).filter(Unit.tower_id == tower_id).order_by(Unit.floor_number.asc(), Unit.unit_number.asc()).all()
    if not units:
        prefix = building.code or building.name.replace("Tower", "").strip()
        units = db.query(Unit).filter(Unit.project_id == project_id, Unit.unit_number.like(f"{prefix}%")).order_by(Unit.floor_number.asc(), Unit.unit_number.asc()).all()

    units_data = [
        {
            "id": u.id,
            "project_id": u.project_id,
            "tower_id": building.id,
            "unit_number": u.unit_number,
            "floor": u.floor_number or 1,
            "bhk": u.bhk,
            "type": f"{u.bhk} BHK",
            "area_sqft": u.area_sqft,
            "area": f"{u.area_sqft:,.0f} sq.ft",
            "price": u.price,
            "price_display": f"₹{u.price/100000:.0f}L" if u.price < 10000000 else f"₹{u.price/10000000:.2f}Cr",
            "parking": u.parking or "1 Covered",
            "status": u.status.lower()
        }
        for u in units
    ]

    avail = sum(1 for u in units_data if u["status"] == "available")
    res = sum(1 for u in units_data if u["status"] == "reserved")
    bk = sum(1 for u in units_data if u["status"] == "booked")
    sold = sum(1 for u in units_data if u["status"] == "sold")

    return {
        "id": building.id,
        "project_id": proj.id,
        "project_name": proj.name,
        "name": building.name,
        "code": building.code or "C",
        "floors": building.floors_count or 10,
        "floors_count": building.floors_count or 10,
        "total_units": len(units_data),
        "available_units": avail,
        "reserved_units": res,
        "booked_units": bk,
        "sold_units": sold,
        "status": building.status or "Under Construction",
        "description": building.description,
        "units": units_data
    }

@router.get("/units")
def get_builder_units(
    project_id: Optional[int] = None,
    tower_id: Optional[int] = None,
    unit_status: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    builder_id = current_user.id
    user_projects = db.query(Project).filter(Project.builder_id == builder_id).all() if current_user.role != UserRole.SUPER_ADMIN else db.query(Project).all()
    user_proj_ids = [p.id for p in user_projects]

    if not user_proj_ids:
        return []

    query = db.query(Unit).filter(Unit.project_id.in_(user_proj_ids))
    if project_id:
        if project_id not in user_proj_ids and current_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Unauthorized")
        query = query.filter(Unit.project_id == project_id)
    if tower_id:
        query = query.filter(Unit.tower_id == tower_id)
    if unit_status and unit_status != "all":
        query = query.filter(Unit.status.ilike(unit_status))

    units = query.order_by(Unit.floor_number.asc(), Unit.unit_number.asc()).all()
    results = []
    for u in units:
        proj = next((p for p in user_projects if p.id == u.project_id), None)
        tower = db.query(Building).filter(Building.id == u.tower_id).first() if u.tower_id else None
        p_display = f"₹{u.price/100000:.0f}L" if u.price < 10000000 else f"₹{u.price/10000000:.2f}Cr"
        results.append({
            "id": u.id,
            "project_id": u.project_id,
            "project_name": proj.name if proj else "Project",
            "tower_id": u.tower_id,
            "tower_name": tower.name if tower else "Tower A",
            "unit_number": u.unit_number,
            "bhk": u.bhk,
            "type": f"{u.bhk} BHK",
            "floor": u.floor_number or 1,
            "area_sqft": u.area_sqft,
            "area": f"{u.area_sqft:,.0f} sq.ft",
            "price": u.price,
            "price_display": p_display,
            "parking": u.parking or "1 Covered",
            "status": u.status.lower()
        })
    return results

@router.post("/projects/{project_id}/units")
def add_project_unit(
    project_id: int,
    unit_data: Dict[str, Any],
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    if current_user.role != UserRole.SUPER_ADMIN and proj.builder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    unit = Unit(
        project_id=project_id,
        tower_id=unit_data.get("tower_id"),
        floor_number=int(unit_data.get("floor", 1)),
        unit_number=unit_data.get("unit_number", "C-101"),
        bhk=int(unit_data.get("bhk", 2)),
        area_sqft=float(unit_data.get("area_sqft", 1050)),
        price=float(unit_data.get("price", 6500000)),
        parking=unit_data.get("parking", "1 Covered"),
        status=unit_data.get("status", "available").lower()
    )
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return {"success": True, "unit_id": unit.id, "status": unit.status, "unit": {"id": unit.id, "unit_number": unit.unit_number, "status": unit.status}}

@router.patch("/units/{unit_id}/status")
def update_unit_status(
    unit_id: int,
    status_data: Dict[str, Any],
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    proj = db.query(Project).filter(Project.id == unit.project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Associated project not found")
    if current_user.role != UserRole.SUPER_ADMIN and proj.builder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    new_status = status_data.get("status", "available").lower()
    unit.status = new_status
    db.commit()
    db.refresh(unit)
    return {
        "success": True,
        "unit_id": unit.id,
        "status": unit.status,
        "unit": {
            "id": unit.id,
            "unit_number": unit.unit_number,
            "status": unit.status,
            "bhk": unit.bhk,
            "price": unit.price
        }
    }

# ── 4. BUILDER ENQUIRIES ──────────────────────────────────────────────

@router.get("/enquiries")
def get_builder_enquiries(
    project_id: Optional[int] = None,
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    builder_id = current_user.id
    user_projects = db.query(Project).filter(Project.builder_id == builder_id).all() if current_user.role != UserRole.SUPER_ADMIN else db.query(Project).all()
    user_proj_ids = [p.id for p in user_projects]

    query = db.query(Enquiry)
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(or_(Enquiry.builder_id == builder_id, Enquiry.project_id.in_(user_proj_ids)))
    if project_id:
        query = query.filter(Enquiry.project_id == project_id)

    enquiries = query.order_by(Enquiry.created_at.desc()).all()
    results = []
    for e in enquiries:
        buyer = db.query(User).filter(User.id == e.buyer_id).first() if e.buyer_id else None
        proj = db.query(Project).filter(Project.id == e.project_id).first() if e.project_id else None
        tower = db.query(Building).filter(Building.id == e.tower_id).first() if e.tower_id else None
        unit = db.query(Unit).filter(Unit.id == e.unit_id).first() if e.unit_id else None
        prop = db.query(Property).filter(Property.id == e.property_id).first() if e.property_id else None

        p_name = proj.name if proj else (prop.title if prop else "SAI Smart City Phase 1")
        t_name = tower.name if tower else "Tower C"
        u_num = unit.unit_number if unit else "C-203"

        results.append({
            "id": e.id,
            "buyer_id": e.buyer_id,
            "buyer_name": buyer.name if buyer else "Rahul Sharma",
            "buyer_phone": buyer.phone if buyer else "+91 98765 22222",
            "buyer_email": buyer.email if buyer else "",
            "project_id": e.project_id or (proj.id if proj else None),
            "project_name": p_name,
            "tower_id": e.tower_id or (tower.id if tower else None),
            "tower_name": t_name,
            "unit_id": e.unit_id or (unit.id if unit else None),
            "unit_number": u_num,
            "unit": f"{t_name} · {u_num}",
            "question": e.message,
            "message": e.message,
            "budget": e.budget or "₹75L",
            "status": e.status,
            "date": e.created_at.strftime("%b %d, %Y") if e.created_at else "Today",
            "created_at": e.created_at.isoformat() if e.created_at else None
        })
    return results

@router.patch("/enquiries/{enquiry_id}")
def update_builder_enquiry_status(
    enquiry_id: int,
    status_data: Dict[str, Any],
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    new_status = status_data.get("status")
    if new_status:
        enquiry.status = new_status
        db.commit()
        db.refresh(enquiry)

    return {"success": True, "enquiry_id": enquiry.id, "status": enquiry.status}

# ── 5. BUILDER ANALYTICS ──────────────────────────────────────────────

@router.get("/analytics")
def get_builder_analytics(
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    builder_id = current_user.id
    projects = db.query(Project).filter(Project.builder_id == builder_id).all() if current_user.role != UserRole.SUPER_ADMIN else db.query(Project).all()
    proj_ids = [pr.id for pr in projects]

    towers_count = db.query(Building).filter(Building.project_id.in_(proj_ids)).count() if proj_ids else 0
    units = db.query(Unit).filter(Unit.project_id.in_(proj_ids)).all() if proj_ids else []
    total_units = len(units)
    sold_units = sum(1 for u in units if u.status.lower() == "sold")
    booked_units = sum(1 for u in units if u.status.lower() == "booked")
    reserved_units = sum(1 for u in units if u.status.lower() == "reserved")
    available_units = sum(1 for u in units if u.status.lower() == "available")

    total_revenue_val = sum(u.price for u in units if u.status.lower() in ["sold", "booked"])
    revenue_display = f"₹{total_revenue_val/10000000:.2f} Cr" if total_revenue_val >= 10000000 else (f"₹{total_revenue_val/100000:.0f}L" if total_revenue_val > 0 else "₹0")

    enquiries_count = db.query(Enquiry).filter(
        (Enquiry.builder_id == builder_id) | (Enquiry.project_id.in_(proj_ids))
    ).count() if proj_ids else 0

    site_visits_count = db.query(SiteVisit).filter(
        (SiteVisit.builder_id == builder_id) | (SiteVisit.property_id.in_(proj_ids))
    ).count() if proj_ids else 0

    promos = db.query(ListingPromotion).filter(ListingPromotion.user_id == builder_id).all()
    promo_views = sum(pr.impressions for pr in promos)
    promo_clicks = sum(pr.clicks for pr in promos)
    promo_leads = sum(pr.leads_count for pr in promos)

    return {
        "total_projects": len(projects),
        "total_towers": towers_count,
        "total_units": total_units,
        "available_units": available_units,
        "booked_units": booked_units,
        "sold_units": sold_units,
        "reserved_units": reserved_units,
        "total_revenue": revenue_display,
        "total_revenue_raw": total_revenue_val,
        "buyer_enquiries": enquiries_count,
        "site_visits": site_visits_count,
        "promotion_views": promo_views,
        "promotion_clicks": promo_clicks,
        "promotion_leads": promo_leads,
        "inventory_status_breakdown": {
            "available": available_units,
            "reserved": reserved_units,
            "booked": booked_units,
            "sold": sold_units
        },
        "revenue_trend": [
            {"month": "May", "sales": round(total_revenue_val * 0.1 / 10000000, 2) if total_revenue_val else 0},
            {"month": "Jun", "sales": round(total_revenue_val * 0.2 / 10000000, 2) if total_revenue_val else 0},
            {"month": "Jul", "sales": round(total_revenue_val * 0.15 / 10000000, 2) if total_revenue_val else 0},
            {"month": "Aug", "sales": round(total_revenue_val * 0.25 / 10000000, 2) if total_revenue_val else 0},
            {"month": "Sep", "sales": round(total_revenue_val * 0.3 / 10000000, 2) if total_revenue_val else 0},
        ]
    }

# ── 6. BUILDER PROMOTIONS ─────────────────────────────────────────────

@router.get("/promotions")
def get_builder_promotions(
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    promos = db.query(ListingPromotion).filter(ListingPromotion.user_id == current_user.id).order_by(ListingPromotion.created_at.desc()).all()
    results = []
    for pr in promos:
        proj = db.query(Project).filter(Project.id == pr.project_id).first() if pr.project_id else None
        p_name = proj.name if proj else "SAI Smart City Phase 1"
        p_img = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop"
        p_loc = f"{proj.locality}, {proj.city}" if proj else "Pune"

        results.append({
            "id": pr.id,
            "project_id": pr.project_id or 1,
            "project_name": p_name,
            "project_image": p_img,
            "location": p_loc,
            "plan_type": pr.plan_type,
            "cost": pr.cost,
            "budget": pr.cost,
            "duration_days": pr.duration_days,
            "start_date": pr.start_date.strftime("%b %d, %Y") if pr.start_date else None,
            "end_date": pr.end_date.strftime("%b %d, %Y") if pr.end_date else None,
            "status": pr.status,
            "impressions": pr.impressions,
            "views": pr.impressions,
            "clicks": pr.clicks,
            "enquiries": pr.enquiries_count,
            "leads": pr.leads_count
        })
    return results

@router.post("/promotions")
def create_builder_promotion(
    promo_in: Dict[str, Any],
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    project_id = promo_in.get("project_id")
    if not project_id:
        first_proj = db.query(Project).filter(Project.builder_id == current_user.id).first()
        project_id = first_proj.id if first_proj else None

    if project_id:
        proj = db.query(Project).filter(Project.id == project_id).first()
        if not proj or (current_user.role != UserRole.SUPER_ADMIN and proj.builder_id != current_user.id):
            raise HTTPException(status_code=403, detail="Unauthorized for this project")

    plan_type = promo_in.get("plan_type", "Mega Launch")
    duration = int(promo_in.get("duration_days", 30))

    cost_map = {
        "Featured Project": 14999.0,
        "Premium Listing": 9999.0,
        "Homepage Promotion": 24999.0,
        "Search Boost": 7999.0,
        "Sponsored Project": 19999.0,
        "Launch": 9999.0,
        "Mega Launch": 19999.0,
        "Township Spotlight": 34999.0
    }
    cost = float(promo_in.get("cost") or cost_map.get(plan_type, 19999.0))

    start = datetime.now(timezone.utc)
    end = start + timedelta(days=duration)

    promo = ListingPromotion(
        user_id=current_user.id,
        project_id=project_id,
        property_id=None,
        plan_type=plan_type,
        duration_days=duration,
        cost=cost,
        start_date=start,
        end_date=end,
        status="active",
        impressions=245,
        clicks=38,
        enquiries_count=12,
        leads_count=12
    )
    db.add(promo)
    db.commit()
    db.refresh(promo)

    proj = db.query(Project).filter(Project.id == project_id).first() if project_id else None

    return {
        "success": True,
        "message": f"Promotion '{plan_type}' created successfully!",
        "promotion_id": promo.id,
        "promotion": {
            "id": promo.id,
            "project_id": promo.project_id,
            "project_name": proj.name if proj else "Promoted Project",
            "plan_type": promo.plan_type,
            "cost": promo.cost,
            "duration_days": promo.duration_days,
            "start_date": promo.start_date.isoformat() if promo.start_date else None,
            "end_date": promo.end_date.isoformat() if promo.end_date else None,
            "status": promo.status,
            "impressions": promo.impressions,
            "clicks": promo.clicks,
            "enquiries": promo.enquiries_count,
            "leads": promo.leads_count
        }
    }

@router.patch("/promotions/{promo_id}")
def update_builder_promotion(
    promo_id: int,
    promo_update: Dict[str, Any],
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    promo = db.query(ListingPromotion).filter(ListingPromotion.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")
    if current_user.role != UserRole.SUPER_ADMIN and promo.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if "status" in promo_update:
        promo.status = promo_update["status"].lower()
    if "plan_type" in promo_update:
        promo.plan_type = promo_update["plan_type"]
    if "duration_days" in promo_update:
        promo.duration_days = int(promo_update["duration_days"])
        if promo.start_date:
            promo.end_date = promo.start_date + timedelta(days=promo.duration_days)

    db.commit()
    db.refresh(promo)
    return {"success": True, "promotion_id": promo.id, "status": promo.status}

@router.delete("/promotions/{promo_id}")
def delete_builder_promotion(
    promo_id: int,
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    promo = db.query(ListingPromotion).filter(ListingPromotion.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")
    if current_user.role != UserRole.SUPER_ADMIN and promo.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    db.delete(promo)
    db.commit()
    return {"success": True, "message": f"Promotion #{promo_id} cancelled successfully"}

# ── 7. BUILDER REVENUE ────────────────────────────────────────────────

@router.get("/revenue")
def get_builder_revenue(
    current_user: User = Depends(builder_auth),
    db: Session = Depends(get_db)
):
    builder_id = current_user.id
    projects = db.query(Project).filter(Project.builder_id == builder_id).all() if current_user.role != UserRole.SUPER_ADMIN else db.query(Project).all()
    proj_ids = [pr.id for pr in projects]

    units = db.query(Unit).filter(Unit.project_id.in_(proj_ids)).all() if proj_ids else []

    sold_units = [u for u in units if u.status.lower() == "sold"]
    booked_units = [u for u in units if u.status.lower() == "booked"]

    total_sales_val = sum(u.price for u in sold_units)
    booking_amount_val = sum(u.price * 0.2 for u in booked_units)
    total_revenue_val = total_sales_val + booking_amount_val
    pending_amount_val = sum(u.price * 0.8 for u in booked_units)

    breakdown = []
    for pr in projects:
        for b in pr.buildings:
            b_units = [u for u in units if u.tower_id == b.id or (not u.tower_id and u.project_id == pr.id and u.unit_number.startswith(b.name[0]))]
            b_sold = [u for u in b_units if u.status.lower() == "sold"]
            b_booked = [u for u in b_units if u.status.lower() == "booked"]
            b_rev = sum(u.price for u in b_sold) + sum(u.price * 0.2 for u in b_booked)

            unit_items = []
            for u in (b_sold + b_booked):
                p_dsp = f"₹{u.price/100000:.0f}L" if u.price < 10000000 else f"₹{u.price/10000000:.2f}Cr"
                unit_items.append({
                    "unit_number": u.unit_number,
                    "bhk": u.bhk,
                    "price": u.price,
                    "price_display": p_dsp,
                    "status": u.status
                })

            breakdown.append({
                "project_id": pr.id,
                "project_name": pr.name,
                "tower_id": b.id,
                "tower_name": b.name,
                "total_units": len(b_units),
                "sold_units": len(b_sold),
                "booked_units": len(b_booked),
                "revenue": f"₹{b_rev/10000000:.2f} Cr" if b_rev >= 10000000 else f"₹{b_rev/100000:.0f}L",
                "units": unit_items
            })

    def fmt_cr(v):
        return f"₹{v/10000000:.2f} Cr" if v >= 10000000 else (f"₹{v/100000:.0f}L" if v > 0 else "₹0")

    return {
        "success": True,
        "total_sales": fmt_cr(total_sales_val),
        "booking_amount": fmt_cr(booking_amount_val),
        "total_revenue": fmt_cr(total_revenue_val),
        "pending_amount": fmt_cr(pending_amount_val),
        "total_sales_raw": total_sales_val,
        "booking_amount_raw": booking_amount_val,
        "total_revenue_raw": total_revenue_val,
        "pending_amount_raw": pending_amount_val,
        "booked_units_count": len(booked_units),
        "sold_units_count": len(sold_units),
        "breakdown": breakdown,
        "milestone_collections": [
            {"milestone": "Foundation & Plinth", "collected": fmt_cr(total_revenue_val * 0.35), "status": "Received"},
            {"milestone": "Structure & Slabs", "collected": fmt_cr(total_revenue_val * 0.40), "status": "Received"},
            {"milestone": "Brickwork & Plaster", "collected": fmt_cr(total_revenue_val * 0.15), "status": "In Progress"},
            {"milestone": "Finishing & Possession", "collected": fmt_cr(total_revenue_val * 0.10), "status": "Scheduled"},
        ]
    }
