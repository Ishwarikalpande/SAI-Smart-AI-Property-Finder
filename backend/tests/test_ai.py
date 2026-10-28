import pytest
from app.ai.nlp_parser import rule_based_extract_intent

def test_nlp_intent_extraction_english():
    query = "I want a quiet 2 BHK flat near hospital in Baner under 60 lakh"
    intent = rule_based_extract_intent(query)
    assert intent.bhk == 2
    assert intent.max_price == 6000000
    assert intent.locality == "Baner"
    assert intent.nearby_facility == "hospital"
    assert "quiet" in intent.preferences
    assert intent.property_type == "apartment"

def test_nlp_intent_extraction_hinglish():
    query = "Mujhe 40 lakh tak 2 BHK hospital ke paas chahiye"
    intent = rule_based_extract_intent(query)
    assert intent.bhk == 2
    assert intent.max_price == 4000000
    assert intent.nearby_facility == "hospital"

def test_nlp_search_api(client):
    payload = {
        "query": "2 BHK apartment in Pune under 90 lakh",
        "city": "Pune",
        "language": "en"
    }
    res = client.post("/api/search/natural-language", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "parsed_intent" in data
    assert data["parsed_intent"]["bhk"] == 2
    assert "items" in data

def test_chatbot_api(client):
    payload = {
        "message": "Find 2 BHK flat under 80 lakh in Wakad",
        "language": "en"
    }
    res = client.post("/api/chatbot/message", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert "suggestions" in data
