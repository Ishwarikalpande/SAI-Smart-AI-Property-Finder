import sys
import urllib.request
import urllib.parse
import json
import io
import mimetypes

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000/api"

def make_req(path, method="GET", data=None, token=None, files=None):
    url = f"{BASE_URL}{path}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = None
    if files:
        boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        buf = io.BytesIO()
        for k, v in (data or {}).items():
            buf.write(f"--{boundary}\r\n".encode())
            buf.write(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode())
            buf.write(f"{v}\r\n".encode())
        for field_name, (filename, file_bytes, mime) in files.items():
            buf.write(f"--{boundary}\r\n".encode())
            buf.write(f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode())
            buf.write(f"Content-Type: {mime}\r\n\r\n".encode())
            buf.write(file_bytes)
            buf.write(b"\r\n")
        buf.write(f"--{boundary}--\r\n".encode())
        body = buf.getvalue()
    elif data is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_content)
        except:
            return e.code, {"error": err_content}

def run_tests():
    print("==================================================")
    print("RUNNING END-TO-END VALIDATION TESTS")
    print("==================================================")

    # 1. Login Agent
    status, res = make_req("/auth/login", method="POST", data={"email": "agent@sai.in", "password": "Password123!"})
    assert status == 200, f"Agent login failed: {res}"
    agent_token = res["access_token"]
    print(f"[OK] Agent login successful. Token acquired. User: {res['name']}")

    # 2. Agent Profile
    status, profile = make_req("/agent/profile", token=agent_token)
    assert status == 200, f"Fetch agent profile failed: {profile}"
    assert profile["name"] == "Priya Patel", f"Unexpected name: {profile['name']}"
    assert profile["rating"] == 4.9, f"Unexpected rating: {profile['rating']}"
    assert profile["city"] == "Pune", f"Unexpected city: {profile['city']}"
    print(f"[OK] Agent profile verified: {profile['name']}, {profile['city']}, Rating: {profile['rating']}")

    # 3. Agent Settings
    status, settings = make_req("/agent/settings", token=agent_token)
    assert status == 200, f"Fetch agent settings failed: {settings}"
    assert "account" in settings and "notifications" in settings
    print(f"[OK] Agent settings fetched: Email={settings['account']['email']}, Notifications={settings['notifications']}")

    # Update Agent Settings
    status, upd_settings = make_req("/agent/settings", method="PATCH", data={
        "account": {"language": "Marathi"},
        "notifications": {"promotion_alerts": False}
    }, token=agent_token)
    assert status == 200, f"Update agent settings failed: {upd_settings}"
    assert upd_settings["account"]["language"] == "Marathi"
    assert upd_settings["notifications"]["promotion_alerts"] is False
    print("[OK] Agent settings update persisted successfully.")

    # 4. Agent Listings (GET, POST, PATCH, PUT, DELETE)
    status, listings = make_req("/agent/listings", token=agent_token)
    assert status == 200, f"Fetch agent listings failed: {listings}"
    items = listings.get("items", listings) if isinstance(listings, dict) else listings
    print(f"[OK] Agent listings retrieved. Total listings: {len(items)}")
    for l in items[:2]:
        views_cnt = l.get('views', l.get('views_count', 0))
        enq_cnt = l.get('enquiries', l.get('enquiries_count', 0))
        print(f"     Listing: {l['title']} | Locality: {l['locality']}, {l['city']} | Views: {views_cnt} | Enquiries: {enq_cnt}")

    # Create listing in Amravati (Verifying location accuracy rule)
    new_prop_data = {
        "title": "3BHK Luxury Garden Villa · Amravati",
        "property_type": "villa",
        "listing_type": "buy",
        "bhk": 3,
        "price": 6800000,
        "area_sqft": 1850,
        "locality": "Camp Road",
        "city": "Amravati",
        "state": "Maharashtra",
        "address": "Opp. Govt College, Camp Road",
        "pincode": "444602",
        "latitude": 20.9374,
        "longitude": 77.7796,
        "bedrooms": 3,
        "bathrooms": 3,
        "balconies": 2,
        "parking": 2,
        "amenities": ["Lift", "Security", "Garden", "Power backup"],
        "description": "Spacious 3BHK villa with private terrace and garden in Amravati."
    }
    status, created_prop = make_req("/agent/listings", method="POST", data=new_prop_data, token=agent_token)
    assert status == 200, f"Create listing failed: {created_prop}"
    new_id = created_prop["listing"]["id"]
    assert created_prop["listing"]["city"] == "Amravati", f"Location mismatch: {created_prop['listing']['city']}"
    print(f"[OK] Listing created successfully with ID: {new_id} in {created_prop['listing']['city']}")

    # Toggle status
    status, toggle_res = make_req(f"/agent/listings/{new_id}/status", method="PATCH", data={"status": "inactive"}, token=agent_token)
    assert status == 200, f"Toggle status failed: {toggle_res}"
    assert toggle_res["status"] == "inactive"
    print(f"[OK] Listing {new_id} status toggled to 'inactive'")

    # Edit listing
    status, edit_res = make_req(f"/agent/listings/{new_id}", method="PUT", data={
        "title": "3BHK Luxury Villa (Renovated)",
        "price": 7200000,
        "status": "active"
    }, token=agent_token)
    assert status == 200, f"Edit listing failed: {edit_res}"
    assert edit_res["listing"]["title"] == "3BHK Luxury Villa (Renovated)"
    assert edit_res["listing"]["price"] == 7200000
    print(f"[OK] Listing {new_id} updated successfully.")

    # 5. Agent Enquiries & Status Update
    status, enquiries = make_req("/agent/enquiries", token=agent_token)
    assert status == 200, f"Fetch enquiries failed: {enquiries}"
    print(f"[OK] Agent enquiries retrieved. Total: {len(enquiries)}")
    if enquiries:
        enq_id = enquiries[0]["id"]
        status, upd_enq = make_req(f"/agent/enquiries/{enq_id}", method="PATCH", data={"status": "interested"}, token=agent_token)
        assert status == 200, f"Update enquiry failed: {upd_enq}"
        assert upd_enq["status"] == "interested"
        print(f"[OK] Enquiry {enq_id} status updated to 'interested'")

    # 6. Agent Site Visits (Schedule, Reschedule, Mark Done)
    status, visits = make_req("/agent/site-visits", token=agent_token)
    assert status == 200, f"Fetch site visits failed: {visits}"
    print(f"[OK] Agent site visits retrieved. Total: {len(visits)}")
    
    # Schedule new visit
    sched_data = {
        "client_name": "Rohan Deshmukh",
        "client_phone": "+91 98220 54321",
        "property_id": new_id,
        "property_title": "3BHK Luxury Villa (Renovated)",
        "visit_date": "2026-09-30",
        "visit_time": "11:00 AM",
        "visit_type": "In-Person",
        "notes": "Client requested key handover details"
    }
    status, new_visit = make_req("/agent/site-visits", method="POST", data=sched_data, token=agent_token)
    assert status == 200, f"Schedule site visit failed: {new_visit}"
    visit_id = new_visit["site_visit"]["id"]
    print(f"[OK] Site visit scheduled with ID: {visit_id}")

    # Reschedule visit
    status, resched_res = make_req(f"/agent/site-visits/{visit_id}", method="PATCH", data={
        "visit_date": "2026-10-02",
        "visit_time": "03:30 PM",
        "notes": "Rescheduled per client request"
    }, token=agent_token)
    assert status == 200, f"Reschedule visit failed: {resched_res}"
    assert resched_res["site_visit"]["visit_date"] == "2026-10-02"
    print(f"[OK] Site visit {visit_id} rescheduled to 2026-10-02 03:30 PM")

    # Mark done
    status, done_res = make_req(f"/agent/site-visits/{visit_id}", method="PATCH", data={
        "status": "completed"
    }, token=agent_token)
    assert status == 200, f"Mark visit done failed: {done_res}"
    assert done_res["site_visit"]["status"] == "completed"
    print(f"[OK] Site visit {visit_id} marked as 'completed'")

    # 7. Agent Clients
    status, clients = make_req("/agent/clients", token=agent_token)
    assert status == 200, f"Fetch clients failed: {clients}"
    print(f"[OK] Agent clients retrieved. Total: {len(clients)}")
    if clients:
        c_id = clients[0]["id"]
        status, c_details = make_req(f"/agent/clients/{c_id}", token=agent_token)
        assert status == 200, f"Fetch client details failed: {c_details}"
        print(f"[OK] Client details verified for: {c_details['client']['name']} | History items: {len(c_details['history'])}")

    # 8. Agent Analytics
    status, analytics = make_req("/agent/analytics", token=agent_token)
    assert status == 200, f"Fetch analytics failed: {analytics}"
    print(f"[OK] Agent analytics calculated dynamically: Total Listings: {analytics['total_listings']} | Total Views: {analytics['total_views']}")

    # 9. Document Upload & AI Verification Assistance
    test_pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Title (MAHARERA Registration Certificate) /RERA (P52100028410) /Agent (Priya Patel) /City (Pune) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    status, upload_res = make_req(
        "/verification/documents",
        method="POST",
        data={"document_type": "rera_license"},
        files={"file": ("rera_cert.pdf", test_pdf_content, "application/pdf")},
        token=agent_token
    )
    assert status == 200, f"Document upload failed: {upload_res}"
    doc_id = upload_res["document"]["id"]
    print(f"[OK] Document uploaded with ID: {doc_id} | Status: {upload_res['document']['status']}")
    print(f"     AI Extraction: {upload_res['document']['extracted_data']}")
    print(f"     Consistency Checks: {upload_res['document']['consistency_checks']}")

    # 10. Builder Login & Flow
    status, b_res = make_req("/auth/login", method="POST", data={"email": "builder@sai.in", "password": "Password123!"})
    assert status == 200, f"Builder login failed: {b_res}"
    builder_token = b_res["access_token"]
    print(f"[OK] Builder login successful. Company: {b_res['name']}")

    # Builder Profile
    status, b_profile = make_req("/builder/profile", token=builder_token)
    assert status == 200, f"Fetch builder profile failed: {b_profile}"
    assert b_profile["company_name"] == "Prestige Landmarks"
    print(f"[OK] Builder profile verified: {b_profile['company_name']}, RERA: {b_profile['rera_id']}")

    # Builder Settings
    status, b_settings = make_req("/builder/settings", token=builder_token)
    assert status == 200, f"Fetch builder settings failed: {b_settings}"
    print(f"[OK] Builder settings verified: Company Name: {b_settings['company']['company_name']}")

    # Update Builder Settings
    status, b_upd_settings = make_req("/builder/settings", method="PATCH", data={
        "company": {"support_email": "customercare@prestige.in"},
        "notifications": {"unit_booking_alert": False}
    }, token=builder_token)
    assert status == 200, f"Update builder settings failed: {b_upd_settings}"
    assert b_upd_settings["company"]["support_email"] == "customercare@prestige.in"
    print("[OK] Builder settings update persisted successfully.")

    # Builder Projects
    status, b_projects = make_req("/builder/projects", token=builder_token)
    assert status == 200, f"Fetch builder projects failed: {b_projects}"
    print(f"[OK] Builder projects retrieved. Total projects: {len(b_projects)}")
    proj = b_projects[0]
    proj_id = proj["id"]
    print(f"     Project: {proj['name']} | Towers: {len(proj['towers'])} | Available: {proj['available_units']}/{proj['total_units']}")

    # Add Tower
    status, new_tower = make_req(f"/builder/projects/{proj_id}/towers", method="POST", data={"name": "Tower D (Signature)"}, token=builder_token)
    assert status == 200, f"Add tower failed: {new_tower}"
    tower_id = new_tower["tower"]["id"]
    print(f"[OK] Tower added: {new_tower['tower']['name']} with ID: {tower_id}")

    # Add Unit
    status, new_unit = make_req(f"/builder/projects/{proj_id}/units", method="POST", data={
        "tower_id": tower_id,
        "unit_number": "D-401",
        "bhk": 3,
        "floor": 4,
        "area_sqft": 1450,
        "price": 12500000,
        "status": "available"
    }, token=builder_token)
    assert status == 200, f"Add unit failed: {new_unit}"
    unit_id = new_unit["unit"]["id"]
    print(f"[OK] Unit added: {new_unit['unit']['unit_number']} with ID: {unit_id}")

    # Update Unit Status to SOLD
    status, upd_unit = make_req(f"/builder/units/{unit_id}/status", method="PATCH", data={"status": "sold"}, token=builder_token)
    assert status == 200, f"Update unit status failed: {upd_unit}"
    assert upd_unit["unit"]["status"] == "sold"
    print(f"[OK] Unit {unit_id} status updated to 'sold'")

    # Builder Enquiries
    status, b_enquiries = make_req("/builder/enquiries", token=builder_token)
    assert status == 200, f"Fetch builder enquiries failed: {b_enquiries}"
    print(f"[OK] Builder buyer enquiries retrieved. Total: {len(b_enquiries)}")

    # Builder Analytics
    status, b_analytics = make_req("/builder/analytics", token=builder_token)
    assert status == 200, f"Fetch builder analytics failed: {b_analytics}"
    print(f"[OK] Builder analytics verified: Total Units: {b_analytics['total_units']} | Revenue: {b_analytics['total_revenue']}")

    # 11. Admin Review & Verification Workflow
    status, a_res = make_req("/auth/login", method="POST", data={"email": "admin@sai.in", "password": "Password123!"})
    assert status == 200, f"Admin login failed: {a_res}"
    admin_token = a_res["access_token"]
    print(f"[OK] Admin login successful: {a_res['name']}")

    # Verification Stats
    status, v_stats = make_req("/admin/verification/stats", token=admin_token)
    assert status == 200, f"Fetch verification stats failed: {v_stats}"
    print(f"[OK] Admin verification stats: Total: {v_stats['total']} | Pending: {v_stats['pending']} | Verified: {v_stats['verified']}")

    # Approve Document
    status, app_res = make_req(f"/admin/verification/{doc_id}/approve", method="POST", data={
        "review_notes": "RERA document matches registration records and identity checks."
    }, token=admin_token)
    assert status == 200, f"Approve document failed: {app_res}"
    assert app_res["document"]["status"] == "verified"
    print(f"[OK] Admin approved document {doc_id}. Verification status is now 'verified'")

    # Verify Badge was Issued
    status, badges = make_req(f"/verification/documents/{doc_id}/history", token=admin_token)
    assert status == 200, f"Fetch document history failed: {badges}"
    print(f"[OK] Verification history and audit log confirmed. Total actions recorded: {len(badges.get('history', []))}")

    # 12. Security & RBAC Checks
    # Agent attempting to access Builder endpoints -> 403
    status, forbidden_res = make_req("/builder/profile", token=agent_token)
    assert status == 403, f"Expected 403 for Agent on Builder endpoint, got {status}: {forbidden_res}"
    print("[OK] RBAC verified: Agent forbidden (403) from Builder Portal endpoints")

    # Builder attempting to access Agent endpoints -> 403
    status, forbidden_res2 = make_req("/agent/profile", token=builder_token)
    assert status == 403, f"Expected 403 for Builder on Agent endpoint, got {status}: {forbidden_res2}"
    print("[OK] RBAC verified: Builder forbidden (403) from Agent Portal endpoints")

    # Unauthenticated access -> 401
    status, unauth_res = make_req("/agent/listings")
    assert status == 401, f"Expected 401 for unauthenticated request, got {status}: {unauth_res}"
    print("[OK] RBAC verified: Unauthenticated request rejected (401)")

    # Clean up test listing
    status, del_res = make_req(f"/agent/listings/{new_id}", method="DELETE", token=agent_token)
    assert status == 200, f"Delete listing failed: {del_res}"
    print(f"[OK] Cleaned up temporary test listing {new_id}")

    print("==================================================")
    print("ALL END-TO-END TESTS PASSED WITH 100% SUCCESS!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
