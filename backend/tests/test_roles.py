import pytest
from app.models.user import UserRole
from tests.conftest import get_auth_headers

def test_buyer_cannot_create_property(client, test_users):
    buyer_headers = get_auth_headers(test_users[UserRole.BUYER])
    payload = {
        "title": "Unauthorized Listing",
        "property_type": "apartment",
        "listing_type": "buy",
        "bhk": 2,
        "area_sqft": 1000,
        "price": 5000000,
        "locality": "Baner",
        "city": "Pune"
    }
    res = client.post("/api/properties/", json=payload, headers=buyer_headers)
    assert res.status_code == 403

def test_buyer_cannot_access_agent_leads(client, test_users):
    buyer_headers = get_auth_headers(test_users[UserRole.BUYER])
    res = client.get("/api/leads/", headers=buyer_headers)
    assert res.status_code == 403

def test_buyer_cannot_access_super_admin(client, test_users):
    buyer_headers = get_auth_headers(test_users[UserRole.BUYER])
    res = client.get("/api/admin/stats", headers=buyer_headers)
    assert res.status_code == 403

def test_super_admin_can_access_admin_stats(client, test_users):
    admin_headers = get_auth_headers(test_users[UserRole.SUPER_ADMIN])
    res = client.get("/api/admin/stats", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_users" in data
