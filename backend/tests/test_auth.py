import pytest
from app.models.user import User, UserRole

def test_register_user(client):
    payload = {
        "name": "New User",
        "email": "newuser@test.com",
        "password": "Password123!",
        "role": "buyer"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@test.com"
    assert data["role"] == "buyer"
    assert "password_hash" not in data

def test_duplicate_registration_rejected(client):
    payload = {
        "name": "Duplicate User",
        "email": "dup@test.com",
        "password": "Password123!",
        "role": "buyer"
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"]

def test_login_success(client, test_users):
    buyer = test_users[UserRole.BUYER]
    res = client.post("/api/auth/login", json={"email": buyer.email, "password": "TestPass123!"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "buyer"
    assert data["email"] == buyer.email

def test_login_invalid_password(client, test_users):
    buyer = test_users[UserRole.BUYER]
    res = client.post("/api/auth/login", json={"email": buyer.email, "password": "WrongPassword!"})
    assert res.status_code == 401
    assert "Incorrect email or password" in res.json()["detail"]

def test_inactive_user_rejected(client, db_session, test_users):
    buyer = test_users[UserRole.BUYER]
    buyer.is_active = False
    db_session.commit()

    res = client.post("/api/auth/login", json={"email": buyer.email, "password": "TestPass123!"})
    assert res.status_code == 403
    assert "Inactive" in res.json()["detail"]

    # Restore active
    buyer.is_active = True
    db_session.commit()

def test_invalid_token_rejected(client):
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.fake.token"})
    assert res.status_code == 401
