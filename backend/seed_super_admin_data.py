import os
import sys
from datetime import datetime, timezone, timedelta

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole, BuyerProfile, SellerProfile, AgentProfile, BuilderProfile
from app.models.property import Property
from app.models.verification import VerificationDocument
from app.models.rera import RERARegistration
from app.models.complaint import Complaint
from app.models.cms import WebsiteBanner, PlatformAnnouncement, PlatformFAQ, PropertyCategory
from app.models.settings import SystemSetting
from app.models.audit_log import AuditLog
from app.models.search_history import SearchHistory
from app.models.chat_log import ChatLog

def seed_super_admin_ecosystem():
    print("[*] Ensuring all Super Admin tables exist...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        pw_hash = get_password_hash("Password123!")

        # 1. Super Admin User
        admin = db.query(User).filter(User.email == "admin@sai.in").first()
        if not admin:
            admin = User(
                name="Super Admin",
                email="admin@sai.in",
                phone="+91 20 6700 8900",
                password_hash=pw_hash,
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                is_totp_enabled=False
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("[+] Created Super Admin: admin@sai.in")

        # 2. Buyers
        buyers_data = [
            ("Vikramaditya Sharma", "vikram.sharma@gmail.com", "+91 98220 45192", "Pune", 3, 18000000),
            ("Ananya Deshpande", "ananya.d@outlook.com", "+91 97654 33219", "Pune", 2, 9500000),
            ("Rahul Singhania", "singhania.rahul@corporate.in", "+91 98901 88412", "Mumbai", 4, 45000000),
            ("Pooja Hegde", "pooja.hegde@techcorp.com", "+91 98231 66720", "Bangalore", 3, 22000000),
            ("Arjun K. Nair", "arjun.nair@innovate.co", "+91 99401 22910", "Pune", 2, 7500000),
            ("Sneha Kulkarni", "sneha.kulkarni@gmail.com", "+91 94220 77199", "Pune", 3, 16000000),
        ]
        created_buyers = []
        for name, email, phone, city, bhk, budget in buyers_data:
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(name=name, email=email, phone=phone, password_hash=pw_hash, role=UserRole.BUYER, is_active=True)
                db.add(u)
                db.commit()
                db.refresh(u)
                db.add(BuyerProfile(user_id=u.id, preferred_city=city, preferred_bhk=bhk, budget_max=budget))
                db.commit()
            created_buyers.append(u)
        print(f"[+] Ensured {len(created_buyers)} Buyers")

        # 3. Owners / Sellers
        owners_data = [
            ("Rameshwar Patil", "ramesh.patil@patilholdings.in", "+91 98221 44001", "Patil Realties & Holdings", "AAECP4921K"),
            ("Sunita Agarwal", "sunita.agarwal@agarwalgroup.com", "+91 98230 11984", "Agarwal Assets Pvt Ltd", "BHKPA8192L"),
            ("Harishchand Rao", "h.rao.pune@gmail.com", "+91 94225 33021", "Individual Owner", "CKYPR9011J"),
            ("Deepak Chawla", "deepak.chawla@mumbairealty.in", "+91 98200 77123", "Chawla Estates LLP", "AAFFC3819Q"),
            ("Kavita Shinde", "kavita.shinde@shindeproperties.in", "+91 98222 89012", "Shinde Heritage Holdings", "APOPS6612R"),
        ]
        created_owners = []
        for name, email, phone, comp, pan in owners_data:
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(name=name, email=email, phone=phone, password_hash=pw_hash, role=UserRole.SELLER, is_active=True)
                db.add(u)
                db.commit()
                db.refresh(u)
                db.add(SellerProfile(user_id=u.id, company_name=comp, pan_number=pan))
                db.commit()
            created_owners.append(u)
        print(f"[+] Ensured {len(created_owners)} Owners")

        # 4. Agents
        agents_data = [
            ("Priya Patel", "priya.patel@saiprime.in", "+91 98765 43210", "Sai Prime Realtors", "MH-AG-2026-881", "RERA-MH-99214", 7, 4.9),
            ("Vikram Malhotra", "vikram.m@apexrealty.in", "+91 98220 19823", "Apex Realty Consultancy", "MH-AG-2025-412", "RERA-MH-44120", 11, 4.8),
            ("Sanjay Joshi", "sanjay.joshi@metroedge.com", "+91 97640 22109", "Metro Edge Estates", "MH-AG-2026-104", "RERA-MH-77312", 5, 4.7),
            ("Ritu Sethi", "ritu.sethi@elitehorizon.in", "+91 98201 66543", "Elite Horizon Brokers", "MH-AG-2024-903", "RERA-MH-33890", 9, 4.9),
            ("Kiran More", "kiran.more@puneconsultants.in", "+91 94223 88120", "Pune Prime Consultant Group", "MH-AG-2026-559", "RERA-MH-Pending", 3, 4.6),
        ]
        created_agents = []
        for name, email, phone, agency, lic, rera_no, exp, rating in agents_data:
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(name=name, email=email, phone=phone, password_hash=pw_hash, role=UserRole.AGENT, is_active=True)
                db.add(u)
                db.commit()
                db.refresh(u)
                db.add(AgentProfile(
                    user_id=u.id, agency_name=agency, license_number=lic, rera_id=rera_no,
                    experience_years=exp, rating=rating, verification_status="VERIFIED"
                ))
                db.commit()
            created_agents.append(u)
        print(f"[+] Ensured {len(created_agents)} Agents")

        # 5. Builders
        builders_data = [
            ("Godrej Properties Ltd", "sales@godrejproperties.com", "+91 22 6169 8500", "Godrej Properties Ltd", "Godrej One, Vikhroli, Mumbai", "DEV-REG-1088", "MAHARERA-B-991204"),
            ("Prestige Landmarks", "support@prestigelandmarks.in", "+91 20 6712 3400", "Prestige Landmarks", "Prestige Tower, Senapati Bapat Road, Pune", "DEV-REG-552", "MAHARERA-B-441029"),
            ("Kolte-Patil Developers", "connect@koltepatil.com", "+91 20 6622 6500", "Kolte-Patil Developers Ltd", "City Point, Dhole Patil Road, Pune", "DEV-REG-2419", "MAHARERA-B-772910"),
            ("Panchshil Realty", "luxury@panchshil.com", "+91 20 6647 3200", "Panchshil Realty", "Tech Park One, Yerwada, Pune", "DEV-REG-3102", "MAHARERA-B-883921"),
            ("Rohan Builders", "info@rohanbuilders.com", "+91 20 7101 7101", "Rohan Builders & Developers", "Modi Baug, Shivaji Nagar, Pune", "DEV-REG-4901", "MAHARERA-B-552014"),
        ]
        created_builders = []
        for name, email, phone, comp, addr, reg_no, rera_no in builders_data:
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(name=name, email=email, phone=phone, password_hash=pw_hash, role=UserRole.BUILDER, is_active=True)
                db.add(u)
                db.commit()
                db.refresh(u)
                db.add(BuilderProfile(
                    user_id=u.id, company_name=comp, office_address=addr,
                    developer_registration_no=reg_no, rera_id=rera_no, verification_status="VERIFIED"
                ))
                db.commit()
            created_builders.append(u)
        print(f"[+] Ensured {len(created_builders)} Builders")

        # 6. Verification Documents
        if db.query(VerificationDocument).count() == 0:
            docs = [
                VerificationDocument(user_id=created_agents[0].id, account_type="agent", document_type="rera_certificate", file_name="MahaRERA_Broker_A52100099214.pdf", file_path="/uploads/docs/m1.pdf", mime_type="application/pdf", file_size=142000, status="VERIFIED"),
                VerificationDocument(user_id=created_builders[0].id, account_type="builder", document_type="project_sanction", file_name="PMC_Sanction_Plan_Godrej_Infinity.pdf", file_path="/uploads/docs/m2.pdf", mime_type="application/pdf", file_size=489000, status="VERIFIED"),
                VerificationDocument(user_id=created_owners[1].id, account_type="owner", document_type="pan_card", file_name="PAN_Card_Corporate_Agarwal_Assets.pdf", file_path="/uploads/docs/m3.pdf", mime_type="application/pdf", file_size=89000, status="VERIFIED"),
                VerificationDocument(user_id=created_agents[4].id, account_type="agent", document_type="broker_license", file_name="Pune_Broker_Registration_2026.pdf", file_path="/uploads/docs/m4.pdf", mime_type="application/pdf", file_size=112000, status="PENDING"),
                VerificationDocument(user_id=created_buyers[2].id, account_type="buyer", document_type="aadhaar_card", file_name="Aadhaar_Front_Back_Masked.pdf", file_path="/uploads/docs/m5.pdf", mime_type="application/pdf", file_size=75000, status="UNDER_REVIEW"),
            ]
            db.add_all(docs)
            db.commit()
            print(f"[+] Seeded {len(docs)} Verification Documents")

        # 7. RERA Registrations
        if db.query(RERARegistration).count() == 0:
            reras = [
                RERARegistration(rera_number="P52100003129", project_name="Godrej Infinity Phase 2 & 3", promoter_name="Godrej Properties Ltd", state="Maharashtra", district="Pune", project_type="Residential & Retail", status="REGISTERED", verification_status="VERIFIED", verified_at=datetime.now(timezone.utc)),
                RERARegistration(rera_number="P52100018902", project_name="Prestige High Fields Residences", promoter_name="Prestige Landmarks", state="Maharashtra", district="Pune", project_type="Luxury Villas & Apartments", status="REGISTERED", verification_status="VERIFIED", verified_at=datetime.now(timezone.utc)),
                RERARegistration(rera_number="P52100017116", project_name="Life Republic Sector R9", promoter_name="Kolte-Patil Developers Ltd", state="Maharashtra", district="Pune", project_type="Integrated Township", status="REGISTERED", verification_status="VERIFIED", verified_at=datetime.now(timezone.utc)),
                RERARegistration(rera_number="P52100002819", project_name="Panchshil Towers Tower A to E", promoter_name="Panchshil Realty", state="Maharashtra", district="Pune", project_type="High-Rise Luxury Residential", status="REGISTERED", verification_status="VERIFIED", verified_at=datetime.now(timezone.utc)),
                RERARegistration(rera_number="P51900001339", project_name="Lodha Park Central Towers", promoter_name="Macrotech Developers Ltd", state="Maharashtra", district="Mumbai Suburban", project_type="High-End Residential", status="REGISTERED", verification_status="VERIFIED", verified_at=datetime.now(timezone.utc)),
            ]
            db.add_all(reras)
            db.commit()
            print(f"[+] Seeded {len(reras)} RERA Registrations")

        # 8. Complaints
        if db.query(Complaint).count() == 0:
            comps = [
                Complaint(user_id=created_buyers[0].id, category="Listing Discrepancy", subject="Carpet area discrepancy in Baner 3BHK listing", description="Listing states 1450 sqft carpet area, but actual sanction floor plan shows 1180 sqft RERA carpet.", priority="HIGH", status="OPEN", internal_notes="Requested architect verification."),
                Complaint(user_id=created_buyers[1].id, category="Broker Conduct", subject="Agent requested unverified cash token upfront", description="Broker asked for ₹25,000 cash before site inspection without invoice.", priority="MEDIUM", status="UNDER_REVIEW", internal_notes="Compliance notice issued."),
                Complaint(user_id=created_buyers[2].id, category="Delayed Possession", subject="Possession delayed past RERA timeline", description="Developer missed Q2 handover without notifying buyer.", priority="HIGH", status="RESOLVED", internal_notes="Developer provided Revised Date certificate.", resolution="Compensation interest credited to buyer account."),
            ]
            db.add_all(comps)
            db.commit()
            print(f"[+] Seeded {len(comps)} Complaints")

        # 9. Website Banners
        if db.query(WebsiteBanner).count() == 0:
            banners = [
                WebsiteBanner(title="Pune Metro Line 3 Transit Corridor Homes", subtitle="Explore premium RERA verified residential apartments along Hinjewadi-Shivajinagar Metro", image_url="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80", target_url="/search?metro=line3", badge_text="Festive Launch Offers", is_active=True, display_order=1),
                WebsiteBanner(title="Zero Brokerage Direct Owner Verified Listings", subtitle="Save 100% on brokerage fees with verified Title & Index II legal checks", image_url="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80", target_url="/search?direct_owner=true", badge_text="Verified Owners Only", is_active=True, display_order=2),
                WebsiteBanner(title="MahaRERA Registered Mega Townships 2026", subtitle="Integrated self-sustaining townships with international schools, malls & clubhouses", image_url="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80", target_url="/townships", badge_text="Exclusive Alliances", is_active=True, display_order=3),
            ]
            db.add_all(banners)
            db.commit()
            print(f"[+] Seeded {len(banners)} Website Banners")

        # 10. Platform Announcements
        if db.query(PlatformAnnouncement).count() == 0:
            announcements = [
                PlatformAnnouncement(title="Statutory MahaRERA Q3 Mandatory Disclosure Notice", message="All registered builders must upload quarterly audit reports before October 31st.", type="WARNING", target_role="builder", is_active=True),
                PlatformAnnouncement(title="Diwali Property Festival 2026 Announced", message="Special spotlight placement and zero transaction fees for listings with 3D Virtual Tours.", type="SUCCESS", target_role="all", is_active=True),
                PlatformAnnouncement(title="Scheduled System Infrastructure Maintenance", message="Scheduled database maintenance Sunday 2:00 AM - 3:30 AM IST.", type="INFO", target_role="all", is_active=True),
            ]
            db.add_all(announcements)
            db.commit()
            print(f"[+] Seeded {len(announcements)} Announcements")

        # 11. FAQs
        if db.query(PlatformFAQ).count() == 0:
            faqs = [
                PlatformFAQ(category="Verification & Legal", question="How does SAI verify MahaRERA registration numbers?", answer="Our autonomous verification engine cross-references registered project IDs directly with the statutory MahaRERA public portal API."),
                PlatformFAQ(category="Buyer Protection", question="What is the SAI 100% Genuine Listing Guarantee?", answer="Every property marked with the green SAI Verified badge has completed mandatory title search verification and Index II scrutiny."),
                PlatformFAQ(category="AI Assistant", question="Which languages does the Qwen AI property advisor support?", answer="SAI conversational AI natively supports 8 Indic languages including Marathi, Hindi, English, Gujarati, Telugu, Tamil, Kannada, and Bengali."),
            ]
            db.add_all(faqs)
            db.commit()
            print(f"[+] Seeded {len(faqs)} FAQs")

        # 12. Property Categories
        if db.query(PropertyCategory).count() == 0:
            cats = [
                PropertyCategory(name="Luxury Apartments", slug="apartments", description="Gated community flats with clubhouse and amenities"),
                PropertyCategory(name="Independent Villas", slug="villas", description="Private bungalows and gated row houses"),
                PropertyCategory(name="Penthouse Suites", slug="penthouses", description="Top-floor sky residences with panoramic views"),
                PropertyCategory(name="Commercial Offices", slug="commercial", description="Grade-A tech parks and retail spaces"),
                PropertyCategory(name="Residential NA Plots", slug="plots", description="Collector sanctioned clear-title residential land"),
            ]
            db.add_all(cats)
            db.commit()
            print(f"[+] Seeded {len(cats)} Categories")

        # 13. Audit Logs
        if db.query(AuditLog).count() == 0:
            logs = [
                AuditLog(user_id=admin.id, action="PROPERTY_APPROVED", entity_type="property", entity_id="1", ip_address="127.0.0.1", details={"property_title": "Godrej Infinity 3BHK"}),
                AuditLog(user_id=admin.id, action="KYC_VERIFIED", entity_type="user", entity_id=str(created_buyers[0].id), ip_address="127.0.0.1", details={"kyc_type": "Aadhaar + PAN"}),
                AuditLog(user_id=admin.id, action="AGENT_VERIFICATION_UPDATED", entity_type="agent", entity_id=str(created_agents[0].id), ip_address="127.0.0.1", details={"agency": "Sai Prime Realtors"}),
                AuditLog(user_id=admin.id, action="ADMIN_LOGIN_SUCCESS", entity_type="admin_auth", entity_id=str(admin.id), ip_address="127.0.0.1", details={"auth_mode": "TOTP 2FA"}),
            ]
            db.add_all(logs)
            db.commit()
            print(f"[+] Seeded {len(logs)} Audit Logs")

        print("[SUCCESS] Complete Super Admin Database Seeding successfully completed!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_super_admin_ecosystem()
