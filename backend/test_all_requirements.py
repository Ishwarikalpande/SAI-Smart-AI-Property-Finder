import httpx
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000/api"
client = httpx.Client(timeout=15.0)

def run_tests():
    print("=" * 60)
    print("SAI SMART AI URBAN SYSTEM - FULL END-TO-END VALIDATION SUITE")
    print("=" * 60)

    # -------------------------------------------------------------
    # 1. AGENT AUTHENTICATION & TESTS
    # -------------------------------------------------------------
    print("\n--- [1] AGENT WORKFLOW TEST ---")
    agent_login_res = client.post(f"{BASE_URL}/auth/login", json={"email": "agent@sai.in", "password": "Password123!"})
    if agent_login_res.status_code != 200:
        print(f"[FAIL] Agent login failed: {agent_login_res.status_code} - {agent_login_res.text}")
        return False
    agent_token = agent_login_res.json()["access_token"]
    agent_headers = {"Authorization": f"Bearer {agent_token}"}
    print("[PASS] Agent Login successful.")

    # A1. Agent Profile / Me
    me_res = client.get(f"{BASE_URL}/auth/me", headers=agent_headers)
    assert me_res.status_code == 200
    agent_user = me_res.json()
    print(f"[PASS] Agent Auth: id={agent_user['id']}, email={agent_user['email']}, role={agent_user['role']}")

    # A2. Agent Listings
    listings_res = client.get(f"{BASE_URL}/agent/listings", headers=agent_headers)
    assert listings_res.status_code == 200
    listings_data = listings_res.json()
    listings = listings_data if isinstance(listings_data, list) else listings_data.get("data", [])
    print(f"[PASS] Agent Listings: {len(listings)} listings found (Array type safe).")

    # A3. Agent Enquiries & Status Update
    enq_res = client.get(f"{BASE_URL}/agent/enquiries", headers=agent_headers)
    assert enq_res.status_code == 200
    enquiries_data = enq_res.json()
    enquiries = enquiries_data if isinstance(enquiries_data, list) else enquiries_data.get("data", [])
    print(f"[PASS] Agent Enquiries: {len(enquiries)} enquiries found.")
    
    if len(enquiries) > 0:
        target_enq_id = enquiries[0]["id"]
        patch_res = client.patch(
            f"{BASE_URL}/agent/enquiries/{target_enq_id}/status",
            headers=agent_headers,
            json={"status": "Contacted"}
        )
        assert patch_res.status_code == 200, f"Failed updating enquiry status: {patch_res.text}"
        print(f"[PASS] Agent Enquiry status successfully updated to 'Contacted' in PostgreSQL/SQLite.")

    # A4. Agent Clients (Real DB connection)
    clients_res = client.get(f"{BASE_URL}/agent/clients", headers=agent_headers)
    assert clients_res.status_code == 200
    clients_data = clients_res.json()
    clients = clients_data if isinstance(clients_data, list) else clients_data.get("data", [])
    print(f"[PASS] Agent Clients: {len(clients)} clients derived from real database records.")
    if len(clients) > 0:
        c = clients[0]
        print(f"       Client: {c.get('name')}, Email: {c.get('email')}, Lead Status: {c.get('lead_status')}")
        # Test lead status update
        client_patch = client.patch(
            f"{BASE_URL}/agent/clients/{c['id']}/status",
            headers=agent_headers,
            json={"status": "Negotiation"}
        )
        assert client_patch.status_code == 200
        print(f"[PASS] Agent Client lead status updated to 'Negotiation' and persisted.")

    # A5. Agent Site Visits
    visits_res = client.get(f"{BASE_URL}/agent/site-visits", headers=agent_headers)
    assert visits_res.status_code == 200
    visits_data = visits_res.json()
    visits = visits_data if isinstance(visits_data, list) else visits_data.get("data", [])
    print(f"[PASS] Agent Site Visits: {len(visits)} site visits.")

    # A6. Agent Verification Documents (Check root cause of verificationDocs.map)
    docs_res = client.get(f"{BASE_URL}/verification/my-documents", headers=agent_headers)
    assert docs_res.status_code == 200
    docs_data = docs_res.json()
    assert isinstance(docs_data, list), f"Expected list from verificationDocs, got {type(docs_data)}"
    print(f"[PASS] Agent Verification Docs: returned valid JSON array with {len(docs_data)} documents.")

    # A7. Agent Conversations & Messages (Check root cause of conversations.map)
    conv_res = client.get(f"{BASE_URL}/chat/conversations", headers=agent_headers)
    assert conv_res.status_code == 200
    conv_data = conv_res.json()
    assert isinstance(conv_data, list), f"Expected list from conversations, got {type(conv_data)}"
    print(f"[PASS] Agent Conversations: returned valid JSON array with {len(conv_data)} conversations.")
    if len(conv_data) > 0:
        conv_id = conv_data[0]["id"]
        msg_res = client.get(f"{BASE_URL}/chat/conversations/{conv_id}/messages", headers=agent_headers)
        assert msg_res.status_code == 200
        msgs = msg_res.json()
        assert isinstance(msgs, list)
        print(f"[PASS] Agent Messages in thread: {len(msgs)} messages.")
        # Send a reply
        send_res = client.post(f"{BASE_URL}/chat/conversations/{conv_id}/messages", headers=agent_headers, json={"content": "Looking forward to meeting you for the property tour!"})
        assert send_res.status_code in [200, 201], f"Send message failed: {send_res.status_code} - {send_res.text}"
        print(f"[PASS] Agent sent message successfully.")

    # A8. Agent Analytics with 7d, 30d, 90d Real Timestamp Queries
    for d in [7, 30, 90]:
        a_res = client.get(f"{BASE_URL}/agent/analytics?days={d}", headers=agent_headers)
        assert a_res.status_code == 200
        adata = a_res.json()
        print(f"[PASS] Agent Analytics ({d}d): Listings={adata.get('total_listings')}, Views={adata.get('total_views')}, Enquiries={adata.get('total_enquiries')}, SiteVisits={adata.get('site_visits')}, Conversion={adata.get('tour_conversion')}%")

    # -------------------------------------------------------------
    # 2. BUILDER WORKFLOW & EXACT TOWER C TEST
    # -------------------------------------------------------------
    print("\n--- [2] BUILDER WORKFLOW & EXACT TOWER C TEST ---")
    builder_login_res = client.post(f"{BASE_URL}/auth/login", json={"email": "builder@sai.in", "password": "Password123!"})
    assert builder_login_res.status_code == 200
    builder_token = builder_login_res.json()["access_token"]
    builder_headers = {"Authorization": f"Bearer {builder_token}"}
    print("[PASS] Builder Login successful.")

    # B1. Builder Projects
    projects_res = client.get(f"{BASE_URL}/builder/projects", headers=builder_headers)
    assert projects_res.status_code == 200
    b_projects = projects_res.json()
    b_proj_list = b_projects if isinstance(b_projects, list) else b_projects.get("data", [])
    print(f"[PASS] Builder Projects: {len(b_proj_list)} projects.")

    sai_proj = next((p for p in b_proj_list if "SAI Smart City Phase 1" in p["name"]), None)
    assert sai_proj is not None, "Project 'SAI Smart City Phase 1' not found!"
    proj_id = sai_proj["id"]
    print(f"[PASS] Found target project 'SAI Smart City Phase 1' (id={proj_id}).")

    # B2. Check Existing Towers (Expect Tower A, Tower B)
    towers_res = client.get(f"{BASE_URL}/builder/projects/{proj_id}/towers", headers=builder_headers)
    assert towers_res.status_code == 200
    towers = towers_res.json()
    tower_names = [t["name"] for t in towers]
    print(f"[PASS] Existing Towers: {tower_names}")

    # B3. ADD TOWER C (10 floors, 4 units/floor = 40 units)
    # Check if Tower C already created in a previous test run, otherwise create it
    tower_c = next((t for t in towers if t["name"] == "Tower C"), None)
    if not tower_c:
        create_tower_payload = {
            "name": "Tower C",
            "code": "C",
            "floors_count": 10,
            "units_per_floor": 4,
            "total_units": 40,
            "status": "Under Construction",
            "description": "Tower C - 10 Floors luxury high-rise"
        }
        create_t_res = client.post(
            f"{BASE_URL}/builder/projects/{proj_id}/towers",
            headers=builder_headers,
            json=create_tower_payload
        )
        assert create_t_res.status_code == 200, f"Create Tower failed: {create_t_res.text}"
        tower_c_resp = create_t_res.json()
        tower_c = tower_c_resp.get("tower", tower_c_resp)
        print(f"[PASS] Successfully created Tower C via POST API: id={tower_c['id']}")
    else:
        print(f"[PASS] Tower C already exists with id={tower_c['id']}")

    tower_c_id = tower_c["id"]

    # B4. Verify Tower C Persistence (Simulate browser refresh by re-fetching towers)
    refresh_towers_res = client.get(f"{BASE_URL}/builder/projects/{proj_id}/towers", headers=builder_headers)
    assert refresh_towers_res.status_code == 200
    updated_towers = refresh_towers_res.json()
    updated_names = [t["name"] for t in updated_towers]
    assert "Tower C" in updated_names, "Tower C failed to persist after refresh!"
    print(f"[PASS] Persistence verified! Towers in project: {updated_names}")

    # B5. Tower C Details & Unit Verification (Must have 40 units)
    c_details_res = client.get(f"{BASE_URL}/builder/projects/{proj_id}/towers/{tower_c_id}", headers=builder_headers)
    assert c_details_res.status_code == 200
    c_details = c_details_res.json()
    c_units = c_details.get("units", [])
    print(f"[PASS] Tower C Details: Floors={c_details.get('floors_count')}, Total Units={len(c_units)}")
    assert len(c_units) == 40, f"Expected 40 units for Tower C, found {len(c_units)}"
    
    # Check unit numbering format: C-101 to C-1004
    sample_unit_numbers = [u["unit_number"] for u in c_units[:4]]
    last_unit_numbers = [u["unit_number"] for u in c_units[-4:]]
    print(f"       Floor 1 Units: {sample_unit_numbers}")
    print(f"       Floor 10 Units: {last_unit_numbers}")
    assert "C-101" in sample_unit_numbers
    assert "C-1004" in last_unit_numbers
    print("[PASS] Exact Tower C units C-101 to C-1004 validated.")

    # B6. Availability & Inventory Filter Test (Part C7)
    # Selecting Tower C must return ONLY Tower C units!
    filtered_units_res = client.get(f"{BASE_URL}/builder/units?project_id={proj_id}&tower_id={tower_c_id}", headers=builder_headers)
    assert filtered_units_res.status_code == 200
    filtered_units = filtered_units_res.json()
    assert len(filtered_units) == 40, f"Expected 40 units when filtering by Tower C, got {len(filtered_units)}"
    for u in filtered_units:
        assert u["tower_id"] == tower_c_id, f"Unit {u['unit_number']} does not belong to Tower C!"
        assert u["unit_number"].startswith("C-"), f"Unit {u['unit_number']} is not a C unit!"
    print(f"[PASS] Availability & Inventory Filter: Tower C selector displays ONLY 40 Tower C units. Zero leakage from Tower A or B.")

    # B7. Builder Promotions (Check root cause of promotions.map)
    promotions_res = client.get(f"{BASE_URL}/builder/promotions", headers=builder_headers)
    assert promotions_res.status_code == 200
    promotions_data = promotions_res.json()
    assert isinstance(promotions_data, list), f"Expected list from builder promotions, got {type(promotions_data)}"
    print(f"[PASS] Builder Promotions: returned valid JSON array with {len(promotions_data)} promotions.")

    # Create new promotion
    new_promo_res = client.post(
        f"{BASE_URL}/builder/promotions",
        headers=builder_headers,
        json={
            "project_id": proj_id,
            "plan_type": "Premium Listing",
            "duration_days": 30,
            "cost": 15000.0
        }
    )
    assert new_promo_res.status_code == 200
    created_promo = new_promo_res.json()
    promo_id = created_promo.get("promotion_id") or created_promo.get("id") or (created_promo.get("promotion", {}).get("id"))
    print(f"[PASS] Successfully created promotion (id={promo_id}).")

    # Update promotion (Pause/Resume)
    patch_promo_res = client.patch(
        f"{BASE_URL}/builder/promotions/{promo_id}",
        headers=builder_headers,
        json={"status": "paused"}
    )
    assert patch_promo_res.status_code == 200
    print(f"[PASS] Successfully updated promotion status to 'paused'.")

    # B8. Builder Buyer Enquiries with Project/Tower/Unit Links (Part D)
    b_enq_res = client.get(f"{BASE_URL}/builder/enquiries", headers=builder_headers)
    assert b_enq_res.status_code == 200
    b_enquiries = b_enq_res.json()
    assert isinstance(b_enquiries, list)
    print(f"[PASS] Builder Buyer Enquiries: {len(b_enquiries)} enquiries with project/tower/unit links.")
    if len(b_enquiries) > 0:
        e = b_enquiries[0]
        print(f"       Buyer: {e.get('buyer_name')}, Project: {e.get('project_name')}, Tower: {e.get('tower_name')}, Budget: {e.get('budget')}")
        # Update enquiry status
        patch_b_enq = client.patch(
            f"{BASE_URL}/builder/enquiries/{e['id']}/status",
            headers=builder_headers,
            json={"status": "Interested"}
        )
        assert patch_b_enq.status_code == 200
        print(f"[PASS] Builder updated enquiry status to 'Interested' in PostgreSQL/SQLite.")

    # B9. Builder Verification Documents
    b_docs_res = client.get(f"{BASE_URL}/verification/my-documents", headers=builder_headers)
    assert b_docs_res.status_code == 200
    b_docs = b_docs_res.json()
    assert isinstance(b_docs, list)
    print(f"[PASS] Builder Verification Documents: {len(b_docs)} documents.")

    # B10. Builder Analytics & Revenue (Part F, G)
    b_analytics_res = client.get(f"{BASE_URL}/builder/analytics", headers=builder_headers)
    assert b_analytics_res.status_code == 200
    b_analytics = b_analytics_res.json()
    print(f"[PASS] Builder Analytics: Projects={b_analytics.get('total_projects')}, Towers={b_analytics.get('total_towers')}, Units={b_analytics.get('total_units')}, Available={b_analytics.get('available_units')}, Sold={b_analytics.get('sold_units')}")

    revenue_res = client.get(f"{BASE_URL}/builder/revenue", headers=builder_headers)
    assert revenue_res.status_code == 200
    rev = revenue_res.json()
    print(f"[PASS] Builder Revenue: Total Sales={rev.get('total_sales')}, Total Revenue=Rs.{rev.get('total_revenue', 0):,}")

    # -------------------------------------------------------------
    # 3. CROSS-ACCOUNT DATA ISOLATION (PART T)
    # -------------------------------------------------------------
    print("\n--- [3] CROSS-ACCOUNT DATA ISOLATION TEST (PART T) ---")
    # Register/Login as a Second Builder (Builder B)
    builder_b_email = "builder_b_test@sai.in"
    reg_b = client.post(f"{BASE_URL}/auth/register", json={
        "email": builder_b_email,
        "password": "Password@123",
        "full_name": "Builder B User",
        "role": "builder",
        "phone": "+919876543219"
    })
    
    login_b_res = client.post(f"{BASE_URL}/auth/login", json={"email": builder_b_email, "password": "Password@123"})
    assert login_b_res.status_code == 200
    builder_b_token = login_b_res.json()["access_token"]
    builder_b_headers = {"Authorization": f"Bearer {builder_b_token}"}
    print("[PASS] Builder B logged in.")

    # Builder B tries to fetch projects -> must NOT see Builder A's projects!
    b2_projects = client.get(f"{BASE_URL}/builder/projects", headers=builder_b_headers).json()
    b2_proj_ids = [p["id"] for p in b2_projects]
    assert proj_id not in b2_proj_ids, f"CRITICAL SECURITY FAIL: Builder B can see Builder A's project {proj_id}!"
    print(f"[PASS] Isolation: Builder B cannot see Builder A's projects ({len(b2_projects)} projects found for Builder B vs Builder A).")

    # Builder B tries to access Builder A's towers directly by ID -> must return 403 or 404!
    b2_tower_access = client.get(f"{BASE_URL}/builder/projects/{proj_id}/towers", headers=builder_b_headers)
    assert b2_tower_access.status_code in [403, 404], f"SECURITY FAIL: Builder B accessed Builder A's towers: {b2_tower_access.status_code}"
    print(f"[PASS] Isolation: Builder B direct request to Builder A's project towers was blocked with {b2_tower_access.status_code} Forbidden/Not Found.")

    # Builder B tries to access Builder A's promotions -> must NOT see them!
    b2_promos = client.get(f"{BASE_URL}/builder/promotions", headers=builder_b_headers).json()
    b2_promo_ids = [p["id"] for p in b2_promos]
    assert promo_id not in b2_promo_ids, "SECURITY FAIL: Builder B can see Builder A's promotion!"
    print(f"[PASS] Isolation: Builder B cannot see Builder A's promotions.")

    # Builder B tries to access Builder A's enquiries -> must NOT see them!
    b2_enqs = client.get(f"{BASE_URL}/builder/enquiries", headers=builder_b_headers).json()
    assert len(b2_enqs) == 0, f"SECURITY FAIL: Builder B saw {len(b2_enqs)} enquiries belonging to Builder A!"
    print(f"[PASS] Isolation: Builder B cannot see Builder A's enquiries.")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = run_tests()
    if not success:
        sys.exit(1)
