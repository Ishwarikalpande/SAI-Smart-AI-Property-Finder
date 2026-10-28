import pytest
from app.models.user import UserRole
from app.ai.language_service import detect_language, SUPPORTED_LANGUAGES
from app.ai.chat_service import classify_intent
from tests.conftest import get_auth_headers

# Matrix: 8 supported languages
LANGUAGES = ["en", "hi", "mr", "bn", "gu", "ta", "te", "kn"]

# 10 Scenarios for each language:
# 1. Greeting
# 2. Property search
# 3. Property details
# 4. Property comparison
# 5. Recommendation
# 6. Investment query
# 7. Follow-up question
# 8. Mixed-language query
# 9. Off-topic query
# 10. Unknown/unclear query

@pytest.fixture(autouse=True)
def seed_ai_test_data(client, test_users):
    seller_headers = get_auth_headers(test_users[UserRole.SELLER])
    props = [
        {"title": "Prestige Heights", "property_type": "apartment", "listing_type": "buy", "bhk": 3, "area_sqft": 1450, "price": 8500000, "locality": "Baner", "city": "Pune", "dist_metro": "0.8 km Metro", "is_rera": True, "is_verified": True},
        {"title": "Baner Green Residences", "property_type": "apartment", "listing_type": "buy", "bhk": 2, "area_sqft": 1050, "price": 7500000, "locality": "Baner", "city": "Pune", "dist_metro": "0.5 km Metro", "is_rera": True, "is_verified": True},
        {"title": "Godrej Woodsville", "property_type": "apartment", "listing_type": "buy", "bhk": 2, "area_sqft": 1120, "price": 6200000, "locality": "Wakad", "city": "Pune", "dist_metro": "1.2 km Metro", "is_rera": True, "is_verified": True},
        {"title": "Lodha Palacia", "property_type": "villa", "listing_type": "buy", "bhk": 4, "area_sqft": 2800, "price": 18000000, "locality": "Kalyani Nagar", "city": "Pune", "dist_metro": "2.1 km Metro", "is_rera": True, "is_verified": True},
    ]
    for p in props:
        client.post("/api/properties/", json=p, headers=seller_headers)

def test_exactly_8_languages_supported(client):
    res = client.get("/api/ai/languages")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 8
    codes = [l["code"] for l in data["languages"]]
    for expected in ["en", "hi", "mr", "bn", "gu", "ta", "te", "kn"]:
        assert expected in codes

def test_language_detection_matrix():
    samples = {
        "en": "Looking for a 2 BHK apartment in Baner Pune under 70 lakh",
        "hi": "मुझे पुणे में 60 लाख के अंदर 2 बीएचके फ्लैट चाहिए",
        "mr": "मला पुण्यात बाणेर येथे 70 लाखांच्या आत 2 बीएचके फ्लॅट पाहिजे",
        "bn": "আমি পুনেতে 2 বিএইচকে ফ্ল্যাট খুঁজছি",
        "gu": "મને પુણેમાં 2 બીએચકે એપાર્ટમેન્ટ જોઈએ છે",
        "ta": "எனக்கு புனேவில் 2 பிகெச்கே பிளாட் வேண்டும்",
        "te": "నాకు పూణేలో 2 బిహెచ్‌కే అపార్ట్‌మెంట్ కావాలి",
        "kn": "ನನಗೆ ಪುಣೆಯಲ್ಲಿ 2 ಬಿಎಚ್‌ಕೆ ಅಪಾರ್ಟ್‌ಮೆಂಟ್ ಬೇಕು"
    }
    for lang_code, text in samples.items():
        detected = detect_language(text)
        assert detected == lang_code, f"Expected {lang_code} but detected {detected} for: {text}"

def test_mixed_language_queries():
    # Minglish / Hinglish mixed queries
    assert detect_language("Mujhe Pune me 2 BHK flat chahiye under 60 lakh") == "hi"
    assert detect_language("Mala Pune madhe 2 BHK flat pahije under 70 lakh") == "mr"

def test_greeting_behavior_matrix(client):
    greetings = {
        "en": "Hello",
        "hi": "नमस्ते",
        "mr": "नमस्कार",
        "bn": "নমস্কার",
        "gu": "નમસ્તે",
        "ta": "வணக்கம்",
        "te": "నమస్కారం",
        "kn": "ನಮಸ್ಕಾರ"
    }
    for lang, greet in greetings.items():
        res = client.post("/api/ai/chat", json={"message": greet, "language": lang})
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "GREETING"
        assert len(data["message"]) > 0

def test_off_topic_polite_refusal(client):
    off_topics = [
        ("What is the capital of France?", "en"),
        ("फ्रांस की राजधानी क्या है?", "hi"),
        ("फ्रान्सची राजधानी कोणती आहे?", "mr")
    ]
    for q, lang in off_topics:
        res = client.post("/api/ai/chat", json={"message": q, "language": lang})
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "OFF_TOPIC"
        # Must decline politely and redirect to property
        assert any(term in data["message"].lower() for term in ["real estate", "property", "प्रॉपर्टी", "मालमत्ता"])

def test_property_search_conversational(client, db_session):
    res = client.post("/api/ai/chat", json={
        "message": "Find 2 BHK in Baner under 80 lakh",
        "language": "en"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["intent"] == "PROPERTY_SEARCH"
    assert isinstance(data["properties"], list)
    assert len(data["properties"]) > 0

def test_property_comparison_endpoint(client):
    # Fetch properties to get real IDs
    props_res = client.get("/api/properties/")
    pids = [p["id"] for p in props_res.json()["items"][:2]]

    res = client.post("/api/ai/compare", json={"property_ids": pids, "language": "en"})
    assert res.status_code == 200
    data = res.json()
    assert "properties" in data
    assert len(data["properties"]) == 2
    assert "comparison_matrix" in data
    assert "recommendation_reason" in data
    assert data["top_pick_id"] in pids

def test_ai_recommendation_endpoint(client):
    res = client.post("/api/ai/recommend", json={
        "budget_max": 9000000,
        "city": "Pune",
        "bhk": 2
    })
    assert res.status_code == 200
    recs = res.json()
    assert len(recs) > 0
    top = recs[0]
    assert "overall_match_score" in top
    assert "budget_fit" in top
    assert "location_fit" in top
    assert "advantages" in top

def test_investment_prediction_endpoint(client):
    props_res = client.get("/api/properties/")
    pid = props_res.json()["items"][0]["id"]

    res = client.post("/api/ai/investment-predict", json={"property_id": pid})
    assert res.status_code == 200
    inv = res.json()
    assert inv["property_id"] == pid
    assert inv["investment_score"] >= 1.0
    assert len(inv["projections"]) >= 3
    assert "disclaimer" in inv
    assert "DISCLAIMER" in inv["disclaimer"].upper()

def test_super_admin_2fa_flow(client, db_session, test_users):
    admin = test_users[UserRole.SUPER_ADMIN]
    admin_headers = get_auth_headers(admin)

    # 1. Setup 2FA
    setup_res = client.post("/api/auth/admin/2fa/setup", headers=admin_headers)
    assert setup_res.status_code == 200
    setup_data = setup_res.json()
    assert "secret" in setup_data
    assert "qr_code_base64" in setup_data
    assert setup_data["qr_code_base64"].startswith("data:image/png;base64,")

    # 2. Login step 1
    login_res = client.post("/api/auth/admin/login", json={"email": admin.email, "password": "TestPass123!"})
    assert login_res.status_code == 200
    assert login_res.json()["requires_2fa"] is True

    # 3. Verify step 2 with valid dev bypass code
    verify_res = client.post("/api/auth/admin/2fa/verify", json={"email": admin.email, "code": "123456"})
    assert verify_res.status_code == 200
    assert "access_token" in verify_res.json()
    assert verify_res.json()["role"] == "super_admin"

def test_forgot_password_flow(client, db_session, test_users):
    buyer = test_users[UserRole.BUYER]

    # 1. Request reset
    forgot_res = client.post("/api/auth/forgot-password", json={"email": buyer.email})
    assert forgot_res.status_code == 200
    token = forgot_res.json().get("dev_token")
    assert token is not None

    # 2. Reset password
    reset_res = client.post("/api/auth/reset-password", json={"token": token, "new_password": "NewStrongPass123!"})
    assert reset_res.status_code == 200
    assert reset_res.json()["success"] is True

    # 3. Log in with new password
    login_res = client.post("/api/auth/login", json={"email": buyer.email, "password": "NewStrongPass123!"})
    assert login_res.status_code == 200

def test_file_upload_validation(client):
    # Test valid image upload
    files = [("files", ("test.jpg", b"\xff\xd8\xff\xe0test_image_bytes", "image/jpeg"))]
    res = client.post("/api/upload/", files=files)
    assert res.status_code == 200
    assert res.json()["success"] is True
    assert len(res.json()["urls"]) == 1

    # Test rejected disallowed extension
    bad_file = [("files", ("malware.exe", b"binary_content", "application/x-msdownload"))]
    res_bad = client.post("/api/upload/", files=bad_file)
    assert res_bad.status_code == 400
