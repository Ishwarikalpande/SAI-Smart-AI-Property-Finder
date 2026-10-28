import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.property import Property
from app.services.property_3d_generator import generate_3d_tour_for_property
from app.services.property_3d_service import get_property_3d_tour

client = TestClient(app)

def test_3d_tour_1_bhk_structure():
    db = SessionLocal()
    try:
        # Find or use 1 BHK property
        prop = db.query(Property).filter(Property.bhk == 1, Property.status == "available").first()
        if not prop:
            prop = db.query(Property).first()
            prop.bhk = 1

        tour = generate_3d_tour_for_property(prop)
        assert tour["bhk"] == 1
        room_types = [r["type"] for r in tour["rooms"]]
        assert "entrance" in room_types
        assert "living_room" in room_types
        assert "kitchen" in room_types
        assert "bedroom" in room_types
        assert "bathroom" in room_types
        assert "balcony" in room_types
        # 1 BHK must not have bedroom_2 or bedroom_3
        room_ids = [r["id"] for r in tour["rooms"]]
        assert "bedroom_2" not in room_ids
        assert "bedroom_3" not in room_ids

        # Doors
        assert any(d["is_main_entrance"] for d in tour["doors"])
        assert any(d.get("is_balcony") for d in tour["doors"])

        # Camera steps
        step_labels = [s["label"] for s in tour["camera_path"]]
        assert "PROPERTY FRONT VIEW" in step_labels
        assert "ENTRANCE" in step_labels
        assert "LIVING ROOM" in step_labels
        assert "KITCHEN" in step_labels
        assert "MASTER BEDROOM" in step_labels
        assert "BALCONY VIEW" in step_labels
        assert "TOUR COMPLETE" in step_labels
    finally:
        db.close()

def test_3d_tour_2_bhk_structure():
    db = SessionLocal()
    try:
        prop = db.query(Property).filter(Property.bhk == 2, Property.status == "available").first()
        if not prop:
            prop = db.query(Property).first()
            prop.bhk = 2

        tour = generate_3d_tour_for_property(prop)
        assert tour["bhk"] == 2
        room_ids = [r["id"] for r in tour["rooms"]]
        assert "master_bedroom" in room_ids
        assert "bedroom_2" in room_ids
        assert "bathroom_1" in room_ids
        assert "bathroom_2" in room_ids
        assert "balcony" in room_ids
    finally:
        db.close()

def test_3d_tour_3_bhk_structure():
    db = SessionLocal()
    try:
        prop = db.query(Property).filter(Property.bhk == 3, Property.status == "available").first()
        if not prop:
            prop = db.query(Property).first()
            prop.bhk = 3

        tour = generate_3d_tour_for_property(prop)
        assert tour["bhk"] == 3
        room_ids = [r["id"] for r in tour["rooms"]]
        assert "dining" in room_ids
        assert "master_bedroom" in room_ids
        assert "bedroom_2" in room_ids
        assert "bedroom_3" in room_ids
        assert "balcony" in room_ids
    finally:
        db.close()

def test_3d_tour_4_bhk_structure():
    db = SessionLocal()
    try:
        prop = db.query(Property).filter(Property.bhk == 4, Property.status == "available").first()
        if not prop:
            prop = db.query(Property).first()
            prop.bhk = 4

        tour = generate_3d_tour_for_property(prop)
        assert tour["bhk"] == 4
        room_ids = [r["id"] for r in tour["rooms"]]
        assert "dining" in room_ids
        assert "master_bedroom" in room_ids
        assert "bedroom_2" in room_ids
        assert "bedroom_3" in room_ids
        assert "bedroom_4" in room_ids
        assert "balcony" in room_ids
    finally:
        db.close()

def test_3d_tour_api_endpoint():
    db = SessionLocal()
    try:
        prop = db.query(Property).filter(Property.status == "available").first()
        assert prop is not None
        res = client.get(f"/api/properties/{prop.id}/3d-tour")
        assert res.status_code == 200
        data = res.json()
        assert data["property_id"] == prop.id
        assert "rooms" in data
        assert "camera_path" in data
        assert "building" in data
        assert "doors" in data
        assert len(data["rooms"]) > 0
        assert len(data["camera_path"]) > 0
    finally:
        db.close()

def test_3d_tour_custom_config_save():
    db = SessionLocal()
    try:
        prop = db.query(Property).filter(Property.status == "available").first()
        assert prop is not None

        custom_payload = {
            "bhk": 2,
            "rooms": [
                {
                    "id": "custom_living",
                    "name": "Custom Living Lounge",
                    "type": "living_room",
                    "order": 1,
                    "position": {"x": 0, "y": 0, "z": 0},
                    "dimensions": {"width": 6.5, "length": 5.0, "height": 2.85}
                }
            ]
        }

        res = client.post(f"/api/properties/{prop.id}/3d-tour", json=custom_payload)
        assert res.status_code == 200
        data = res.json()
        assert data["property_id"] == prop.id
    finally:
        db.close()
