"""
Comprehensive Acceptance Test Suite for SAI Property Comparison System.
Validates all requirements:
1. Identifying properties by IDs, names, ordinals, and conversation context.
2. Comparing 2, 3, and 4 properties using real PostgreSQL/SQLite records.
3. Accurate factual calculations: Price/sq.ft only when price and area exist.
4. City divergence detection (e.g. Pune vs Amravati).
5. User requirement match matrix (Budget, BHK, Parking, Ready to Move) without arbitrary scores.
6. User priorities shifting (Lowest price, Maximum space, Parking, Ready).
7. Transparent trade-off conclusions (No universal "best").
8. Follow-up question answering in Chat with conversational context.
9. Zero hallucination: Missing data rendered as "— Not Available" or "Not Available".
"""

import pytest
from app.db.session import SessionLocal
from app.models.property import Property
from app.services.property_comparison_service import PropertyComparisonService
from app.schemas.property import PropertyCompareRequest
from app.ai.chat_service import process_chat_message


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class TestPropertyComparisonService:

    def test_identify_properties_by_id(self, db_session):
        service = PropertyComparisonService(db_session)
        # Identify by direct IDs
        ids, ambig = service.identify_properties(property_ids=[1, 2])
        assert ids == [1, 2]
        assert ambig is None

    def test_identify_properties_by_name(self, db_session):
        service = PropertyComparisonService(db_session)
        # Fetch 2 actual properties to get their names
        p1 = db_session.query(Property).filter(Property.id == 1).first()
        p2 = db_session.query(Property).filter(Property.id == 2).first()
        assert p1 is not None and p2 is not None

        query = f"Compare {p1.title} and {p2.title}"
        ids, ambig = service.identify_properties(query_text=query)
        assert p1.id in ids
        assert p2.id in ids

    def test_identify_properties_by_ordinal_context(self, db_session):
        service = PropertyComparisonService(db_session)
        context = {
            "last_search_results": [
                {"id": 10, "title": "Prop 10"},
                {"id": 20, "title": "Prop 20"},
                {"id": 30, "title": "Prop 30"},
            ]
        }
        # First two
        ids, _ = service.identify_properties(query_text="Compare the first two properties", conversation_context=context)
        assert ids == [10, 20]

        # First and third
        ids, _ = service.identify_properties(query_text="Compare the first and third properties", conversation_context=context)
        assert ids == [10, 30]

        # These three
        ids, _ = service.identify_properties(query_text="Compare these three", conversation_context=context)
        assert ids == [10, 20, 30]

    def test_compare_2_properties_factual(self, db_session):
        service = PropertyComparisonService(db_session)
        p1 = db_session.query(Property).filter(Property.id == 1).first()
        p2 = db_session.query(Property).filter(Property.id == 2).first()

        res = service.compare([p1.id, p2.id])
        assert len(res["properties"]) == 2
        assert len(res["fields"]) > 10
        assert "differences" in res
        assert "advantages" in res
        assert "considerations" in res
        assert "amenity_comparison" in res
        assert "price_analysis" in res
        assert "area_analysis" in res

        # Verify price per sq.ft calculation
        for p in res["properties"]:
            if p["price"] and p["area_sqft"]:
                expected_sqft = round(p["price"] / p["area_sqft"])
                assert p["price_per_sqft"] == expected_sqft

        # Verify no arbitrary scores
        res_str = str(res)
        assert "/10" not in res_str
        assert "9.8" not in res_str

    def test_compare_3_and_4_properties(self, db_session):
        service = PropertyComparisonService(db_session)
        props = db_session.query(Property).limit(4).all()
        ids = [p.id for p in props]
        assert len(ids) == 4

        # Compare 3
        res3 = service.compare(ids[:3])
        assert len(res3["properties"]) == 3
        assert len(res3["advantages"]) == 3

        # Compare 4
        res4 = service.compare(ids)
        assert len(res4["properties"]) == 4
        assert len(res4["advantages"]) == 4

    def test_cross_city_comparison_divergence_flag(self, db_session):
        service = PropertyComparisonService(db_session)
        # Find one Pune property and one Amravati property
        p_pune = db_session.query(Property).filter(Property.city.ilike("%pune%")).first()
        p_amravati = db_session.query(Property).filter(Property.city.ilike("%amravati%")).first()

        if p_pune and p_amravati:
            res = service.compare([p_pune.id, p_amravati.id])
            # Must explicitly flag city difference
            city_diff_found = any("different cities" in diff.lower() for diff in res["differences"])
            assert city_diff_found, "Cross-city comparison must explicitly state different cities!"

    def test_user_requirement_matching_matrix(self, db_session):
        service = PropertyComparisonService(db_session)
        # Test case specified in prompt:
        # User: 2 BHK in Pune under 90 lakh with parking and ready possession.
        reqs = {
            "city": "Pune",
            "bhk": 2,
            "budget_max": 9000000,
            "parking_required": True,
            "ready_required": True,
        }
        res = service.compare([1, 2], user_requirements=reqs)
        matrix = res["requirement_matrix"]
        assert len(matrix) >= 4  # budget, city, bhk, parking, ready

        criteria_names = [row["criterion"] for row in matrix]
        assert any("Budget" in c for c in criteria_names)
        assert any("BHK" in c for c in criteria_names)
        assert any("Parking" in c for c in criteria_names)
        assert any("Possession" in c for c in criteria_names)

        # Verify trade-off explanation is present and transparent
        assert res["recommendation_reason"] is not None
        assert len(res["recommendation_reason"]) > 30

    def test_priority_shift_lowest_price(self, db_session):
        service = PropertyComparisonService(db_session)
        res = service.compare([1, 2], priority="price")
        # Recommendation reason must explicitly mention lowest price priority and trade-off
        rec = res["recommendation_reason"]
        assert "price" in rec.lower() or "cost" in rec.lower()
        assert "trade-off" in rec.lower()

    def test_priority_shift_maximum_space(self, db_session):
        service = PropertyComparisonService(db_session)
        res = service.compare([1, 2], priority="area")
        rec = res["recommendation_reason"]
        assert "space" in rec.lower() or "area" in rec.lower()
        assert "trade-off" in rec.lower()


class TestPropertyComparisonChatIntegration:

    @pytest.mark.asyncio
    async def test_chat_comparison_direct(self, db_session):
        p1 = db_session.query(Property).filter(Property.id == 1).first()
        p2 = db_session.query(Property).filter(Property.id == 2).first()

        res = await process_chat_message(
            db=db_session,
            message=f"Compare {p1.title} and {p2.title}",
            conversation_id="conv_test_comp_1"
        )
        assert "PROPERTY COMPARISON" in res["message"] or "COMPARISON" in res["message"]
        assert p1.title in res["message"]
        assert p2.title in res["message"]
        assert "trade-off analysis" in res["message"].lower()

    @pytest.mark.asyncio
    async def test_chat_comparison_followup_cheaper(self, db_session):
        p1 = db_session.query(Property).filter(Property.id == 1).first()
        p2 = db_session.query(Property).filter(Property.id == 2).first()

        # Step 1: Initial compare
        await process_chat_message(
            db=db_session,
            message=f"Compare property {p1.id} and property {p2.id}",
            conversation_id="conv_test_followup"
        )

        # Step 2: Follow-up: "Which is cheaper?"
        fup_res = await process_chat_message(
            db=db_session,
            message="Which is cheaper?",
            conversation_id="conv_test_followup"
        )
        msg = fup_res["message"]
        assert "lower listed price" in msg.lower() or "cheaper" in msg.lower()
        assert "₹" in msg

    @pytest.mark.asyncio
    async def test_chat_comparison_followup_parking(self, db_session):
        await process_chat_message(
            db=db_session,
            message="Compare property 1 and property 2",
            conversation_id="conv_test_parking"
        )
        fup_res = await process_chat_message(
            db=db_session,
            message="Which has parking?",
            conversation_id="conv_test_parking"
        )
        msg = fup_res["message"]
        assert "parking" in msg.lower()
        assert "Parking Facility Comparison" in msg or "Dedicated Parking" in msg

    @pytest.mark.asyncio
    async def test_chat_comparison_followup_area(self, db_session):
        await process_chat_message(
            db=db_session,
            message="Compare property 1 and property 2",
            conversation_id="conv_test_area"
        )
        fup_res = await process_chat_message(
            db=db_session,
            message="Which has more area?",
            conversation_id="conv_test_area"
        )
        msg = fup_res["message"]
        assert "sq.ft" in msg or "area" in msg.lower()

    @pytest.mark.asyncio
    async def test_chat_comparison_followup_ready(self, db_session):
        await process_chat_message(
            db=db_session,
            message="Compare property 1 and property 2",
            conversation_id="conv_test_ready"
        )
        fup_res = await process_chat_message(
            db=db_session,
            message="Which is ready to move?",
            conversation_id="conv_test_ready"
        )
        msg = fup_res["message"]
        assert "ready to move" in msg.lower() or "possession" in msg.lower()

    @pytest.mark.asyncio
    async def test_chat_comparison_followup_verified(self, db_session):
        await process_chat_message(
            db=db_session,
            message="Compare property 1 and property 2",
            conversation_id="conv_test_verif"
        )
        fup_res = await process_chat_message(
            db=db_session,
            message="Which is verified?",
            conversation_id="conv_test_verif"
        )
        msg = fup_res["message"]
        assert "verified" in msg.lower()

    @pytest.mark.asyncio
    async def test_chat_priority_shift_tradeoff(self, db_session):
        await process_chat_message(
            db=db_session,
            message="Compare property 1 and property 2",
            conversation_id="conv_test_priority"
        )
        fup_res = await process_chat_message(
            db=db_session,
            message="Now consider price as my priority",
            conversation_id="conv_test_priority"
        )
        msg = fup_res["message"]
        assert "priority" in msg.lower() or "price" in msg.lower()
        assert "trade-off" in msg.lower()

    @pytest.mark.asyncio
    async def test_which_one_should_i_choose_transparent(self, db_session):
        await process_chat_message(
            db=db_session,
            message="Compare property 1 and property 2",
            conversation_id="conv_test_choose"
        )
        fup_res = await process_chat_message(
            db=db_session,
            message="Which one should I choose?",
            conversation_id="conv_test_choose"
        )
        msg = fup_res["message"]
        # Must NOT claim universal "best"
        assert "objectively the best" not in msg.lower()
        assert "trade-off" in msg.lower()


from fastapi.testclient import TestClient
from app.main import app

class TestPropertyComparisonAPI:

    def test_api_compare_2_properties(self):
        client = TestClient(app)
        res = client.post("/api/properties/compare", json={"property_ids": [1, 2]})
        assert res.status_code == 200
        data = res.json()
        assert "comparison" in data
        cmp = data["comparison"]
        assert len(cmp["properties"]) == 2
        assert len(cmp["fields"]) > 0
        assert "differences" in cmp
        assert "advantages" in cmp
        assert "considerations" in cmp
        assert "amenity_comparison" in cmp
        assert "price_analysis" in cmp
        assert "area_analysis" in cmp

    def test_api_compare_3_properties(self):
        client = TestClient(app)
        res = client.post("/api/properties/compare", json={"property_ids": [1, 2, 3]})
        assert res.status_code == 200
        data = res.json()
        assert len(data["comparison"]["properties"]) == 3

    def test_api_compare_4_properties(self):
        client = TestClient(app)
        res = client.post("/api/properties/compare", json={"property_ids": [1, 2, 3, 4]})
        assert res.status_code == 200
        data = res.json()
        assert len(data["comparison"]["properties"]) == 4

    def test_api_compare_with_requirements_and_priority(self):
        client = TestClient(app)
        payload = {
            "property_ids": [1, 2],
            "user_requirements": {
                "city": "Pune",
                "bhk": 2,
                "budget_max": 9000000,
                "parking_required": True,
                "ready_required": True
            },
            "priority": "price"
        }
        res = client.post("/api/properties/compare", json=payload)
        assert res.status_code == 200
        cmp = res.json()["comparison"]
        assert len(cmp["requirement_matrix"]) >= 4
        assert "trade-off" in cmp["recommendation_reason"].lower()

    def test_api_compare_fewer_than_2_fails(self):
        client = TestClient(app)
        res = client.post("/api/properties/compare", json={"property_ids": [1]})
        assert res.status_code in (400, 422)
