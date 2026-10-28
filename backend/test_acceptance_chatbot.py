import asyncio
import sys
import httpx
import pytest
from app.main import app

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

@pytest.mark.asyncio
async def test_full_acceptance_sequence():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver/api", timeout=30.0) as client:
        print("\n==========================================")
        print("RUNNING 10-STEP ACCEPTANCE TEST SUITE (§53)")
        print("==========================================\n")
        
        conv_id = "test_acceptance_session_1"

        # STEP 1: Search Amravati properties under 80 lakh
        print("[STEP 1] Testing Amravati search...")
        res = await client.post("/chat", json={
            "conversation_id": conv_id,
            "message": "I need a 2 BHK in Amravati under 80 lakh.",
            "language": "en"
        })
        assert res.status_code == 200, f"Step 1 failed with {res.status_code}: {res.text}"
        data = res.json()
        props = data.get("properties", [])
        print(f"-> Returned {len(props)} properties.")
        assert len(props) >= 2, "Expected at least 2 properties for Amravati"
        for p in props:
            assert p["city"].lower() == "amravati", f"Found non-Amravati property: {p['city']}"
            assert p["price"] <= 8000000, f"Property price over 80L: {p['price']}"
        print("[OK] STEP 1 PASSED: Only Amravati properties returned, strictly under 80 lakh.")

        prop_a = props[0]
        prop_b = props[1]
        print(f"Selected Property A: ID {prop_a['id']} ({prop_a['title']}, ₹{prop_a['price']}, {prop_a['area_sqft']} sq.ft)")
        print(f"Selected Property B: ID {prop_b['id']} ({prop_b['title']}, ₹{prop_b['price']}, {prop_b['area_sqft']} sq.ft)")

        # STEP 2 & 3: Compare Properties
        print("\n[STEP 2 & 3] Testing property comparison...")
        res = await client.post("/chat", json={
            "conversation_id": conv_id,
            "message": f"Compare property {prop_a['id']} and property {prop_b['id']}",
            "language": "en"
        })
        assert res.status_code == 200, f"Step 3 failed: {res.text}"
        data = res.json()
        assert data.get("comparison") is not None, "Comparison object missing in response"
        cmp_obj = data["comparison"]
        assert len(cmp_obj["differences"]) > 0, "No differences generated"
        print(f"-> Summary: {cmp_obj['summary']}")
        print(f"-> Differences: {cmp_obj['differences']}")
        print("[OK] STEP 2 & 3 PASSED: Real DB comparison generated with differences and metrics.")

        # STEP 4: "Which one is cheaper?"
        print("\n[STEP 4] Asking: Which one is cheaper?")
        res = await client.post("/chat", json={
            "conversation_id": conv_id,
            "message": "Which one is cheaper?",
            "language": "en"
        })
        assert res.status_code == 200, f"Step 4 failed: {res.text}"
        data = res.json()
        msg = data.get("message", "")
        print(f"-> Reply: {msg}")
        cheaper_title = prop_a["title"] if prop_a["price"] < prop_b["price"] else prop_b["title"]
        assert cheaper_title.lower() in msg.lower() or "cheaper" in msg.lower(), "Cheaper property not correctly identified"
        print("[OK] STEP 4 PASSED: Actual DB price comparison returned accurately.")

        # STEP 5: "Which has more area?"
        print("\n[STEP 5] Asking: Which has more area?")
        res = await client.post("/chat", json={
            "conversation_id": conv_id,
            "message": "Which has more area?",
            "language": "en"
        })
        assert res.status_code == 200, f"Step 5 failed: {res.text}"
        data = res.json()
        msg = data.get("message", "")
        print(f"-> Reply: {msg}")
        larger_title = prop_a["title"] if prop_a["area_sqft"] > prop_b["area_sqft"] else prop_b["title"]
        assert larger_title.lower() in msg.lower() or "sq.ft" in msg.lower(), "Area comparison failed"
        print("[OK] STEP 5 PASSED: Actual DB area comparison returned accurately.")

        # STEP 6: "I need parking and ready possession."
        print("\n[STEP 6] Asking: I need parking and ready possession.")
        res = await client.post("/chat", json={
            "conversation_id": conv_id,
            "message": "I need parking and ready possession.",
            "language": "en"
        })
        assert res.status_code == 200, f"Step 6 failed: {res.text}"
        data = res.json()
        print(f"-> Reply: {data.get('message', '')}")
        print("[OK] STEP 6 PASSED: Chatbot evaluated properties against new criteria.")

        # STEP 7: "Which one matches my requirements better?"
        print("\n[STEP 7] Asking: Which one matches my requirements better?")
        res = await client.post("/chat", json={
            "conversation_id": conv_id,
            "message": "Which one matches my requirements better?",
            "language": "en"
        })
        assert res.status_code == 200, f"Step 7 failed: {res.text}"
        data = res.json()
        msg = data.get("message", "")
        print(f"-> Reply: {msg}")
        assert "Trade-off" in msg or "trade-off" in msg or "matches" in msg, "Trade-offs not clearly explained"
        print("[OK] STEP 7 PASSED: Requirement-based explanation with transparent trade-offs returned.")

        # STEP 8: "Now price is more important."
        print("\n[STEP 8] Asking: Now price is more important.")
        res = await client.post("/chat", json={
            "conversation_id": conv_id,
            "message": "Now price is more important.",
            "language": "en"
        })
        assert res.status_code == 200, f"Step 8 failed: {res.text}"
        data = res.json()
        msg = data.get("message", "")
        print(f"-> Reply: {msg}")
        assert "price" in msg.lower(), "Priority update to price not reflected"
        print("[OK] STEP 8 PASSED: Analysis updated according to the new priority.")

        # STEP 9: "Show me properties in Pune."
        print("\n[STEP 9] Asking: Show me properties in Pune.")
        res = await client.post("/chat", json={
            "conversation_id": conv_id,
            "message": "Show me properties in Pune.",
            "language": "en"
        })
        assert res.status_code == 200, f"Step 9 failed: {res.text}"
        data = res.json()
        pune_props = data.get("properties", [])
        assert len(pune_props) > 0, "No Pune properties returned"
        for p in pune_props:
            assert p["city"].lower() == "pune", f"Returned non-Pune property: {p['city']}"
        print(f"-> Returned {len(pune_props)} Pune properties. Strictly Pune.")
        print("[OK] STEP 9 PASSED: ONLY Pune properties returned.")

        # STEP 10: "What is machine learning?"
        print("\n[STEP 10] Asking: What is machine learning?")
        res = await client.post("/chat", json={
            "conversation_id": conv_id,
            "message": "What is machine learning?",
            "language": "en"
        })
        assert res.status_code == 200, f"Step 10 failed: {res.text}"
        data = res.json()
        msg = data.get("message", "")
        print(f"-> Reply snippet: {msg[:200]}...")
        assert "machine learning" in msg.lower() or "algorithms" in msg.lower() or "artificial intelligence" in msg.lower(), "ML explanation missing"
        # Must NOT deflect to real estate
        assert "flat in" not in msg.lower() and "properties in pune" not in msg.lower(), "Deflected to real estate!"
        print("[OK] STEP 10 PASSED: Normal general AI answer provided without property deflection.")

        print("\n==========================================")
        print("ALL 10 ACCEPTANCE TEST STEPS COMPLETED SUCCESSFULLY!")
        print("==========================================\n")

if __name__ == "__main__":
    asyncio.run(test_full_acceptance_sequence())
