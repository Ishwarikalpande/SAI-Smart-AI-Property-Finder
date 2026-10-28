import pytest
from app.models.user import UserRole
from tests.conftest import get_auth_headers

def test_property_crud_and_ownership_protection(client, test_users):
    seller1 = test_users[UserRole.SELLER]
    seller2 = test_users["seller2"]
    seller1_headers = get_auth_headers(seller1)
    seller2_headers = get_auth_headers(seller2)

    # 1. Seller 1 creates property
    prop_payload = {
        "title": "Seller 1 Apartment",
        "description": "Exclusive apartment in Baner",
        "property_type": "apartment",
        "listing_type": "buy",
        "bhk": 3,
        "area_sqft": 1500,
        "price": 9500000,
        "locality": "Baner",
        "city": "Pune",
        "amenities": ["Gym", "Pool", "Lift"]
    }
    create_res = client.post("/api/properties/", json=prop_payload, headers=seller1_headers)
    assert create_res.status_code == 201
    prop_id = create_res.json()["id"]

    # 2. Anyone can read property
    get_res = client.get(f"/api/properties/{prop_id}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Seller 1 Apartment"

    # 3. Seller 2 attempts to update Seller 1's property -> 403 Forbidden
    patch_payload = {"price": 8000000}
    tamper_res = client.patch(f"/api/properties/{prop_id}", json=patch_payload, headers=seller2_headers)
    assert tamper_res.status_code == 403
    assert "only manage properties that you own" in tamper_res.json()["detail"]

    # 4. Seller 2 attempts to delete Seller 1's property -> 403 Forbidden
    delete_tamper_res = client.delete(f"/api/properties/{prop_id}", headers=seller2_headers)
    assert delete_tamper_res.status_code == 403

    # 5. Seller 1 updates own property -> 200 OK
    valid_update_res = client.patch(f"/api/properties/{prop_id}", json=patch_payload, headers=seller1_headers)
    assert valid_update_res.status_code == 200
    assert valid_update_res.json()["price"] == 8000000

    # 6. Seller 1 deletes own property -> 204 No Content
    delete_res = client.delete(f"/api/properties/{prop_id}", headers=seller1_headers)
    assert delete_res.status_code == 204

    # 7. Check property is gone
    check_res = client.get(f"/api/properties/{prop_id}")
    assert check_res.status_code == 404
