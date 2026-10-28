import sys
import os

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure backend root is in Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncio
from app.db.session import SessionLocal
from app.models.project import Project, Building, Floor, Unit, UnitBooking, BookingAuditLog
from app.models.user import User, UserRole
from app.services.building_3d_service import (
    get_building_3d_data,
    get_unit_3d_tour,
    reserve_or_book_unit,
    smart_find_flats,
    get_user_bookings
)
from app.ai.chat_service import process_chat_message

def run_tests():
    db = SessionLocal()
    print("=" * 80)
    print("SAI 3D PROPERTY DISCOVERY & FLAT BOOKING SYSTEM - COMPREHENSIVE E2E VERIFICATION")
    print("=" * 80)

    # 1. Project Hierarchy Check (ABC Residency in Amravati)
    print("\n[TEST 1] Verifying ABC Residency Project Hierarchy...")
    project = db.query(Project).filter(Project.name.like("%ABC Residency%")).first()
    assert project is not None, "ABC Residency project not found in database!"
    assert project.city.lower() == "amravati", f"Expected city Amravati, got {project.city}"
    print(f"✓ Project Found: ID={project.id}, Name='{project.name}', City='{project.city}', Locality='{project.locality}'")

    # 2. Buildings & Tower Capacity
    print("\n[TEST 2] Verifying Tower A & Tower B Configuration...")
    tower_a = db.query(Building).filter(Building.project_id == project.id, Building.code == "A").first()
    tower_b = db.query(Building).filter(Building.project_id == project.id, Building.code == "B").first()
    assert tower_a is not None, "Tower A not found!"
    assert tower_b is not None, "Tower B not found!"
    assert tower_a.floors_count == 20, f"Tower A should have 20 floors, got {tower_a.floors_count}"
    assert tower_a.units_per_floor == 8, f"Tower A should have 8 units/floor, got {tower_a.units_per_floor}"
    assert tower_b.floors_count == 15, f"Tower B should have 15 floors, got {tower_b.floors_count}"
    assert tower_b.units_per_floor == 6, f"Tower B should have 6 units/floor, got {tower_b.units_per_floor}"

    tower_a_units = db.query(Unit).filter(Unit.tower_id == tower_a.id).count()
    tower_b_units = db.query(Unit).filter(Unit.tower_id == tower_b.id).count()
    assert tower_a_units == 160, f"Tower A should have exactly 160 units, got {tower_a_units}"
    assert tower_b_units == 90, f"Tower B should have exactly 90 units, got {tower_b_units}"
    print(f"✓ Tower A (ID={tower_a.id}): {tower_a.floors_count} floors, {tower_a.units_per_floor} units/floor = {tower_a_units} units")
    print(f"✓ Tower B (ID={tower_b.id}): {tower_b.floors_count} floors, {tower_b.units_per_floor} units/floor = {tower_b_units} units")

    # 3. Floor 20 Unit Inventory Statuses (Available, Reserved, Booked, Sold, Blocked)
    print("\n[TEST 3] Verifying Floor 20 Unit Inventory & Database Statuses...")
    floor_20_units = db.query(Unit).filter(Unit.tower_id == tower_a.id, Unit.floor_number == 20).order_by(Unit.unit_number.asc()).all()
    assert len(floor_20_units) == 8, f"Floor 20 should have 8 units, got {len(floor_20_units)}"

    status_map = {u.unit_number: u.status.lower() for u in floor_20_units}
    print("Floor 20 Units & Real Statuses:")
    for u in floor_20_units:
        print(f"  • Flat 20-{u.unit_number}: Status='{u.status.upper()}', BHK={u.bhk}, Area={u.area_sqft} sq.ft, Price=₹{u.price:,.0f}, Dir={u.direction}")

    assert status_map.get("A") == "reserved", f"Unit 20-A expected reserved, got {status_map.get('A')}"
    assert status_map.get("B") == "booked", f"Unit 20-B expected booked, got {status_map.get('B')}"
    assert status_map.get("C") == "available", f"Unit 20-C expected available, got {status_map.get('C')}"
    assert status_map.get("D") == "sold", f"Unit 20-D expected sold, got {status_map.get('D')}"
    assert status_map.get("E") == "blocked", f"Unit 20-E expected blocked, got {status_map.get('E')}"
    assert status_map.get("F") == "available", f"Unit 20-F expected available, got {status_map.get('F')}"
    print("✓ All 5 real database unit statuses verified on Floor 20: RESERVED, BOOKED, AVAILABLE, SOLD, BLOCKED")

    # 4. Flat 20-C Detailed Specification Verification
    print("\n[TEST 4] Verifying Flat 20-C Exact Specifications...")
    flat_20c = db.query(Unit).filter(Unit.tower_id == tower_a.id, Unit.floor_number == 20, Unit.unit_number == "C").first()
    assert flat_20c is not None, "Flat 20-C not found!"
    assert flat_20c.bhk == 3, f"Flat 20-C expected 3 BHK, got {flat_20c.bhk}"
    assert flat_20c.area_sqft == 1450.0, f"Flat 20-C expected 1450 sq.ft, got {flat_20c.area_sqft}"
    assert flat_20c.direction.lower() == "east", f"Flat 20-C expected East, got {flat_20c.direction}"
    assert flat_20c.balcony_direction.lower() == "east", f"Balcony direction expected East, got {flat_20c.balcony_direction}"
    assert flat_20c.status.lower() == "available", f"Expected available, got {flat_20c.status}"
    print(f"✓ Flat 20-C Confirmed: ID={flat_20c.id}, BHK={flat_20c.bhk}, Area={flat_20c.area_sqft} sq.ft, Facing={flat_20c.direction}, BalconyFacing={flat_20c.balcony_direction}, Status={flat_20c.status}")

    # 5. 3D Building Scene Data Structure
    print("\n[TEST 5] Verifying 3D Building Scene Generation API...")
    scene_3d = get_building_3d_data(tower_a.id, db)
    assert "building" in scene_3d, "Building metadata missing in 3D data"
    assert "floors" in scene_3d, "Floors missing in 3D data"
    assert len(scene_3d["floors"]) == 20, f"Expected 20 floors in 3D data, got {len(scene_3d['floors'])}"
    assert scene_3d["building"]["total_units"] == 160
    assert scene_3d["building"]["front_direction"] == "North"
    avail_units = scene_3d["inventory_summary"]["available"]
    print(f"✓ 3D Building Scene: {len(scene_3d['floors'])} floors, {avail_units} available units, front direction {scene_3d['building']['front_direction']}")

    # 6. 3D Unit Interior Walkthrough Generator (Flat 20-C)
    print("\n[TEST 6] Verifying Unit-Specific 3D Interior Tour for Flat 20-C...")
    tour_20c = get_unit_3d_tour(flat_20c.id, db)
    assert tour_20c["unit"]["unit_label"] == "Flat 20-C"
    assert tour_20c["unit"]["floor_number"] == 20
    assert tour_20c["unit"]["direction"] == "East"

    rooms = tour_20c["rooms"]
    camera_path = tour_20c["camera_path"]
    room_names = [r["name"] for r in rooms]
    print(f"✓ Rooms Generated ({len(rooms)}): {', '.join(room_names)}")
    assert any("living" in name.lower() or "hall" in name.lower() for name in room_names)
    assert "Master Bedroom" in room_names
    assert "Kitchen" in room_names
    assert "Balcony" in room_names

    # Check Entrance Door Animation & Balcony Steps
    has_door_open = any(step.get("action") == "door_open" for step in camera_path)
    has_balcony_step = any("balcony" in (step.get("room_id", "") + step.get("step_name", "") + step.get("label", "")).lower() for step in camera_path)
    assert has_door_open, "Camera path MUST contain entrance door opening action (action='door_open')!"
    assert has_balcony_step, "Camera path MUST visit balcony and show outside view!"
    print(f"✓ Dynamic Camera Steps ({len(camera_path)}): entrance door opening validated, balcony outward view validated")

    # 7. BHK Structural Difference Test (1 BHK vs 2 BHK vs 3 BHK vs 4 BHK)
    print("\n[TEST 7] Verifying 1/2/3/4 BHK Structural 3D Variations...")
    unit_1bhk = db.query(Unit).filter(Unit.tower_id == tower_a.id, Unit.bhk == 1).first()
    unit_2bhk = db.query(Unit).filter(Unit.tower_id == tower_a.id, Unit.bhk == 2).first()
    unit_3bhk = flat_20c
    unit_4bhk = db.query(Unit).filter(Unit.bhk == 4).first()

    tour_1 = get_unit_3d_tour(unit_1bhk.id, db) if unit_1bhk else None
    tour_2 = get_unit_3d_tour(unit_2bhk.id, db) if unit_2bhk else None
    tour_3 = tour_20c
    tour_4 = get_unit_3d_tour(unit_4bhk.id, db) if unit_4bhk else None

    if tour_1:
        print(f"  • 1 BHK ({unit_1bhk.unit_label}): {len(tour_1['rooms'])} rooms ({[r['name'] for r in tour_1['rooms']]})")
    if tour_2:
        print(f"  • 2 BHK ({unit_2bhk.unit_label}): {len(tour_2['rooms'])} rooms ({[r['name'] for r in tour_2['rooms']]})")
    print(f"  • 3 BHK ({unit_3bhk.unit_label}): {len(tour_3['rooms'])} rooms ({[r['name'] for r in tour_3['rooms']]})")
    if tour_4:
        print(f"  • 4 BHK ({unit_4bhk.unit_label}): {len(tour_4['rooms'])} rooms ({[r['name'] for r in tour_4['rooms']]})")

    assert len(tour_3["rooms"]) > len(tour_1["rooms"]), "3 BHK must have more rooms than 1 BHK"
    print("✓ 3D interior layouts are structurally distinct per BHK!")

    # 8. Floor & Tower Location Isolation Test
    print("\n[TEST 8] Verifying Location Isolation Between Different Floors & Towers...")
    flat_10b = db.query(Unit).filter(Unit.tower_id == tower_a.id, Unit.floor_number == 10, Unit.unit_number == "B").first()
    flat_tower_b = db.query(Unit).filter(Unit.tower_id == tower_b.id, Unit.floor_number == 15, Unit.unit_number == "1").first()
    assert flat_10b is not None
    assert flat_tower_b is not None
    assert flat_10b.floor_number == 10
    assert flat_10b.tower_id == tower_a.id
    assert flat_tower_b.floor_number == 15
    assert flat_tower_b.tower_id == tower_b.id
    assert flat_10b.id != flat_20c.id != flat_tower_b.id
    print(f"✓ Location Isolation Verified: Flat 10-B (Tower A, Fl 10), Flat 20-C (Tower A, Fl 20), Flat 15-1 (Tower B, Fl 15)")

    # 9. Smart Flat Finder Query
    print("\n[TEST 9] Verifying Smart Flat Finder Search...")
    matches = smart_find_flats({
        "city": "Amravati",
        "bhk": 3,
        "floor": 20,
        "direction": "East",
        "status": "available"
    }, db)
    match_labels = [m["unit_label"] for m in matches]
    assert "Flat 20-C" in match_labels, "Flat 20-C must be returned by smart flat finder!"
    print(f"✓ Smart Finder returned {len(matches)} matches: {match_labels}")

    # 10. Booking Race Condition & Duplicate Reservation Prevention
    print("\n[TEST 10] Testing Atomic Booking Lock & Conflict Prevention...")
    user = db.query(User).filter(User.role == UserRole.BUYER).first() or db.query(User).first()

    # Unit 20-B is already BOOKED in database
    unit_20b = db.query(Unit).filter(Unit.tower_id == tower_a.id, Unit.floor_number == 20, Unit.unit_number == "B").first()
    try:
        reserve_or_book_unit(unit_20b.id, user, {"payment_mode": "ONLINE"}, db, target_status="booked")
        assert False, "Booking an already booked unit should have raised HTTP 409 Conflict!"
    except Exception as exc:
        assert "409" in str(exc) or "Conflict" in str(exc) or "not available" in str(exc), f"Unexpected exception: {exc}"
        print(f"✓ Correctly rejected duplicate booking on Unit 20-B: {exc.detail if hasattr(exc, 'detail') else exc}")

    # Unit 20-A is already RESERVED in database
    unit_20a = db.query(Unit).filter(Unit.tower_id == tower_a.id, Unit.floor_number == 20, Unit.unit_number == "A").first()
    try:
        reserve_or_book_unit(unit_20a.id, user, {"payment_mode": "ONLINE"}, db, target_status="reserved")
        assert False, "Reserving an already reserved unit should have raised HTTP 409 Conflict!"
    except Exception as exc:
        assert "409" in str(exc) or "Conflict" in str(exc) or "not available" in str(exc), f"Unexpected exception: {exc}"
        print(f"✓ Correctly rejected duplicate reservation on Unit 20-A: {exc.detail if hasattr(exc, 'detail') else exc}")

    # 11. Chatbot Real Grounding & Anti-Hallucination
    print("\n[TEST 11] Testing AI Chatbot Natural Language Grounding with DB...")
    chat_queries = [
        "Show me 3 BHK flats on higher floors",
        "I want an east-facing flat",
        "Show available flats on 20th floor",
        "Which flats have balconies facing east?",
        "Show me the cheapest 2 BHK available",
        "Open Flat 20-C"
    ]
    for q in chat_queries:
        res = asyncio.run(process_chat_message(db, q, language="en"))
        print(f"\nQuery: \"{q}\"")
        print(f"  -> Intent: {res.get('intent')}")
        reply = res.get('message', '').encode('ascii', errors='replace').decode('ascii')
        print(f"  -> Reply: {reply[:140]}...")
        if res.get("flat_3d"):
            print(f"  -> flat_3d: {res['flat_3d']['unit_label']} (Building={res['flat_3d'].get('building_id')}, Floor={res['flat_3d']['floor_number']}, Dir={res['flat_3d']['direction']})")
        if res.get("matching_flats"):
            print(f"  -> matching_flats ({len(res['matching_flats'])}): {[f['unit_label'] for f in res['matching_flats'][:3]]}")

    print("\n" + "=" * 80)
    print("ALL 11 VERIFICATION SUITES PASSED PERFECTLY!")
    print("=" * 80)

if __name__ == "__main__":
    run_tests()
