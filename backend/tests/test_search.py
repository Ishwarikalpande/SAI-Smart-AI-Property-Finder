import pytest
from app.models.user import UserRole
from tests.conftest import get_auth_headers

@pytest.fixture(autouse=True)
def seed_search_data(client, test_users):
    seller_headers = get_auth_headers(test_users[UserRole.SELLER])
    props = [
        {"title": "Search Prop 1", "property_type": "apartment", "listing_type": "buy", "bhk": 2, "area_sqft": 1000, "price": 4500000, "locality": "Baner", "city": "Pune"},
        {"title": "Search Prop 2", "property_type": "villa", "listing_type": "buy", "bhk": 3, "area_sqft": 2000, "price": 9500000, "locality": "Wakad", "city": "Pune"},
        {"title": "Search Prop 3", "property_type": "apartment", "listing_type": "rent", "bhk": 1, "area_sqft": 600, "price": 20000, "locality": "Bandra", "city": "Mumbai"},
    ]
    for p in props:
        client.post("/api/properties/", json=p, headers=seller_headers)

def test_search_by_city(client):
    res = client.get("/api/search/?city=Pune")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 2
    for item in data["items"]:
        assert "Pune" in item["city"]

def test_search_by_bhk(client):
    res = client.get("/api/search/?bhk=2")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    for item in data["items"]:
        assert item["bhk"] == 2

def test_search_by_price_range(client):
    res = client.get("/api/search/?max_price=5000000")
    assert res.status_code == 200
    data = res.json()
    for item in data["items"]:
        assert item["price"] <= 5000000

def test_favorites_flow(client, test_users):
    buyer_headers = get_auth_headers(test_users[UserRole.BUYER])
    # Get a property
    props_res = client.get("/api/properties/")
    prop_id = props_res.json()["items"][0]["id"]

    # Add to favorites
    add_res = client.post(f"/api/favorites/{prop_id}", headers=buyer_headers)
    assert add_res.status_code == 201

    # List favorites
    list_res = client.get("/api/favorites/", headers=buyer_headers)
    assert list_res.status_code == 200
    fav_ids = [p["id"] for p in list_res.json()]
    assert prop_id in fav_ids

    # Remove from favorites
    del_res = client.delete(f"/api/favorites/{prop_id}", headers=buyer_headers)
    assert del_res.status_code == 204

def test_enquiry_flow(client, test_users):
    buyer_headers = get_auth_headers(test_users[UserRole.BUYER])
    seller_headers = get_auth_headers(test_users[UserRole.SELLER])

    props_res = client.get("/api/properties/")
    prop_id = props_res.json()["items"][0]["id"]

    # Buyer sends enquiry
    enq_res = client.post("/api/enquiries/", json={"property_id": prop_id, "message": "Interested in viewing this weekend"}, headers=buyer_headers)
    assert enq_res.status_code == 201
    enq_id = enq_res.json()["id"]

    # Seller views enquiry
    seller_enq_res = client.get("/api/enquiries/", headers=seller_headers)
    assert seller_enq_res.status_code == 200
    assert any(e["id"] == enq_id for e in seller_enq_res.json())

    # Seller updates status
    status_res = client.patch(f"/api/enquiries/{enq_id}/status", json={"status": "CONTACTED"}, headers=seller_headers)
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "CONTACTED"
