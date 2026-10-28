import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.property import Property
from app.models.property_media import PropertyMedia
from app.models.user import User, UserRole

client = TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    max_id = db.query(Property.id).order_by(Property.id.desc()).first()
    max_existing_id = max_id[0] if max_id else 0
    yield db
    try:
        created = db.query(Property).filter(Property.id > max_existing_id).all()
        created_ids = [p.id for p in created]
        if created_ids:
            db.query(PropertyMedia).filter(PropertyMedia.property_id.in_(created_ids)).delete(synchronize_session=False)
            db.query(Property).filter(Property.id.in_(created_ids)).delete(synchronize_session=False)
            db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()

def test_01_property_with_complete_data(db_session):
    """Scenario 1: Property with complete data."""
    # Property 1 is Prestige Heights with complete amenities, description, etc.
    res = client.get("/api/properties/1/walkthrough")
    assert res.status_code == 200
    data = res.json()
    assert data["property_id"] == 1
    assert "title" in data
    assert data["duration"] > 0
    scene_ids = [s["id"] for s in data["scenes"]]
    assert "exterior" in scene_ids
    assert "location" in scene_ids
    assert "summary" in scene_ids
    assert len(data["scenes"]) >= 4

def test_02_property_with_no_images(db_session):
    """Scenario 2: Property with no images returns clean architectural fallback."""
    test_prop = Property(
        title="No Image Test Villa",
        description="Beautiful villa without photos yet",
        property_type="villa",
        listing_type="buy",
        bhk=3,
        area_sqft=1800.0,
        price=12000000.0,
        locality="Camp",
        city="Amravati",
        amenities=["Garden", "Security"],
        status="available"
    )
    db_session.add(test_prop)
    db_session.commit()
    db_session.refresh(test_prop)

    res = client.get(f"/api/properties/{test_prop.id}/walkthrough")
    assert res.status_code == 200
    data = res.json()
    assert data["property_id"] == test_prop.id
    # Exterior scene image_url must be None so frontend renders SVG placeholder
    exterior_scene = next(s for s in data["scenes"] if s["id"] == "exterior")
    assert exterior_scene["image_url"] is None

def test_03_property_with_only_one_image(db_session):
    """Scenario 3: Property with exactly one image."""
    test_prop = Property(
        title="Single Image Studio",
        description="Compact studio apartment",
        property_type="apartment",
        listing_type="rent",
        bhk=1,
        area_sqft=450.0,
        price=15000.0,
        locality="Shivaji Nagar",
        city="Pune",
        amenities=[],
        status="available"
    )
    db_session.add(test_prop)
    db_session.commit()
    db_session.refresh(test_prop)

    single_media = PropertyMedia(
        property_id=test_prop.id,
        url="https://example.com/single-facade.jpg",
        media_type="image",
        media_category="exterior",
        sort_order=0
    )
    db_session.add(single_media)
    db_session.commit()

    res = client.get(f"/api/properties/{test_prop.id}/walkthrough")
    assert res.status_code == 200
    data = res.json()
    exterior_scene = next(s for s in data["scenes"] if s["id"] == "exterior")
    assert exterior_scene["image_url"] == "https://example.com/single-facade.jpg"

def test_04_property_with_1_bhk(db_session):
    """Scenario 4: Property with 1 BHK."""
    test_prop = Property(
        title="1BHK Cozy Flat",
        description="Convenient 1BHK unit",
        property_type="apartment",
        listing_type="buy",
        bhk=1,
        area_sqft=580.0,
        price=3500000.0,
        locality="Rajarampuri",
        city="Kolhapur",
        amenities=["Lift"],
        status="available"
    )
    db_session.add(test_prop)
    db_session.commit()
    db_session.refresh(test_prop)

    res = client.get(f"/api/properties/{test_prop.id}/walkthrough")
    assert res.status_code == 200
    data = res.json()
    bed_scene = next(s for s in data["scenes"] if s["id"] == "bedroom")
    assert bed_scene["data"]["count"] == 1

def test_05_property_with_2_bhk(db_session):
    """Scenario 5: Property with 2 BHK."""
    test_prop = Property(
        title="2BHK Prime Home",
        description="Spacious 2BHK flat",
        property_type="apartment",
        listing_type="buy",
        bhk=2,
        area_sqft=980.0,
        price=5500000.0,
        locality="Kothrud",
        city="Pune",
        amenities=["Parking", "Gym"],
        status="available"
    )
    db_session.add(test_prop)
    db_session.commit()
    db_session.refresh(test_prop)

    res = client.get(f"/api/properties/{test_prop.id}/walkthrough")
    assert res.status_code == 200
    data = res.json()
    bed_scene = next(s for s in data["scenes"] if s["id"] == "bedroom")
    assert bed_scene["data"]["count"] == 2

def test_06_property_with_3_bhk(db_session):
    """Scenario 6: Property with 3 BHK."""
    test_prop = Property(
        title="3BHK Luxury Residence",
        description="Grand 3BHK flat",
        property_type="apartment",
        listing_type="buy",
        bhk=3,
        area_sqft=1450.0,
        price=9500000.0,
        locality="Viman Nagar",
        city="Pune",
        amenities=["Pool", "Clubhouse"],
        status="available"
    )
    db_session.add(test_prop)
    db_session.commit()
    db_session.refresh(test_prop)

    res = client.get(f"/api/properties/{test_prop.id}/walkthrough")
    assert res.status_code == 200
    data = res.json()
    bed_scene = next(s for s in data["scenes"] if s["id"] == "bedroom")
    assert bed_scene["data"]["count"] == 3

def test_07_property_without_balcony(db_session):
    """Scenario 7: Property without balcony must NOT invent a balcony scene."""
    test_prop = Property(
        title="Compact City Studio (No Balcony)",
        description="Ground floor compact unit with direct street access",
        property_type="studio",
        listing_type="rent",
        bhk=1,
        area_sqft=400.0,
        price=18000.0,
        locality="Shivaji Nagar",
        city="Pune",
        amenities=["Lift", "Security"],
        status="available"
    )
    db_session.add(test_prop)
    db_session.commit()
    db_session.refresh(test_prop)

    res = client.get(f"/api/properties/{test_prop.id}/walkthrough")
    assert res.status_code == 200
    data = res.json()
    scene_ids = [s["id"] for s in data["scenes"]]
    assert "balcony" not in scene_ids

def test_08_property_without_parking(db_session):
    """Scenario 8: Property without parking does not hallucinate parking."""
    test_prop = Property(
        title="Downtown Walk-Up (No Parking)",
        description="Centrally located walk-up apartment near pedestrian market",
        property_type="apartment",
        listing_type="rent",
        bhk=1,
        area_sqft=500.0,
        price=20000.0,
        locality="Budhwar Peth",
        city="Pune",
        amenities=["Security"],
        status="available"
    )
    db_session.add(test_prop)
    db_session.commit()
    db_session.refresh(test_prop)

    res = client.get(f"/api/properties/{test_prop.id}/walkthrough")
    assert res.status_code == 200
    data = res.json()
    amenity_scene = next((s for s in data["scenes"] if s["id"] == "amenities"), None)
    if amenity_scene:
        assert amenity_scene["data"]["has_parking"] is False

def test_09_property_without_amenities(db_session):
    """Scenario 9: Property without amenities dynamically omits amenities scene."""
    test_prop = Property(
        title="Basic Independent Floor",
        description="Independent floor unit without shared society amenities",
        property_type="apartment",
        listing_type="buy",
        bhk=2,
        area_sqft=850.0,
        price=4200000.0,
        locality="Gadge Nagar",
        city="Amravati",
        amenities=[],
        status="available"
    )
    db_session.add(test_prop)
    db_session.commit()
    db_session.refresh(test_prop)

    res = client.get(f"/api/properties/{test_prop.id}/walkthrough")
    assert res.status_code == 200
    data = res.json()
    scene_ids = [s["id"] for s in data["scenes"]]
    assert "amenities" not in scene_ids

def test_10_property_with_multiple_images(db_session):
    """Scenario 10: Property with multiple images maps categories or generic highlights."""
    test_prop = Property(
        title="Multi-Photo Penthouse",
        description="Top floor penthouse with panoramic terrace",
        property_type="penthouse",
        listing_type="buy",
        bhk=4,
        area_sqft=3200.0,
        price=28000000.0,
        locality="Kalyani Nagar",
        city="Pune",
        amenities=["Pool", "Gym", "Parking"],
        status="available"
    )
    db_session.add(test_prop)
    db_session.commit()
    db_session.refresh(test_prop)

    images = [
        ("https://example.com/exterior.jpg", "exterior"),
        ("https://example.com/living.jpg", "living_room"),
        ("https://example.com/bed.jpg", "bedroom"),
        ("https://example.com/unclassified1.jpg", "other"),
    ]
    for idx, (url, cat) in enumerate(images):
        db_session.add(PropertyMedia(
            property_id=test_prop.id,
            url=url,
            media_type="image",
            media_category=cat,
            sort_order=idx
        ))
    db_session.commit()

    res = client.get(f"/api/properties/{test_prop.id}/walkthrough")
    assert res.status_code == 200
    data = res.json()
    scene_ids = [s["id"] for s in data["scenes"]]
    assert "exterior" in scene_ids
    assert "living_room" in scene_ids
    assert "bedroom" in scene_ids
    assert any("highlights" in sid for sid in scene_ids)

def test_11_unauthorized_user_on_inactive_property(db_session):
    """Scenario 11: Unauthorized user cannot preview inactive/sold property walkthrough."""
    test_prop = Property(
        title="Private Inactive Listing",
        description="Draft property not yet published",
        property_type="apartment",
        listing_type="buy",
        bhk=2,
        area_sqft=900.0,
        price=5000000.0,
        locality="Aundh",
        city="Pune",
        amenities=[],
        status="inactive"
    )
    db_session.add(test_prop)
    db_session.commit()
    db_session.refresh(test_prop)

    # Request without auth token
    res = client.get(f"/api/properties/{test_prop.id}/walkthrough")
    assert res.status_code == 403

def test_12_non_existing_property():
    """Scenario 12: Non-existing property ID returns 404."""
    res = client.get("/api/properties/9999999/walkthrough")
    assert res.status_code == 404
