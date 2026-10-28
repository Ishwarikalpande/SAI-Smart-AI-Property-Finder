import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.project import Project, Building, Floor, Unit, UnitBooking, BookingAuditLog
from app.models.user import User, UserRole

client = TestClient(app)

def test_get_building_3d_data():
    # Fetch ABC Residency and Tower A
    db = SessionLocal()
    project = db.query(Project).filter(Project.name == "ABC Residency").first()
    assert project is not None, "ABC Residency must exist"
    tower_a = db.query(Building).filter(Building.project_id == project.id, Building.name == "Tower A").first()
    db.close()
    assert tower_a is not None, "Tower A of ABC Residency should be seeded in the database"

    response = client.get(f"/api/buildings/{tower_a.id}/3d-data")
    assert response.status_code == 200
    data = response.json()
    assert data["building"]["name"] == "Tower A"
    assert data["building"]["floors_count"] == 20
    assert len(data["floors"]) == 20
    assert data["inventory_summary"]["total_units"] >= 160
    assert len(data["status_legend"]) == 5

    # Check Floor 20 specifically
    floor_20 = next((f for f in data["floors"] if f["floor_number"] == 20), None)
    assert floor_20 is not None
    assert len(floor_20["units"]) == 8

    # Check Flat 20-C
    flat_20c = next((u for u in floor_20["units"] if u["unit_number"] == "C"), None)
    assert flat_20c is not None
    assert flat_20c["bhk"] == 3
    assert flat_20c["direction"] == "East"
    assert flat_20c["balcony_direction"] == "East"
    assert flat_20c["status"] == "available"
    assert flat_20c["status_color"] == "#10B981" # Green
    assert flat_20c["position"]["y"] == (20 - 1) * 3.2

def test_unit_walkthrough_3d_and_bhk_structures():
    db = SessionLocal()
    flat_20c = db.query(Unit).filter(Unit.floor_number == 20, Unit.unit_number == "C").first()
    flat_10b = db.query(Unit).filter(Unit.floor_number == 10, Unit.unit_number == "B").first()
    flat_1h = db.query(Unit).filter(Unit.floor_number == 1, Unit.unit_number == "H").first()
    flat_20e = db.query(Unit).filter(Unit.floor_number == 20, Unit.unit_number == "E").first()
    db.close()

    assert flat_20c is not None
    assert flat_10b is not None

    # Test 3 BHK (Flat 20-C)
    res_3bhk = client.get(f"/api/units/{flat_20c.id}/3d-tour")
    assert res_3bhk.status_code == 200
    tour_3bhk = res_3bhk.json()
    assert tour_3bhk["bhk"] == 3
    assert tour_3bhk["unit_info"]["unit_label"] == "Flat 20-C"
    assert tour_3bhk["unit_info"]["floor_number"] == 20
    assert tour_3bhk["unit_info"]["direction"] == "East"
    assert tour_3bhk["exterior"]["balcony_facing"] == "East"
    # Verify entrance door animation exists
    actions = [step.get("action") for step in tour_3bhk["camera_path"]]
    assert "door_open" in actions, "Camera path must include entrance door opening animation"
    assert "exterior_view" in actions, "Camera path must include balcony exterior view"

    # Test 2 BHK (Flat 10-B)
    res_2bhk = client.get(f"/api/units/{flat_10b.id}/3d-tour")
    assert res_2bhk.status_code == 200
    tour_2bhk = res_2bhk.json()
    assert tour_2bhk["bhk"] == 2
    assert tour_2bhk["unit_info"]["direction"] == "West"
    assert tour_2bhk["unit_info"]["floor_number"] == 10
    # The room count / bedroom count differs between 2 BHK and 3 BHK
    assert len(tour_3bhk["rooms"]) > len(tour_2bhk["rooms"])

def test_tower_separation_no_mismatch():
    db = SessionLocal()
    project = db.query(Project).filter(Project.name == "ABC Residency").first()
    assert project is not None
    tower_a = db.query(Building).filter(Building.project_id == project.id, Building.name == "Tower A").first()
    tower_b = db.query(Building).filter(Building.project_id == project.id, Building.name == "Tower B").first()
    db.close()

    res_a = client.get(f"/api/buildings/{tower_a.id}/3d-data")
    res_b = client.get(f"/api/buildings/{tower_b.id}/3d-data")

    assert res_a.status_code == 200
    assert res_b.status_code == 200

    data_a = res_a.json()
    data_b = res_b.json()

    assert data_a["building"]["name"] == "Tower A"
    assert data_b["building"]["name"] == "Tower B"
    assert data_a["building"]["floors_count"] == 20
    assert data_b["building"]["floors_count"] == 15

    # Check that tower units don't mix
    units_a_ids = {u["id"] for fl in data_a["floors"] for u in fl["units"]}
    units_b_ids = {u["id"] for fl in data_b["floors"] for u in fl["units"]}
    assert units_a_ids.isdisjoint(units_b_ids)

def test_smart_find_flats():
    response = client.get("/api/units/find?city=Amravati&bhk=3&direction=East&floor=20")
    assert response.status_code == 200
    results = response.json()
    assert len(results) >= 1
    unit = results[0]
    assert unit["unit_label"] == "Flat 20-C"
    assert unit["bhk"] == 3
    assert unit["floor_number"] == 20
    assert unit["direction"] == "East"

def test_atomic_booking_and_race_condition():
    db = SessionLocal()
    # Find an available unit on floor 15 (e.g. 15-C)
    unit = db.query(Unit).filter(Unit.floor_number == 15, Unit.unit_number == "C").first()
    unit.status = "available"
    db.commit()
    target_id = unit.id
    db.close()

    # First booking attempt - must succeed
    payload = {
        "unit_id": target_id,
        "buyer_name": "Rohan Sharma",
        "buyer_email": "rohan@example.com",
        "buyer_phone": "+91 99887 66554",
        "booking_amount": 50000.0
    }
    res1 = client.post(f"/api/units/{target_id}/book", json=payload)
    assert res1.status_code == 200
    res1_data = res1.json()
    assert res1_data["success"] is True
    assert res1_data["booking"]["status"] == "booked"

    # Second booking attempt for the same unit - MUST FAIL WITH 409 CONFLICT!
    res2 = client.post(f"/api/units/{target_id}/book", json=payload)
    assert res2.status_code == 409
    assert "was just booked" in res2.json()["detail"] or "already" in res2.json()["detail"]

    # Verify audit log was recorded
    db = SessionLocal()
    audit = db.query(BookingAuditLog).filter(BookingAuditLog.unit_id == target_id).first()
    assert audit is not None
    assert audit.new_status == "booked"
    db.close()
