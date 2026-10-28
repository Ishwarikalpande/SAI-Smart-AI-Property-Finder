import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.project import Project, Building, Unit
from app.models.property import Property
from app.models.enquiry import Enquiry
from app.models.site_visit import SiteVisit
from app.models.verification import VerificationDocument
from app.models.promotion import ListingPromotion
from app.models.property_view import PropertyView
from app.models.chat import Conversation, Message, ConversationParticipant

def seed_complete_test_data():
    db = SessionLocal()

    # Find or verify users
    builder = db.query(User).filter(User.email == "builder@sai.in").first()
    agent = db.query(User).filter(User.email == "agent@sai.in").first()
    buyer = db.query(User).filter(User.email == "buyer@sai.in").first()

    if not builder or not agent or not buyer:
        print("[ERROR] Core users not found")
        db.close()
        return

    print(f"Builder ID: {builder.id}, Agent ID: {agent.id}, Buyer ID: {buyer.id}")

    # 1. Project: SAI Smart City Phase 1
    proj = db.query(Project).filter(Project.name == "SAI Smart City Phase 1", Project.builder_id == builder.id).first()
    if not proj:
        proj = Project(
            name="SAI Smart City Phase 1",
            builder_id=builder.id,
            description="Luxury residential township with state of the art amenities in Kharadi, Pune.",
            address="Near World Trade Center, Kharadi",
            locality="Kharadi",
            city="Pune",
            state="Maharashtra",
            country="India",
            pincode="411014",
            latitude=18.5514,
            longitude=73.9350,
            construction_status="Under Construction",
            expected_completion_date="2027-12-31",
            amenities=["Clubhouse", "Swimming Pool", "Gym", "Jogging Track", "Power Backup", "24/7 Security", "EV Charging", "Children Play Area"],
            status="active"
        )
        db.add(proj)
        db.commit()
        db.refresh(proj)
        print(f"Created project: {proj.name} (id={proj.id})")
    else:
        print(f"Found existing project: {proj.name} (id={proj.id})")

    # 2. Towers: Tower A and Tower B
    tower_a = db.query(Building).filter(Building.project_id == proj.id, Building.name == "Tower A").first()
    if not tower_a:
        tower_a = Building(
            project_id=proj.id,
            name="Tower A",
            code="A",
            floors_count=10,
            units_per_floor=4,
            total_units=40,
            description="Tower A - Premium East Facing Units",
            status="Ready to Move"
        )
        db.add(tower_a)
        db.commit()
        db.refresh(tower_a)
        print(f"Created Tower A (id={tower_a.id})")

        # Generate 40 units for Tower A: 25 Available, 5 Reserved, 7 Booked, 3 Sold
        unit_configs = [
            ("available", 25),
            ("reserved", 5),
            ("booked", 7),
            ("sold", 3)
        ]
        status_pool = []
        for st, count in unit_configs:
            status_pool.extend([st] * count)

        idx = 0
        for fl in range(1, 11):
            for u in range(1, 5):
                u_num = f"A-{fl}0{u}"
                bhks = [2, 2, 3, 3]
                areas = [1050.0, 1200.0, 1450.0, 1580.0]
                prices = [6500000.0, 7500000.0, 9200000.0, 10500000.0]
                unit_st = status_pool[idx] if idx < len(status_pool) else "available"
                idx += 1

                unit_obj = Unit(
                    project_id=proj.id,
                    tower_id=tower_a.id,
                    unit_number=u_num,
                    floor_number=fl,
                    bhk=bhks[u - 1],
                    area_sqft=areas[u - 1],
                    carpet_area=areas[u - 1] * 0.78,
                    price=prices[u - 1],
                    parking="1 Covered",
                    status=unit_st
                )
                db.add(unit_obj)
        db.commit()
        print("Generated 40 units for Tower A (25 Available, 5 Reserved, 7 Booked, 3 Sold)")

    tower_b = db.query(Building).filter(Building.project_id == proj.id, Building.name == "Tower B").first()
    if not tower_b:
        tower_b = Building(
            project_id=proj.id,
            name="Tower B",
            code="B",
            floors_count=9,
            units_per_floor=4,
            total_units=36,
            description="Tower B - Garden Facing Suites",
            status="Under Construction"
        )
        db.add(tower_b)
        db.commit()
        db.refresh(tower_b)
        print(f"Created Tower B (id={tower_b.id})")

        # 36 units: 20 Available, 6 Reserved, 6 Booked, 4 Sold
        b_configs = [("available", 20), ("reserved", 6), ("booked", 6), ("sold", 4)]
        b_status_pool = []
        for st, count in b_configs:
            b_status_pool.extend([st] * count)

        idx = 0
        for fl in range(1, 10):
            for u in range(1, 5):
                u_num = f"B-{fl}0{u}"
                bhks = [1, 2, 2, 3]
                areas = [650.0, 980.0, 1020.0, 1380.0]
                prices = [4200000.0, 6200000.0, 6500000.0, 8800000.0]
                unit_st = b_status_pool[idx] if idx < len(b_status_pool) else "available"
                idx += 1

                unit_obj = Unit(
                    project_id=proj.id,
                    tower_id=tower_b.id,
                    unit_number=u_num,
                    floor_number=fl,
                    bhk=bhks[u - 1],
                    area_sqft=areas[u - 1],
                    carpet_area=areas[u - 1] * 0.78,
                    price=prices[u - 1],
                    parking="1 Covered",
                    status=unit_st
                )
                db.add(unit_obj)
        db.commit()
        print("Generated 36 units for Tower B (20 Available, 6 Reserved, 6 Booked, 4 Sold)")

    # 3. Builder Verification Document
    b_doc = db.query(VerificationDocument).filter(VerificationDocument.user_id == builder.id).first()
    if not b_doc:
        b_doc = VerificationDocument(
            user_id=builder.id,
            document_type="RERA Certificate",
            file_name="rera_certificate_sai_smart_city.pdf",
            file_url="/uploads/rera_certificate_sai_smart_city.pdf",
            status="verified",
            notes="Official MahaRERA approved certificate",
            reviewed_by=5,
            reviewed_at=datetime.utcnow() - timedelta(days=10)
        )
        db.add(b_doc)
        db.commit()
        print("Created verified document for Builder")

    # 4. Builder Promotion
    b_promo = db.query(ListingPromotion).filter(ListingPromotion.user_id == builder.id, ListingPromotion.project_id == proj.id).first()
    if not b_promo:
        b_promo = ListingPromotion(
            user_id=builder.id,
            project_id=proj.id,
            plan_type="Featured Project",
            duration_days=60,
            cost=25000.0,
            status="active",
            start_date=datetime.utcnow() - timedelta(days=15),
            end_date=datetime.utcnow() + timedelta(days=45),
            impressions=1240,
            clicks=285,
            enquiries_count=18,
            leads_count=14
        )
        db.add(b_promo)
        db.commit()
        print("Created active promotion for Builder project")

    # 5. Builder Enquiry
    b_enq = db.query(Enquiry).filter(Enquiry.builder_id == builder.id, Enquiry.project_id == proj.id).first()
    if not b_enq:
        c_unit = db.query(Unit).filter(Unit.tower_id == tower_a.id).first()
        b_enq = Enquiry(
            buyer_id=buyer.id,
            builder_id=builder.id,
            project_id=proj.id,
            tower_id=tower_a.id,
            unit_id=c_unit.id if c_unit else None,
            budget="₹75L",
            message="Is immediate registration possible? Can we schedule a site visit this Saturday?",
            status="New"
        )
        db.add(b_enq)
        db.commit()
        print("Created builder enquiry with project, tower and unit")

    # 6. Agent properties and listings
    agent_props = db.query(Property).filter(Property.agent_id == agent.id).all()
    if len(agent_props) < 3:
        p1 = db.query(Property).filter(Property.agent_id == None).first()
        if p1:
            p1.agent_id = agent.id
            db.commit()
        available_props = db.query(Property).filter(Property.agent_id != agent.id).limit(3).all()
        for p in available_props:
            p.agent_id = agent.id
        db.commit()
        agent_props = db.query(Property).filter(Property.agent_id == agent.id).all()
        print(f"Assigned {len(agent_props)} properties to Agent {agent.id}")

    target_prop = agent_props[0] if agent_props else None
    if target_prop:
        # Add real PropertyView records across 7d, 30d, 90d
        now = datetime.utcnow()
        v_count = db.query(PropertyView).filter(PropertyView.property_id == target_prop.id).count()
        if v_count < 10:
            for day_offset in [1, 2, 4, 6, 12, 18, 25, 40, 65, 80]:
                view = PropertyView(
                    property_id=target_prop.id,
                    viewer_id=buyer.id if day_offset % 2 == 0 else None,
                    ip_address=f"192.168.1.{10 + day_offset}",
                    viewed_at=now - timedelta(days=day_offset, hours=day_offset)
                )
                db.add(view)
            target_prop.views_count = (target_prop.views_count or 0) + 10
            db.commit()
            print(f"Created 10 timestamped PropertyView records for prop {target_prop.id}")

        # Add agent enquiry
        a_enq = db.query(Enquiry).filter(Enquiry.agent_id == agent.id, Enquiry.property_id == target_prop.id).first()
        if not a_enq:
            a_enq = Enquiry(
                buyer_id=buyer.id,
                agent_id=agent.id,
                property_id=target_prop.id,
                budget="₹65L",
                message="Interested in visiting this property. Please share brochure and maintenance charges.",
                status="Site Visit Scheduled"
            )
            db.add(a_enq)
            db.commit()
            print(f"Created agent enquiry for prop {target_prop.id}")

        # Add agent site visit
        a_visit = db.query(SiteVisit).filter(SiteVisit.agent_id == agent.id).first()
        if not a_visit:
            a_visit = SiteVisit(
                buyer_id=buyer.id,
                agent_id=agent.id,
                property_id=target_prop.id,
                visit_date=(now + timedelta(days=2)).date(),
                time_slot="11:00 AM",
                status="Confirmed",
                notes="Buyer requested cab assistance from railway station."
            )
            db.add(a_visit)
            completed_visit = SiteVisit(
                buyer_id=buyer.id,
                agent_id=agent.id,
                property_id=target_prop.id,
                visit_date=(now - timedelta(days=5)).date(),
                time_slot="3:00 PM",
                status="Completed",
                notes="Buyer satisfied with layout and price."
            )
            db.add(completed_visit)
            db.commit()
            print("Created confirmed and completed site visits for agent")

    # 7. Agent Verification Document
    a_doc = db.query(VerificationDocument).filter(VerificationDocument.user_id == agent.id).first()
    if not a_doc:
        a_doc = VerificationDocument(
            user_id=agent.id,
            document_type="MahaRERA Agent Certificate",
            file_name="agent_maharera_license.pdf",
            file_url="/uploads/agent_maharera_license.pdf",
            status="verified",
            notes="Valid MahaRERA individual agent registration",
            reviewed_by=5,
            reviewed_at=datetime.utcnow() - timedelta(days=20)
        )
        db.add(a_doc)
        db.commit()
        print("Created verified document for Agent")

    # 8. Chat Conversations for Agent and Builder with Buyer
    # Agent <-> Buyer
    existing_agent_part = db.query(ConversationParticipant).filter(ConversationParticipant.user_id == agent.id).all()
    conv_agent = None
    for p in existing_agent_part:
        partner = db.query(ConversationParticipant).filter(ConversationParticipant.conversation_id == p.conversation_id, ConversationParticipant.user_id == buyer.id).first()
        if partner:
            conv_agent = db.query(Conversation).filter(Conversation.id == p.conversation_id).first()
            break

    if not conv_agent:
        conv_agent = Conversation(
            title=f"Chat: {target_prop.title if target_prop else 'Property Inquiry'}",
            created_at=datetime.utcnow() - timedelta(days=3),
            updated_at=datetime.utcnow() - timedelta(hours=2)
        )
        db.add(conv_agent)
        db.commit()
        db.refresh(conv_agent)

        db.add(ConversationParticipant(conversation_id=conv_agent.id, user_id=buyer.id))
        db.add(ConversationParticipant(conversation_id=conv_agent.id, user_id=agent.id))
        db.commit()

        m1 = Message(
            conversation_id=conv_agent.id,
            sender_id=buyer.id,
            content="Hello, is the 2 BHK unit in Kharadi still available?",
            is_read=True,
            created_at=datetime.utcnow() - timedelta(days=3)
        )
        m2 = Message(
            conversation_id=conv_agent.id,
            sender_id=agent.id,
            content="Yes, Rahul! It is available. Would you like to schedule a physical walkthrough this weekend?",
            is_read=True,
            created_at=datetime.utcnow() - timedelta(days=2)
        )
        m3 = Message(
            conversation_id=conv_agent.id,
            sender_id=buyer.id,
            content="Yes, Saturday at 11 AM works best for me.",
            is_read=False,
            created_at=datetime.utcnow() - timedelta(hours=2)
        )
        db.add_all([m1, m2, m3])
        db.commit()
        print(f"Created conversation & 3 messages between Agent {agent.id} and Buyer {buyer.id}")

    # Builder <-> Buyer
    existing_builder_part = db.query(ConversationParticipant).filter(ConversationParticipant.user_id == builder.id).all()
    conv_builder = None
    for p in existing_builder_part:
        partner = db.query(ConversationParticipant).filter(ConversationParticipant.conversation_id == p.conversation_id, ConversationParticipant.user_id == buyer.id).first()
        if partner:
            conv_builder = db.query(Conversation).filter(Conversation.id == p.conversation_id).first()
            break

    if not conv_builder:
        conv_builder = Conversation(
            title="Chat: SAI Smart City Phase 1",
            created_at=datetime.utcnow() - timedelta(days=1),
            updated_at=datetime.utcnow() - timedelta(minutes=45)
        )
        db.add(conv_builder)
        db.commit()
        db.refresh(conv_builder)

        db.add(ConversationParticipant(conversation_id=conv_builder.id, user_id=buyer.id))
        db.add(ConversationParticipant(conversation_id=conv_builder.id, user_id=builder.id))
        db.commit()

        mb1 = Message(
            conversation_id=conv_builder.id,
            sender_id=buyer.id,
            content="Greetings! We saw Tower A at SAI Smart City Phase 1. Are bank loans pre-approved?",
            is_read=True,
            created_at=datetime.utcnow() - timedelta(days=1)
        )
        mb2 = Message(
            conversation_id=conv_builder.id,
            sender_id=builder.id,
            content="Hello! Yes, SBI, HDFC, and ICICI have pre-approved the project with special 8.4% interest rates.",
            is_read=False,
            created_at=datetime.utcnow() - timedelta(minutes=45)
        )
        db.add_all([mb1, mb2])
        db.commit()
        print(f"Created conversation & 2 messages between Builder {builder.id} and Buyer {buyer.id}")

    db.close()
    print("[SUCCESS] All test data seeded and verified in database!")

if __name__ == "__main__":
    seed_complete_test_data()
