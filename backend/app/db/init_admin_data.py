import sys
import os

backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from datetime import datetime, timezone
from app.db.session import SessionLocal
from app.models.settings import SystemSetting
from app.models.cms import WebsiteBanner, PlatformAnnouncement, PlatformFAQ, PropertyCategory
from app.models.rera import RERARegistration
from app.models.complaint import Complaint
from app.models.user import User, UserRole
from app.models.property import Property

def init_admin_defaults():
    db = SessionLocal()
    try:
        # 1. System Settings
        default_settings = [
            ("platform_name", {"value": "Smart AI Property Finder"}, "general", "Platform display name"),
            ("support_email", {"value": "support@sai.in"}, "general", "Customer support email"),
            ("support_phone", {"value": "+91 20 6700 8900"}, "general", "Customer support hotline"),
            ("default_city", {"value": "Pune"}, "general", "Default location filter"),
            ("maintenance_mode", {"value": False}, "general", "Put platform in maintenance mode"),
            ("property_auto_approval", {"value": False}, "verification", "Require admin verification for new properties"),
            ("kyc_mandatory", {"value": True}, "verification", "Enforce KYC for sellers and builders before publishing"),
            ("ai_model", {"value": "qwen2.5:7b"}, "ai", "Active AI model for conversational search"),
            ("ai_max_tokens", {"value": 1024}, "ai", "Token generation limit for conversational assistant"),
            ("ai_temperature", {"value": 0.7}, "ai", "Sampling temperature for AI recommendations"),
            ("max_upload_size_mb", {"value": 15}, "general", "Maximum allowed file upload size in MB"),
        ]

        for key, val, cat, desc in default_settings:
            existing = db.query(SystemSetting).filter(SystemSetting.key == key).first()
            if not existing:
                db.add(SystemSetting(key=key, value=val, category=cat, description=desc))

        # 2. Property Categories
        default_categories = [
            ("Apartments & Flats", "apartments", "Building", "Modern residential flats, studio to 5 BHK", 1),
            ("Luxury Villas", "villas", "Home", "Independent gated community villas & row houses", 2),
            ("Commercial & Offices", "commercial", "Briefcase", "Retail spaces, grade-A corporate offices, IT suites", 3),
            ("Residential Plots", "plots", "MapPin", "NA & RERA approved development plots", 4),
            ("Penthouses", "penthouses", "Crown", "Exclusive top-floor terrace penthouses", 5),
            ("Studio Apartments", "studio", "Layers", "Compact studio spaces near IT parks & universities", 6),
        ]

        for name, slug, icon, desc, order in default_categories:
            existing = db.query(PropertyCategory).filter(PropertyCategory.slug == slug).first()
            if not existing:
                db.add(PropertyCategory(name=name, slug=slug, icon=icon, description=desc, display_order=order, is_active=True))

        # 3. Website Banners
        default_banners = [
            ("Festival Homes 2026", "Exclusive 0% Stamp Duty on Verified Properties in Pune & Mumbai", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200", "/search?badge=AI+Pick", "Festive Offer", 1),
            ("AI-Verified Commercial Spaces", "Explore RERA-approved grade-A commercial spaces in Hinjewadi & BKC", "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200", "/search?type=commercial", "Trending", 2),
        ]

        for title, sub, img, url, badge, order in default_banners:
            existing = db.query(WebsiteBanner).filter(WebsiteBanner.title == title).first()
            if not existing:
                db.add(WebsiteBanner(title=title, subtitle=sub, image_url=img, target_url=url, badge_text=badge, display_order=order, is_active=True))

        # 4. Announcements
        default_announcements = [
            ("New Verification Standard", "All properties are now rigorously verified with MahaRERA registry synchronization.", "INFO", "all"),
            ("Agent Commission Policy Update", "Updated transparent lead protection guidelines are now active.", "IMPORTANT", "agent"),
        ]

        for title, msg, atype, role in default_announcements:
            existing = db.query(PlatformAnnouncement).filter(PlatformAnnouncement.title == title).first()
            if not existing:
                db.add(PlatformAnnouncement(title=title, message=msg, type=atype, target_role=role, is_active=True))

        # 5. FAQs
        default_faqs = [
            ("Verification", "How does SAI verify properties?", "Every listing goes through AI document OCR extraction, title deed check, and optional physical inspection before receiving the Verified badge.", 1),
            ("RERA", "What does RERA Registered mean on SAI?", "It means the project registration number has been matched and verified directly with the State Real Estate Regulatory Authority portal.", 2),
            ("AI Search", "Which languages does the AI Assistant support?", "SAI's conversational assistant natively supports 8 languages: English, Hindi, Marathi, Bengali, Gujarati, Tamil, Telugu, and Kannada.", 3),
            ("Safety", "How do I report a fraudulent listing or duplicate?", "Click the 'Report Listing' link on any property page or reach out to our Super Admin moderation desk.", 4),
        ]

        for cat, q, a, order in default_faqs:
            existing = db.query(PlatformFAQ).filter(PlatformFAQ.question == q).first()
            if not existing:
                db.add(PlatformFAQ(category=cat, question=q, answer=a, display_order=order, is_active=True))

        # 6. RERA Registrations
        props = db.query(Property).limit(5).all()
        prop1 = props[0] if len(props) > 0 else None
        prop2 = props[1] if len(props) > 1 else None

        default_rera = [
            ("P52100024891", "Prestige Heights Phase 1", "Prestige Landmarks LLP", "Maharashtra", "Pune", "Residential", "VERIFIED", prop1.id if prop1 else None),
            ("P52100030114", "Godrej Skyline Baner", "Godrej Properties Ltd", "Maharashtra", "Pune", "Residential & Commercial", "VERIFIED", prop2.id if prop2 else None),
            ("P51800008812", "Lodha Park Central", "Lodha Developers", "Maharashtra", "Mumbai", "Luxury Residential", "VERIFIED", None),
        ]

        for rnum, pname, prom, st, dist, ptype, vstat, pid in default_rera:
            existing = db.query(RERARegistration).filter(RERARegistration.rera_number == rnum).first()
            if not existing:
                db.add(RERARegistration(
                    rera_number=rnum, project_name=pname, promoter_name=prom,
                    state=st, district=dist, project_type=ptype,
                    verification_status=vstat, property_id=pid,
                    source_url=f"https://maharera.mahaonline.gov.in/project-detail/{rnum}",
                    verified_at=datetime.now(timezone.utc)
                ))

        # 7. Sample Complaints
        buyer_user = db.query(User).filter(User.role == UserRole.BUYER).first()
        if buyer_user and prop1:
            existing_complaint = db.query(Complaint).first()
            if not existing_complaint:
                db.add(Complaint(
                    user_id=buyer_user.id,
                    property_id=prop1.id,
                    category="incorrect_price",
                    subject="Discrepancy in maintenance fee quote",
                    description="The listing states maintenance is included, but during site visit the representative mentioned Rs 4,500/month separate fee.",
                    status="OPEN",
                    priority="MEDIUM"
                ))
                db.add(Complaint(
                    user_id=buyer_user.id,
                    property_id=prop2.id if prop2 else prop1.id,
                    category="fake_listing",
                    subject="Listing photos mismatch",
                    description="The interior photos show a modern modular kitchen, but the actual unit was unfurnished bare shell.",
                    status="UNDER_REVIEW",
                    priority="HIGH",
                    internal_notes="Contacting owner to update actual photography or unpublish."
                ))

        db.commit()
        print("[+] Admin defaults initialized successfully!")
    except Exception as e:
        db.rollback()
        print(f"[-] Error initializing admin defaults: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_admin_defaults()
