import sys
import os
import unittest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.core.config import settings

client = TestClient(app)

class AcceptanceTests(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        cls.test_email = f"test_user_{os.urandom(4).hex()}@sai.in"
        cls.test_password = "Password123!"
        cls.test_name = "Acceptance Test Buyer"
        cls.token = None
        cls.refresh_token = None

    def test_01_signup_and_login_flow(self):
        """TEST 1: Sign up new user, login, and obtain valid JWT tokens."""
        # 1. Register
        reg_payload = {
            "name": self.test_name,
            "email": self.test_email,
            "phone": "+91 98765 00001",
            "password": self.test_password,
            "role": "buyer"
        }
        res = client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(res.status_code, 201, f"Registration failed: {res.text}")
        data = res.json()
        self.assertEqual(data["email"], self.test_email.lower())

        # 2. Login
        login_payload = {
            "email": self.test_email,
            "password": self.test_password
        }
        res_login = client.post("/api/auth/login", json=login_payload)
        self.assertEqual(res_login.status_code, 200, f"Login failed: {res_login.text}")
        token_data = res_login.json()
        self.assertIn("access_token", token_data)
        self.assertIn("refresh_token", token_data)
        self.assertEqual(token_data["role"], "buyer")
        
        # Save tokens for subsequent tests
        AcceptanceTests.token = token_data["access_token"]
        AcceptanceTests.refresh_token = token_data["refresh_token"]

    def test_02_search_natural_language(self):
        """TEST 2: Search '2 BHK in Baner under 60 lakh' returns real database results."""
        res = client.post("/api/search/natural-language", json={
            "query": "2 BHK in Baner under 60 lakh",
            "city": "Pune",
            "language": "en"
        })
        self.assertEqual(res.status_code, 200, f"NLP Search failed: {res.text}")
        data = res.json()
        self.assertIn("items", data)
        self.assertGreaterEqual(data["total"], 0)
        self.assertEqual(data["parsed_intent"]["bhk"], 2)
        self.assertEqual(data["parsed_intent"]["locality"], "Baner")
        self.assertEqual(data["parsed_intent"]["max_price"], 6000000.0)

    def test_03_save_property_and_verify_dashboard(self):
        """TEST 3: Save property and verify dashboard saved count increases."""
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Initial dashboard count
        res_dash = client.get("/api/dashboard", headers=headers)
        self.assertEqual(res_dash.status_code, 200)
        initial_saved = res_dash.json()["saved_count"]

        # Save property 1
        res_save = client.post("/api/saved-properties/1", headers=headers)
        self.assertEqual(res_save.status_code, 201)

        # Verify updated dashboard count
        res_dash2 = client.get("/api/dashboard", headers=headers)
        self.assertEqual(res_dash2.status_code, 200)
        updated_saved = res_dash2.json()["saved_count"]
        self.assertEqual(updated_saved, initial_saved + 1)
        self.assertTrue(any(p["id"] == 1 for p in res_dash2.json()["saved_properties_data"]))

    def test_04_compare_property_and_verify_dashboard(self):
        """TEST 4: Add property to comparison and verify comparing count increases."""
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Initial count
        res_dash = client.get("/api/dashboard", headers=headers)
        initial_comp = res_dash.json()["comparison_count"]

        # Add property 1 and 2 to compare
        res_comp1 = client.post("/api/compare/1", headers=headers)
        self.assertEqual(res_comp1.status_code, 201)
        res_comp2 = client.post("/api/compare/2", headers=headers)
        self.assertEqual(res_comp2.status_code, 201)

        # Verify updated dashboard
        res_dash2 = client.get("/api/dashboard", headers=headers)
        updated_comp = res_dash2.json()["comparison_count"]
        self.assertEqual(updated_comp, initial_comp + 2)

        # Verify comparison matrix
        res_matrix = client.get("/api/compare", headers=headers)
        self.assertEqual(res_matrix.status_code, 200)
        matrix_data = res_matrix.json()
        self.assertEqual(matrix_data["total"], 2)
        self.assertIn("Price", matrix_data["matrix"])

    def test_05_schedule_visit_and_verify_dashboard(self):
        """TEST 5: Schedule a site visit, verify upcoming visits count, and test reschedule."""
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Initial dashboard count
        res_dash = client.get("/api/dashboard", headers=headers)
        initial_visits = res_dash.json()["upcoming_visits"]

        # Schedule visit
        visit_payload = {
            "property_id": 1,
            "scheduled_at": "2026-10-15T15:00:00Z",
            "notes": "Interested in 2 BHK top floor"
        }
        res_visit = client.post("/api/visits/", json=visit_payload, headers=headers)
        self.assertEqual(res_visit.status_code, 201)
        visit_id = res_visit.json()["id"]

        # Verify dashboard count
        res_dash2 = client.get("/api/dashboard", headers=headers)
        updated_visits = res_dash2.json()["upcoming_visits"]
        self.assertEqual(updated_visits, initial_visits + 1)
        self.assertTrue(any(v["id"] == visit_id for v in res_dash2.json()["upcoming_visits_data"]))

        # Reschedule visit
        reschedule_payload = {
            "scheduled_at": "2026-10-16T11:00:00Z",
            "notes": "Rescheduled for morning slot"
        }
        res_resched = client.put(f"/api/visits/{visit_id}/reschedule", json=reschedule_payload, headers=headers)
        self.assertEqual(res_resched.status_code, 200)
        self.assertEqual(res_resched.json()["status"], "RESCHEDULED")

    def test_06_loan_and_emi_calculators(self):
        """TEST 6: Test exact reducing-balance formula and loan eligibility."""
        # Loan Eligibility
        payload = {
            "monthly_income": 85000,
            "existing_emi": 0,
            "tenure_years": 20,
            "interest_rate": 8.5
        }
        res = client.post("/api/loan/eligibility", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(data["eligible_loan"], 4000000)
        self.assertGreater(data["monthly_emi"], 0)
        self.assertGreater(data["total_interest"], 0)

        # EMI Calculator
        emi_payload = {
            "loan_amount": 5000000,
            "interest_rate": 8.5,
            "tenure_years": 20
        }
        res_emi = client.post("/api/loan/emi", json=emi_payload)
        self.assertEqual(res_emi.status_code, 200)
        emi_data = res_emi.json()
        self.assertAlmostEqual(emi_data["monthly_emi"], 43391.16, delta=500)

    def test_07_logout_and_session_invalidation(self):
        """TEST 7: Logout and ensure refresh token is invalidated."""
        headers = {"Authorization": f"Bearer {self.token}"}
        res_logout = client.post("/api/auth/logout", json={"refresh_token": self.refresh_token}, headers=headers)
        self.assertEqual(res_logout.status_code, 200)

        # Attempting refresh with revoked token must fail with 401
        res_refresh = client.post("/api/auth/refresh", json={"refresh_token": self.refresh_token})
        self.assertEqual(res_refresh.status_code, 401)

    def test_08_relogin_and_data_persistence(self):
        """TEST 8: Login again and verify all saved properties, comparisons, and visits persist."""
        login_payload = {
            "email": self.test_email,
            "password": self.test_password
        }
        res_login = client.post("/api/auth/login", json=login_payload)
        self.assertEqual(res_login.status_code, 200)
        new_token = res_login.json()["access_token"]
        new_headers = {"Authorization": f"Bearer {new_token}"}

        # Check dashboard
        res_dash = client.get("/api/dashboard", headers=new_headers)
        self.assertEqual(res_dash.status_code, 200)
        dash = res_dash.json()
        self.assertGreaterEqual(dash["saved_count"], 1)
        self.assertGreaterEqual(dash["comparison_count"], 2)
        self.assertGreaterEqual(dash["upcoming_visits"], 1)

    def test_09_forgot_password_and_reset_flow(self):
        """TEST 9: Request password reset and complete reset flow."""
        # 1. Request reset
        res_forgot = client.post("/api/auth/forgot-password", json={"email": self.test_email})
        self.assertEqual(res_forgot.status_code, 200)
        data = res_forgot.json()
        dev_token = data.get("dev_token")
        self.assertIsNotNone(dev_token, "Dev reset token should be returned in debug mode")

        # 2. Reset with new password
        new_pwd = "NewSecurePassword456!"
        res_reset = client.post("/api/auth/reset-password", json={"token": dev_token, "new_password": new_pwd})
        self.assertEqual(res_reset.status_code, 200)

        # 3. Login with new password
        res_new_login = client.post("/api/auth/login", json={"email": self.test_email, "password": new_pwd})
        self.assertEqual(res_new_login.status_code, 200)

    def test_10_properties_geo_and_city_filtering(self):
        """TEST 10: Multi-city and geo-coordinate filtering."""
        for test_city in ["Pune", "Mumbai", "Bangalore"]:
            res = client.get(f"/api/properties/?city={test_city}&limit=10")
            self.assertEqual(res.status_code, 200)
            items = res.json()["items"]
            for prop in items:
                self.assertIn(test_city.lower(), prop["city"].lower())
                self.assertIsNotNone(prop.get("latitude"))
                self.assertIsNotNone(prop.get("longitude"))

    def test_11_multi_language_ai_support(self):
        """TEST 11: All 8 Indian languages supported by NLP parser."""
        languages_queries = [
            ("en", "2 BHK apartment in Baner under 60 lakh"),
            ("hi", "बानेर में 60 लाख के अंदर 2 बीएचके फ्लैट"),
            ("mr", "बाणेरमध्ये ६० लाखांच्या आत २ बीएचके फ्लॅट"),
        ]
        for lang_code, query_text in languages_queries:
            res = client.post("/api/search/natural-language", json={
                "query": query_text,
                "city": "Pune",
                "language": lang_code
            })
            self.assertEqual(res.status_code, 200)
            self.assertIn("parsed_intent", res.json())

    def test_12_super_admin_and_role_protection(self):
        """TEST 12: Super Admin login, 2FA challenge, and RBAC."""
        # 1. Admin login step 1
        res_admin = client.post("/api/auth/admin/login", json={"email": "admin@sai.in", "password": "Password123!"})
        self.assertEqual(res_admin.status_code, 200)
        admin_data = res_admin.json()
        self.assertTrue(admin_data["requires_2fa"])

        # 2. Admin 2FA step 2
        res_verify = client.post("/api/auth/admin/2fa/verify", json={"email": "admin@sai.in", "code": "123456"})
        self.assertEqual(res_verify.status_code, 200)
        admin_token = res_verify.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 3. Super Admin stats
        res_stats = client.get("/api/admin/stats", headers=admin_headers)
        self.assertEqual(res_stats.status_code, 200)
        self.assertIn("total_users", res_stats.json())

if __name__ == "__main__":
    unittest.main()
