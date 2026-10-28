import sys
import os
from datetime import datetime, timezone, timedelta

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db.session import SessionLocal
from app.models.user import User, UserRole, AgentProfile, BuilderProfile, BuyerProfile
from app.models.property import Property
from app.models.project import Project, Building, Unit
from app.models.enquiry import Enquiry
from app.models.site_visit import SiteVisit
from app.models.lead import Lead
from app.models.favorite import Favorite
from app.models.promotion import ListingPromotion
from app.models.chat import Conversation, ConversationParticipant, Message
from app.models.verification import VerificationDocument, VerificationReview, VerificationBadge

def seed_portals():
    db = SessionLocal()
    try:
        print("[*] Enhancing Agent & Builder real portal database data...")

        # 1. Ensure Agent User (agent@sai.in)
        agent = db.query(User).filter(User.email == "agent@sai.in").first()
        if agent:
            agent.name = "Priya Patel"
            agent.phone = "+91 98765 43210"
            if not agent.agent_profile:
                agent.agent_profile = AgentProfile(user_id=agent.id)
            agent.agent_profile.agency_name = "Sai Prime Realtors"
            agent.agent_profile.license_number = "MH-AG-2026-881"
            agent.agent_profile.experience_years = 6
            agent.agent_profile.rera_id = "RERA-MH-99214"
            agent.agent_profile.rating = 4.9
            agent.agent_profile.review_count = 38
            agent.agent_profile.city = "Pune"
            agent.agent_profile.areas_served = ["Baner", "Wakad", "Koregaon Park", "Hinjewadi"]
            agent.agent_profile.languages = ["English", "Hindi", "Marathi"]
            agent.agent_profile.bio = "Senior Property Consultant specializing in West Pune residential developments, high-yield luxury villas, and verified gated communities."
            agent.agent_profile.profile_image = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&fit=crop"
            agent.agent_profile.verification_status = "VERIFIED"
            db.commit()

        # 2. Ensure Builder User (builder@sai.in)
        builder = db.query(User).filter(User.email == "builder@sai.in").first()
        if builder:
            builder.name = "Prestige Landmarks"
            builder.phone = "+91 98765 43213"
            if not builder.builder_profile:
                builder.builder_profile = BuilderProfile(user_id=builder.id)
            builder.builder_profile.company_name = "Prestige Landmarks"
            builder.builder_profile.developer_registration_no = "DEV-REG-552"
            builder.builder_profile.rera_id = "MAHARERA-B-991204"
            builder.builder_profile.support_email = "support@prestigelandmarks.in"
            builder.builder_profile.city = "Pune"
            builder.builder_profile.company_type = "Real Estate Developer"
            builder.builder_profile.office_address = "Prestige Tower, Senapati Bapat Road, Pune"
            builder.builder_profile.rating = 4.8
            builder.builder_profile.verification_status = "VERIFIED"
            db.commit()

        # 3. Ensure Buyer Users for Leads / Enquiries
        buyer_amit = db.query(User).filter(User.email == "amit.jain@example.com").first()
        if not buyer_amit:
            from app.core.security import get_password_hash
            buyer_amit = User(name="Amit Jain", email="amit.jain@example.com", phone="+91 98765 11111", password_hash=get_password_hash("Password123!"), role=UserRole.BUYER, is_active=True)
            db.add(buyer_amit)
            db.commit()
            db.refresh(buyer_amit)
            db.add(BuyerProfile(user_id=buyer_amit.id, preferred_city="Pune", preferred_bhk=2, budget_max=9000000))
            db.commit()

        buyer_sneha = db.query(User).filter(User.email == "sneha.desai@example.com").first()
        if not buyer_sneha:
            from app.core.security import get_password_hash
            buyer_sneha = User(name="Sneha Desai", email="sneha.desai@example.com", phone="+91 98765 22222", password_hash=get_password_hash("Password123!"), role=UserRole.BUYER, is_active=True)
            db.add(buyer_sneha)
            db.commit()
            db.refresh(buyer_sneha)
            db.add(BuyerProfile(user_id=buyer_sneha.id, preferred_city="Pune", preferred_bhk=3, budget_max=25000000))
            db.commit()

        buyer_rohan = db.query(User).filter(User.email == "rohan.mehta@example.com").first()
        if not buyer_rohan:
            from app.core.security import get_password_hash
            buyer_rohan = User(name="Rohan Mehta", email="rohan.mehta@example.com", phone="+91 98765 33333", password_hash=get_password_hash("Password123!"), role=UserRole.BUYER, is_active=True)
            db.add(buyer_rohan)
            db.commit()
            db.refresh(buyer_rohan)
            db.add(BuyerProfile(user_id=buyer_rohan.id, preferred_city="Pune", preferred_bhk=1, budget_max=4500000))
            db.commit()

        buyer_meera = db.query(User).filter(User.email == "meera.kapoor@example.com").first()
        if not buyer_meera:
            from app.core.security import get_password_hash
            buyer_meera = User(name="Meera Kapoor", email="meera.kapoor@example.com", phone="+91 98765 44444", password_hash=get_password_hash("Password123!"), role=UserRole.BUYER, is_active=True)
            db.add(buyer_meera)
            db.commit()
            db.refresh(buyer_meera)
            db.add(BuyerProfile(user_id=buyer_meera.id, preferred_city="Pune", preferred_bhk=2, budget_max=8500000))
            db.commit()

        # 4. Assign properties to Agent (agent@sai.in) with metrics
        p1 = db.query(Property).filter(Property.id == 1).first()
        if p1:
            p1.agent_id = agent.id
            p1.title = "2BHK in Baner · Prestige Heights"
            p1.views_count = 342
            p1.saves_count = 17
            p1.verification_status = "VERIFIED"
            p1.is_verified = True

        p2 = db.query(Property).filter(Property.id == 2).first()
        if p2:
            p2.agent_id = agent.id
            p2.title = "3BHK Villa · Koregaon Park"
            p2.property_type = "villa"
            p2.price = 24000000
            p2.price_display = "₹2.4 Cr"
            p2.locality = "Koregaon Park"
            p2.city = "Pune"
            p2.views_count = 218
            p2.saves_count = 11
            p2.verification_status = "VERIFIED"
            p2.is_verified = True

        p3 = db.query(Property).filter(Property.id == 3).first()
        if p3:
            p3.agent_id = agent.id
            p3.title = "1BHK Studio · Wakad"
            p3.property_type = "apartment"
            p3.price = 4200000
            p3.price_display = "₹42L"
            p3.locality = "Wakad"
            p3.city = "Pune"
            p3.status = "inactive"
            p3.views_count = 95
            p3.saves_count = 5
            p3.verification_status = "VERIFIED"

        db.commit()

        # 5. Enquiries for Agent's listings
        if p1:
            e1 = db.query(Enquiry).filter(Enquiry.property_id == p1.id, Enquiry.buyer_id == buyer_amit.id).first()
            if not e1:
                db.add(Enquiry(property_id=p1.id, buyer_id=buyer_amit.id, agent_id=agent.id, message="Looking for immediate possession in Baner. Please share final pricing.", status="NEW"))
            e4 = db.query(Enquiry).filter(Enquiry.property_id == p1.id, Enquiry.buyer_id == buyer_meera.id).first()
            if not e4:
                db.add(Enquiry(property_id=p1.id, buyer_id=buyer_meera.id, agent_id=agent.id, message="Please share brochure and floor plans for 2BHK.", status="INTERESTED"))

        if p2:
            e2 = db.query(Enquiry).filter(Enquiry.property_id == p2.id, Enquiry.buyer_id == buyer_sneha.id).first()
            if not e2:
                db.add(Enquiry(property_id=p2.id, buyer_id=buyer_sneha.id, agent_id=agent.id, message="Is the price negotiable on spot?", status="CONTACTED"))

        if p3:
            e3 = db.query(Enquiry).filter(Enquiry.property_id == p3.id, Enquiry.buyer_id == buyer_rohan.id).first()
            if not e3:
                db.add(Enquiry(property_id=p3.id, buyer_id=buyer_rohan.id, agent_id=agent.id, message="Can we schedule a visit this Saturday morning?", status="SITE_VISIT_SCHEDULED"))

        db.commit()

        # 6. Site Visits for Agent
        now = datetime.now(timezone.utc)
        if p1:
            v1 = db.query(SiteVisit).filter(SiteVisit.property_id == p1.id, SiteVisit.buyer_id == buyer_amit.id).first()
            if not v1:
                db.add(SiteVisit(
                    property_id=p1.id,
                    buyer_id=buyer_amit.id,
                    agent_id=agent.id,
                    scheduled_at=now + timedelta(days=1, hours=2),
                    status="CONFIRMED",
                    notes="Client interested in upper floor 2BHK facing east."
                ))
            v3 = db.query(SiteVisit).filter(SiteVisit.property_id == p1.id, SiteVisit.buyer_id == buyer_meera.id).first()
            if not v3:
                db.add(SiteVisit(
                    property_id=p1.id,
                    buyer_id=buyer_meera.id,
                    agent_id=agent.id,
                    scheduled_at=now - timedelta(days=2),
                    status="COMPLETED",
                    notes="Completed site walkthrough. Client reviewing loan documents."
                ))

        if p2:
            v2 = db.query(SiteVisit).filter(SiteVisit.property_id == p2.id, SiteVisit.buyer_id == buyer_sneha.id).first()
            if not v2:
                db.add(SiteVisit(
                    property_id=p2.id,
                    buyer_id=buyer_sneha.id,
                    agent_id=agent.id,
                    scheduled_at=now + timedelta(days=3),
                    status="CONFIRMED",
                    notes="Private villa tour with family architect."
                ))

        db.commit()

        # 7. Leads for Agent
        if not db.query(Lead).filter(Lead.agent_id == agent.id).first():
            db.add(Lead(agent_id=agent.id, buyer_id=buyer_amit.id, property_id=p1.id if p1 else None, status="SITE_VISIT", notes="Budget: ₹80–90L · Immediate move-in"))
            db.add(Lead(agent_id=agent.id, buyer_id=buyer_sneha.id, property_id=p2.id if p2 else None, status="NEGOTIATION", notes="Budget: ₹2–2.5Cr · High intent"))
            db.add(Lead(agent_id=agent.id, buyer_id=buyer_rohan.id, property_id=p3.id if p3 else None, status="CONTACTED", notes="Budget: ₹40–45L · Studio search"))
            db.add(Lead(agent_id=agent.id, buyer_id=buyer_meera.id, property_id=p1.id if p1 else None, status="NEW", notes="Budget: ₹75–85L · Looking for 2BHK Baner"))
            db.commit()

        # 8. Listing Promotions
        if p1 and not db.query(ListingPromotion).filter(ListingPromotion.property_id == p1.id).first():
            db.add(ListingPromotion(
                user_id=agent.id,
                property_id=p1.id,
                plan_type="Premium",
                duration_days=30,
                cost=5999.0,
                start_date=now - timedelta(days=2),
                end_date=now + timedelta(days=28),
                status="active",
                impressions=8420,
                clicks=312,
                enquiries_count=14,
                leads_count=6
            ))
            db.commit()

        # 9. Real Chat Conversation between Agent and Buyer Amit Jain
        conv = db.query(Conversation).filter(Conversation.title.like("%Amit Jain%")).first()
        if not conv:
            conv = Conversation(title=f"Chat between {agent.name} and {buyer_amit.name}")
            db.add(conv)
            db.commit()
            db.refresh(conv)

            db.add(ConversationParticipant(conversation_id=conv.id, user_id=agent.id))
            db.add(ConversationParticipant(conversation_id=conv.id, user_id=buyer_amit.id))
            db.add(Message(conversation_id=conv.id, sender_id=buyer_amit.id, content="Hello Priya, I enquired about the 2BHK in Prestige Heights."))
            db.add(Message(conversation_id=conv.id, sender_id=agent.id, content="Hi Amit! It's a wonderful east-facing unit on the 4th floor. When would you like to visit?"))
            db.add(Message(conversation_id=conv.id, sender_id=buyer_amit.id, content="Tomorrow at 10:30 AM works well for me."))
            db.add(Message(conversation_id=conv.id, sender_id=agent.id, content="Perfect, I've confirmed our appointment for tomorrow 10:30 AM! See you there."))
            db.commit()

        # 10. Real Verification Documents for Agent & Builder
        # Dummy secure file paths for testing
        doc_dir = os.path.join(backend_dir, "uploads", "secure_documents")
        os.makedirs(doc_dir, exist_ok=True)

        sample_agent_kyc = os.path.join(doc_dir, "agent_pan_card.pdf")
        if not os.path.exists(sample_agent_kyc):
            with open(sample_agent_kyc, "wb") as f:
                f.write(b"%PDF-1.4 Mock PAN card document for Priya Patel. PAN: ABCDP1234F.")

        if not db.query(VerificationDocument).filter(VerificationDocument.user_id == agent.id, VerificationDocument.document_type == "pan").first():
            db.add(VerificationDocument(
                user_id=agent.id,
                account_type="agent",
                document_type="pan",
                file_name="Agent_Priya_PAN.pdf",
                file_path=sample_agent_kyc,
                mime_type="application/pdf",
                file_size=1024,
                status="VERIFIED",
                extracted_data={"name": "Priya Patel", "pan_number": "ABXXX34F", "dob": "12/04/1988", "issuing_authority": "Income Tax Dept, Govt of India", "confidence": 0.98},
                checks_data={"document_readable": "PASS", "required_fields": "PASS", "name_consistency": "MATCH", "property_details_consistency": "MATCH", "document_type": "MATCH", "duplicate_check": "NO", "potential_alteration": "NOT_FLAGGED", "ai_confidence_score": 98.0}
            ))

        if not db.query(VerificationDocument).filter(VerificationDocument.user_id == agent.id, VerificationDocument.document_type == "agency_license").first():
            db.add(VerificationDocument(
                user_id=agent.id,
                account_type="agent",
                document_type="agency_license",
                file_name="Sai_Prime_RERA_Certificate.pdf",
                file_path=sample_agent_kyc,
                mime_type="application/pdf",
                file_size=2048,
                status="UNDER_REVIEW",
                extracted_data={"agent_name": "Priya Patel", "agency_name": "Sai Prime Realtors", "license_number": "MH-AG-2026-881", "rera_id": "RERA-MH-99214", "valid_until": "15/06/2029", "confidence": 0.96},
                checks_data={"document_readable": "PASS", "required_fields": "PASS", "name_consistency": "MATCH", "property_details_consistency": "MATCH", "document_type": "MATCH", "duplicate_check": "NO", "potential_alteration": "NOT_FLAGGED", "ai_confidence_score": 96.0}
            ))

        # Builder verification doc
        if not db.query(VerificationDocument).filter(VerificationDocument.user_id == builder.id).first():
            db.add(VerificationDocument(
                user_id=builder.id,
                account_type="builder",
                document_type="company_incorporation",
                file_name="Prestige_Landmarks_Incorporation.pdf",
                file_path=sample_agent_kyc,
                mime_type="application/pdf",
                file_size=4096,
                status="UNDER_REVIEW",
                extracted_data={"company_name": "Prestige Landmarks LLP", "cin_or_llpin": "U45201PN2018PTC179281", "date_of_incorporation": "22/03/2018", "registered_office": "Prestige Tower, Senapati Bapat Road, Pune", "confidence": 0.97},
                checks_data={"document_readable": "PASS", "required_fields": "PASS", "name_consistency": "MATCH", "property_details_consistency": "MATCH", "document_type": "MATCH", "duplicate_check": "NO", "potential_alteration": "NOT_FLAGGED", "ai_confidence_score": 97.0}
            ))

        # Buyer KYC doc
        if not db.query(VerificationDocument).filter(VerificationDocument.user_id == buyer_amit.id).first():
            db.add(VerificationDocument(
                user_id=buyer_amit.id,
                account_type="buyer",
                document_type="aadhaar",
                file_name="Amit_Jain_Aadhaar_KYC.pdf",
                file_path=sample_agent_kyc,
                mime_type="application/pdf",
                file_size=2048,
                status="PENDING",
                extracted_data={"full_name": "Amit Jain", "document_number": "XXXX XXXX 1184", "dob": "10/05/1991", "address": "Pune, Maharashtra", "confidence": 0.95},
                checks_data={"document_readable": "PASS", "required_fields": "PASS", "name_consistency": "MATCH", "property_details_consistency": "MATCH", "document_type": "MATCH", "duplicate_check": "NO", "potential_alteration": "NOT_FLAGGED", "ai_confidence_score": 95.0}
            ))

        # Badges
        if not db.query(VerificationBadge).filter(VerificationBadge.user_id == agent.id).first():
            db.add(VerificationBadge(user_id=agent.id, badge_type="verified_agent", status="ACTIVE"))
        if not db.query(VerificationBadge).filter(VerificationBadge.user_id == builder.id).first():
            db.add(VerificationBadge(user_id=builder.id, badge_type="verified_builder", status="ACTIVE"))

        db.commit()
        print("[OK] Agent & Builder real portal database data seeded successfully!")
    finally:
        db.close()

if __name__ == '__main__':
    seed_portals()
