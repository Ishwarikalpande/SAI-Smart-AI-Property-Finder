import sys
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User, UserRole
from app.core.security import get_password_hash, create_access_token

# Use a dedicated SQLite test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_sai.db"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_sai.db"):
        try:
            os.remove("./test_sai.db")
        except Exception:
            pass

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_users(db_session):
    pw = get_password_hash("TestPass123!")
    users = {}
    for role in [UserRole.BUYER, UserRole.SELLER, UserRole.AGENT, UserRole.BUILDER, UserRole.SUPER_ADMIN]:
        email = f"test_{role.value}@sai.in"
        user = db_session.query(User).filter(User.email == email).first()
        if not user:
            user = User(name=f"Test {role.value.capitalize()}", email=email, password_hash=pw, role=role, is_active=True)
            db_session.add(user)
            db_session.commit()
            db_session.refresh(user)
        else:
            user.password_hash = pw
            user.is_active = True
            db_session.commit()
        users[role] = user

    # Second seller for testing ownership isolation
    seller2_email = "test_seller2@sai.in"
    seller2 = db_session.query(User).filter(User.email == seller2_email).first()
    if not seller2:
        seller2 = User(name="Test Seller 2", email=seller2_email, password_hash=pw, role=UserRole.SELLER, is_active=True)
        db_session.add(seller2)
        db_session.commit()
        db_session.refresh(seller2)
    users["seller2"] = seller2

    return users

def get_auth_headers(user: User):
    token = create_access_token(subject=user.id, role=user.role.value)
    return {"Authorization": f"Bearer {token}"}
