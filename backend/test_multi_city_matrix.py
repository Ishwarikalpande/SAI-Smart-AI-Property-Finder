import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import get_db, SessionLocal
from app.models.property import Property
from app.ai.nlp_parser import rule_based_extract_intent, invalidate_location_cache

client = TestClient(app)

class MultiCityMatrixTests(unittest.TestCase):

    def test_01_2bhk_in_amravati(self):
        """Matrix Test 1: 2 BHK in Amravati -> Only matching Amravati"""
        res = client.post("/api/ai/chat", json={
            "message": "Show me 2 BHK flats in Amravati",
            "language": "en"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        props = data.get("properties", [])
        self.assertGreater(len(props), 0, "Should find at least 1 property in Amravati")
        for p in props:
            self.assertEqual(p["city"].lower(), "amravati", f"Cross-city leak! Found {p['city']} instead of Amravati")
            if p.get("bhk") is not None:
                self.assertEqual(p["bhk"], 2, f"Expected 2 BHK, got {p.get('bhk')}")

    def test_02_2bhk_in_pune(self):
        """Matrix Test 2: 2 BHK in Pune -> Only matching Pune"""
        res = client.post("/api/ai/chat", json={
            "message": "Show me 2 BHK flats in Pune",
            "language": "en"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        props = data.get("properties", [])
        self.assertGreater(len(props), 0, "Should find at least 1 property in Pune")
        for p in props:
            self.assertEqual(p["city"].lower(), "pune", f"Cross-city leak! Found {p['city']} instead of Pune")
            if p.get("bhk") is not None:
                self.assertEqual(p["bhk"], 2, f"Expected 2 BHK, got {p.get('bhk')}")

    def test_03_house_in_nagpur(self):
        """Matrix Test 3: House in Nagpur -> Only matching Nagpur"""
        res = client.post("/api/ai/chat", json={
            "message": "Find a house in Nagpur",
            "language": "en"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        props = data.get("properties", [])
        self.assertGreater(len(props), 0, "Should find properties in Nagpur")
        for p in props:
            self.assertEqual(p["city"].lower(), "nagpur", f"Cross-city leak! Found {p['city']} instead of Nagpur")

    def test_04_flat_in_mumbai(self):
        """Matrix Test 4: Flat in Mumbai -> Only matching Mumbai"""
        res = client.post("/api/ai/chat", json={
            "message": "Show properties in Mumbai",
            "language": "en"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        props = data.get("properties", [])
        self.assertGreater(len(props), 0, "Should find properties in Mumbai")
        for p in props:
            self.assertEqual(p["city"].lower(), "mumbai", f"Cross-city leak! Found {p['city']} instead of Mumbai")

    def test_05_property_in_nashik(self):
        """Matrix Test 5: Property in Nashik -> Only matching Nashik"""
        res = client.post("/api/ai/chat", json={
            "message": "Find flats in Nashik",
            "language": "en"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        props = data.get("properties", [])
        self.assertGreater(len(props), 0, "Should find properties in Nashik")
        for p in props:
            self.assertEqual(p["city"].lower(), "nashik", f"Cross-city leak! Found {p['city']} instead of Nashik")

    def test_06_property_in_jaipur(self):
        """Matrix Test 6: Property in Jaipur -> Only matching Jaipur"""
        res = client.post("/api/ai/chat", json={
            "message": "Show me properties in Jaipur",
            "language": "en"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        props = data.get("properties", [])
        self.assertGreater(len(props), 0, "Should find properties in Jaipur")
        for p in props:
            self.assertEqual(p["city"].lower(), "jaipur", f"Cross-city leak! Found {p['city']} instead of Jaipur")

    def test_07_property_in_wakad(self):
        """Matrix Test 7: Property in Wakad -> Wakad properties"""
        res = client.post("/api/ai/chat", json={
            "message": "Flat in Wakad",
            "language": "en"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        props = data.get("properties", [])
        self.assertGreater(len(props), 0, "Should find properties in Wakad")
        for p in props:
            self.assertIn("wakad", p["locality"].lower())

    def test_08_property_near_hinjewadi(self):
        """Matrix Test 8: Property near Hinjewadi -> Hinjewadi properties"""
        res = client.post("/api/ai/chat", json={
            "message": "Property near Hinjewadi",
            "language": "en"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        props = data.get("properties", [])
        self.assertGreater(len(props), 0, "Should find properties near Hinjewadi")
        for p in props:
            self.assertIn("hinjewadi", p["locality"].lower())

    def test_09_budget_in_pune(self):
        """Matrix Test 9: ₹60L property in Pune -> Pune + budget filter"""
        res = client.post("/api/ai/chat", json={
            "message": "60 lakh property in Pune",
            "language": "en"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        props = data.get("properties", [])
        self.assertGreater(len(props), 0, "Should find properties in Pune")
        for p in props:
            self.assertEqual(p["city"].lower(), "pune")
            self.assertLessEqual(p["price"], 6500000)

    def test_10_3bhk_in_amravati(self):
        """Matrix Test 10: 3 BHK in Amravati -> Amravati + BHK filter"""
        res = client.post("/api/ai/chat", json={
            "message": "3 BHK in Amravati",
            "language": "en"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        props = data.get("properties", [])
        self.assertGreater(len(props), 0, "Should find 3 BHK in Amravati")
        for p in props:
            self.assertEqual(p["city"].lower(), "amravati")
            self.assertEqual(p["bhk"], 3)

    def test_11_dynamic_new_city_support(self):
        """Matrix Test 11: Add brand new city to DB, verify NLP and search works immediately without code changes"""
        # Create property in dynamic city "Chandigarh"
        db = SessionLocal()
        try:
            prop = Property(
                title="Sukhna Lake Luxury Floors",
                description="Ultra-luxury 3 BHK builder floor in Chandigarh Sector 8",
                property_type="apartment",
                listing_type="buy",
                bhk=3,
                area_sqft=1800.0,
                price=8500000.0,
                price_display="₹85L",
                city="Chandigarh",
                locality="Sector 8",
                state="Chandigarh",
                country="India",
                status="available",
                is_verified=True,
                is_rera=True
            )
            db.add(prop)
            db.commit()
            db.refresh(prop)
            invalidate_location_cache()

            # Now test search directly via NLP parser and chat
            intent = rule_based_extract_intent("Show me 3 BHK in Chandigarh")
            self.assertEqual(intent.city, "Chandigarh")
            self.assertEqual(intent.bhk, 3)

            # Test chatbot search for Chandigarh
            res = client.post("/api/ai/chat", json={
                "message": "Find flats in Chandigarh",
                "language": "en"
            })
            self.assertEqual(res.status_code, 200)
            data = res.json()
            props = data.get("properties", [])
            self.assertGreater(len(props), 0)
            for p in props:
                self.assertEqual(p["city"].lower(), "chandigarh")

        finally:
            # Clean up
            db.query(Property).filter(Property.city == "Chandigarh").delete()
            db.commit()
            db.close()
            invalidate_location_cache()

    def test_12_strict_city_switch(self):
        """Matrix Test 12: Strict turn-by-turn city override: 'Actually show me Pune instead' replaces Amravati"""
        conv_id = "test_conv_city_switch_123"
        # Turn 1: Amravati
        res1 = client.post("/api/ai/chat", json={
            "conversation_id": conv_id,
            "message": "Show me 2 BHK flats in Amravati",
            "language": "en"
        })
        self.assertEqual(res1.status_code, 200)
        data1 = res1.json()
        self.assertTrue(all(p["city"].lower() == "amravati" for p in data1.get("properties", [])))

        # Turn 2: Switch to Pune
        res2 = client.post("/api/ai/chat", json={
            "conversation_id": conv_id,
            "message": "Actually show me Pune instead",
            "language": "en"
        })
        self.assertEqual(res2.status_code, 200)
        data2 = res2.json()
        props2 = data2.get("properties", [])
        self.assertGreater(len(props2), 0)
        for p in props2:
            self.assertEqual(p["city"].lower(), "pune", f"Amravati leaked into Pune switch! Found {p['city']}")

    def test_13_multilingual_hindi_marathi(self):
        """Matrix Test 13: Multilingual location search in Hindi & Marathi for Amravati"""
        # Hindi: "मुझे अमरावती में फ्लैट दिखाओ"
        res_hi = client.post("/api/ai/chat", json={
            "message": "मुझे अमरावती में 2 BHK फ्लैट दिखाओ",
            "language": "hi"
        })
        self.assertEqual(res_hi.status_code, 200)
        data_hi = res_hi.json()
        props_hi = data_hi.get("properties", [])
        self.assertGreater(len(props_hi), 0)
        for p in props_hi:
            self.assertEqual(p["city"].lower(), "amravati")

        # Marathi: "मला अमरावतीमध्ये फ्लॅट दाखवा"
        res_mr = client.post("/api/ai/chat", json={
            "message": "मला अमरावतीमध्ये फ्लॅट दाखवा",
            "language": "mr"
        })
        self.assertEqual(res_mr.status_code, 200)
        data_mr = res_mr.json()
        props_mr = data_mr.get("properties", [])
        self.assertGreater(len(props_mr), 0)
        for p in props_mr:
            self.assertEqual(p["city"].lower(), "amravati")

    def test_14_zero_cross_city_result_mixing_when_empty(self):
        """Matrix Test 14: If no properties exist in city, never substitute another city"""
        res = client.post("/api/ai/chat", json={
            "message": "Show me 10 BHK penthouse in Amravati",
            "language": "en"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        props = data.get("properties", [])
        self.assertEqual(len(props), 0, "Expected 0 results for non-existent 10 BHK penthouse in Amravati")
        self.assertIn("No matching properties were found in Amravati", data["message"])
        self.assertIn("Would you like to search nearby areas or another city?", data["message"])

if __name__ == "__main__":
    unittest.main()
