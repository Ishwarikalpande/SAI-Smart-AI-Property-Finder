import sys
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.user import User, UserRole, BuyerProfile, SellerProfile, AgentProfile, BuilderProfile
from app.models.property import Property
from app.models.property_media import PropertyMedia
from app.models.facility import Facility, PropertyFacility
from app.models.project import Project, Building, Floor, Unit
from app.models.search_history import BuyerPreference
from app.core.security import get_password_hash

def seed_database():
    db = SessionLocal()
    try:
        print("[*] Seeding complete SAI Production Database...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

        default_pw = get_password_hash("Password123!")

        # 1. USERS & PROFILES
        users_data = [
            ("Buyer Dev", "buyer@sai.in", "9876543210", UserRole.BUYER),
            ("Owner Dev", "owner@sai.in", "9876543211", UserRole.SELLER),
            ("Agent Dev", "agent@sai.in", "9876543212", UserRole.AGENT),
            ("Builder Dev", "builder@sai.in", "9876543213", UserRole.BUILDER),
            ("Admin Dev", "admin@sai.in", "9876543214", UserRole.SUPER_ADMIN),
        ]

        users = {}
        for name, email, phone, role in users_data:
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(name=name, email=email, phone=phone, password_hash=default_pw, role=role, is_active=True)
                db.add(u)
                db.commit()
                db.refresh(u)

                if role == UserRole.BUYER:
                    db.add(BuyerProfile(user_id=u.id, preferred_city="Pune", preferred_language="en", preferred_bhk=2, budget_max=7500000))
                    db.add(BuyerPreference(user_id=u.id, preferred_cities=["Pune"], preferred_bhks=[2, 3], max_budget=8000000))
                elif role == UserRole.SELLER:
                    db.add(SellerProfile(user_id=u.id, company_name="Direct Owner Properties"))
                elif role == UserRole.AGENT:
                    db.add(AgentProfile(user_id=u.id, agency_name="Sai Prime Realtors", license_number="MH-AG-2026-881", rera_id="RERA-MH-99214"))
                elif role == UserRole.BUILDER:
                    db.add(BuilderProfile(user_id=u.id, company_name="Prestige Landmarks", developer_registration_no="DEV-REG-552"))
                db.commit()
            users[role] = u

        # 2. SAMPLE FACILITIES
        sample_facilities = [
            ("Ruby Hall Clinic (Hospital)", "hospital", 18.5328, 73.8762, "Dhole Patil Rd, Pune"),
            ("Symbiosis International School", "school", 18.5721, 73.9145, "Viman Nagar, Pune"),
            ("Baner Metro Station", "metro", 18.5590, 73.7868, "Baner Road, Pune"),
            ("Hinjewadi Rajiv Gandhi IT Park", "it park", 18.5913, 73.7389, "Hinjewadi Phase 1, Pune"),
            ("Chaturshringi Temple", "temple", 18.5385, 73.8300, "Senapati Bapat Rd, Pune"),
            ("Phoenix Marketcity", "market", 18.5620, 73.9168, "Viman Nagar, Pune"),
        ]

        for name, ftype, lat, lon, addr in sample_facilities:
            f = db.query(Facility).filter(Facility.name == name).first()
            if not f:
                f = Facility(name=name, type=ftype, latitude=lat, longitude=lon, address=addr)
                db.add(f)
                db.commit()

        # 3. COMPREHENSIVE PROPERTY INVENTORY (BUY, RENT, COMMERCIAL)
        all_properties = [
            # ── BUY PROPERTIES ───────────────────────────────────────────
            {
                "title": "Prestige Heights",
                "description": "Luxurious 3 BHK apartment with panoramic skyline views, smart home automation, and world-class clubhouse amenities.",
                "property_type": "apartment",
                "listing_type": "buy",
                "bhk": 3,
                "area_sqft": 1450,
                "price": 8500000,
                "price_display": "₹85L",
                "furnishing": "semi-furnished",
                "amenities": ["Gym", "Pool", "Parking", "Lift", "Security", "Clubhouse"],
                "address": "Baner High Street, Baner",
                "locality": "Baner",
                "city": "Pune",
                "latitude": 18.5596,
                "longitude": 73.7799,
                "badge": "AI Pick",
                "is_verified": True,
                "is_rera": True,
                "match_score": 97,
                "rating": 4.8,
                "dist_metro": "0.8 km Metro",
                "sponsored": True,
                "sponsored_label": "Featured Property",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1682184805271-11671b7ecf4c?w=800&h=600&fit=crop&auto=format",
                    "https://images.unsplash.com/photo-1682662046610-fbdb3db4bd74?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Godrej Woodsville",
                "description": "Premium 2 BHK garden apartment situated near IT corridor with serene green surroundings.",
                "property_type": "apartment",
                "listing_type": "buy",
                "bhk": 2,
                "area_sqft": 1120,
                "price": 6200000,
                "price_display": "₹62L",
                "furnishing": "semi-furnished",
                "amenities": ["Gym", "Garden", "Security", "Parking", "Kids Play Area"],
                "address": "Datta Mandir Road, Wakad",
                "locality": "Wakad",
                "city": "Pune",
                "latitude": 18.5987,
                "longitude": 73.7634,
                "badge": "Top Rated",
                "is_verified": True,
                "is_rera": True,
                "match_score": 92,
                "rating": 4.6,
                "dist_metro": "1.2 km Metro",
                "owner_id": users[UserRole.SELLER].id,
                "agent_id": users[UserRole.AGENT].id,
                "images": [
                    "https://images.unsplash.com/photo-1779976955613-b74623824d1c?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Lodha Palacia",
                "description": "Signature 4 BHK independent private pool villa located in elite residential enclave.",
                "property_type": "villa",
                "listing_type": "buy",
                "bhk": 4,
                "area_sqft": 2800,
                "price": 18000000,
                "price_display": "₹1.8Cr",
                "furnishing": "furnished",
                "amenities": ["Pool", "Club", "EV Charging", "Private Garden", "Servant Room"],
                "address": "North Main Road, Kalyani Nagar",
                "locality": "Kalyani Nagar",
                "city": "Pune",
                "latitude": 18.5463,
                "longitude": 73.9033,
                "badge": "Premium",
                "is_verified": True,
                "is_rera": True,
                "match_score": 88,
                "rating": 4.9,
                "dist_metro": "2.1 km Metro",
                "agent_id": users[UserRole.AGENT].id,
                "images": [
                    "https://images.unsplash.com/photo-1711114377419-09b0cd2d786b?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Piramal Mahalaxmi",
                "description": "Open-plan modern 2 BHK apartment near Hinjewadi Phase 1 IT park.",
                "property_type": "apartment",
                "listing_type": "buy",
                "bhk": 2,
                "area_sqft": 1050,
                "price": 5800000,
                "price_display": "₹58L",
                "furnishing": "unfurnished",
                "amenities": ["Parking", "Security", "Lift", "Power Backup"],
                "address": "Phase 1 Rd, Hinjewadi",
                "locality": "Hinjewadi",
                "city": "Pune",
                "latitude": 18.5913,
                "longitude": 73.7389,
                "badge": "Value Pick",
                "is_verified": True,
                "is_rera": False,
                "match_score": 85,
                "rating": 4.5,
                "dist_metro": "1.5 km IT Park",
                "sponsored": True,
                "sponsored_label": "Promoted Listing",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1680416124510-5eae1beca412?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Mahindra Windchimes",
                "description": "Spacious 3 BHK villa with private terrace and landscaped gardens.",
                "property_type": "villa",
                "listing_type": "buy",
                "bhk": 3,
                "area_sqft": 2100,
                "price": 12000000,
                "price_display": "₹1.2Cr",
                "furnishing": "semi-furnished",
                "amenities": ["Garden", "Gym", "Pool", "Clubhouse"],
                "address": "Magarpatta Road, Hadapsar",
                "locality": "Hadapsar",
                "city": "Pune",
                "latitude": 18.5089,
                "longitude": 73.9259,
                "badge": "New Launch",
                "is_verified": False,
                "is_rera": True,
                "match_score": 83,
                "rating": 4.7,
                "dist_metro": "0.5 km School",
                "agent_id": users[UserRole.AGENT].id,
                "images": [
                    "https://images.unsplash.com/photo-1700219447843-d9fafce8143f?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Kolte Patil Life",
                "description": "Compact and efficient 1 BHK apartment 300 meters from Akurdi railway and metro stations.",
                "property_type": "apartment",
                "listing_type": "buy",
                "bhk": 1,
                "area_sqft": 650,
                "price": 3800000,
                "price_display": "₹38L",
                "furnishing": "unfurnished",
                "amenities": ["Parking", "Lift", "Security", "Water 24x7"],
                "address": "Pradhikaran, Akurdi",
                "locality": "Akurdi",
                "city": "Pune",
                "latitude": 18.6492,
                "longitude": 73.7707,
                "badge": "Budget Pick",
                "is_verified": True,
                "is_rera": True,
                "match_score": 79,
                "rating": 4.3,
                "dist_metro": "0.3 km Metro",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1764996915324-91919cee14d3?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Sobha Dream Acres",
                "description": "Luxury 2 BHK apartment in prime Viman Nagar close to Phoenix Marketcity and airport.",
                "property_type": "apartment",
                "listing_type": "buy",
                "bhk": 2,
                "area_sqft": 1200,
                "price": 7200000,
                "price_display": "₹72L",
                "furnishing": "semi-furnished",
                "amenities": ["Pool", "Gym", "Club", "Squash Court", "Jogging Track"],
                "address": "Clover Park, Viman Nagar",
                "locality": "Viman Nagar",
                "city": "Pune",
                "latitude": 18.5679,
                "longitude": 73.9143,
                "badge": "Premium",
                "is_verified": True,
                "is_rera": True,
                "match_score": 90,
                "rating": 4.8,
                "dist_metro": "2.0 km Airport",
                "agent_id": users[UserRole.AGENT].id,
                "images": [
                    "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Shapoorji Pallonji Joyville",
                "description": "High-rise 3 BHK residency in EON Free Zone IT corridor with smart layout.",
                "property_type": "apartment",
                "listing_type": "buy",
                "bhk": 3,
                "area_sqft": 1750,
                "price": 9500000,
                "price_display": "₹95L",
                "furnishing": "semi-furnished",
                "amenities": ["Conference", "Parking", "Security", "Gym", "Pool"],
                "address": "Grant Road, Kharadi",
                "locality": "Kharadi",
                "city": "Pune",
                "latitude": 18.5528,
                "longitude": 73.9532,
                "badge": "AI Pick",
                "is_verified": True,
                "is_rera": True,
                "match_score": 86,
                "rating": 4.6,
                "dist_metro": "1.0 km Metro",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1758431145201-2846e60054b0?w=800&h=600&fit=crop&auto=format"
                ]
            },

            # ── RENT PROPERTIES ───────────────────────────────────────────
            {
                "title": "Furnished 2BHK · Baner",
                "description": "Fully furnished 2 BHK apartment on Baner road with high-speed WiFi, modern kitchen and parking.",
                "property_type": "apartment",
                "listing_type": "rent",
                "bhk": 2,
                "area_sqft": 1100,
                "price": 32000,
                "price_display": "₹32,000/mo",
                "furnishing": "furnished",
                "amenities": ["Fully Furnished", "WiFi", "Parking", "Power Backup"],
                "address": "Baner Road, Baner",
                "locality": "Baner",
                "city": "Pune",
                "latitude": 18.5602,
                "longitude": 73.7820,
                "badge": "AI Pick",
                "is_verified": True,
                "is_rera": True,
                "match_score": 96,
                "rating": 4.8,
                "dist_metro": "0.5 km Metro",
                "sponsored": True,
                "sponsored_label": "Featured Rental",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Luxury Studio · Koregaon Park",
                "description": "Designer studio apartment in North Main Road with swimming pool and private balcony.",
                "property_type": "studio",
                "listing_type": "rent",
                "bhk": 1,
                "area_sqft": 550,
                "price": 22000,
                "price_display": "₹22,000/mo",
                "furnishing": "furnished",
                "amenities": ["Furnished", "Pool", "Gym", "Security"],
                "address": "Lane 7, Koregaon Park",
                "locality": "Koregaon Park",
                "city": "Pune",
                "latitude": 18.5362,
                "longitude": 73.8940,
                "badge": "Premium",
                "is_verified": True,
                "is_rera": True,
                "match_score": 91,
                "rating": 4.7,
                "dist_metro": "1.0 km Market",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Spacious 3BHK · Wakad",
                "description": "Airy 3 BHK flat with modular kitchen, clubhouse access, and children's park.",
                "property_type": "apartment",
                "listing_type": "rent",
                "bhk": 3,
                "area_sqft": 1450,
                "price": 45000,
                "price_display": "₹45,000/mo",
                "furnishing": "semi-furnished",
                "amenities": ["Semi-Furnished", "Garden", "Security", "Clubhouse"],
                "address": "Kaspate Vasti, Wakad",
                "locality": "Wakad",
                "city": "Pune",
                "latitude": 18.6010,
                "longitude": 73.7650,
                "badge": "Top Rated",
                "is_verified": True,
                "is_rera": False,
                "match_score": 89,
                "rating": 4.6,
                "dist_metro": "1.2 km IT Park",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Cosy 1BHK · Hinjewadi",
                "description": "Ideal 1 BHK for IT professionals, walking distance to Phase 1 bus terminal and tech hubs.",
                "property_type": "apartment",
                "listing_type": "rent",
                "bhk": 1,
                "area_sqft": 620,
                "price": 18000,
                "price_display": "₹18,000/mo",
                "furnishing": "furnished",
                "amenities": ["Furnished", "Lift", "Parking", "WiFi"],
                "address": "Maan Road, Hinjewadi",
                "locality": "Hinjewadi",
                "city": "Pune",
                "latitude": 18.5930,
                "longitude": 73.7350,
                "badge": "Budget Pick",
                "is_verified": True,
                "is_rera": True,
                "match_score": 84,
                "rating": 4.4,
                "dist_metro": "0.3 km IT Park",
                "sponsored": True,
                "sponsored_label": "Promoted",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Penthouse · Viman Nagar",
                "description": "Ultra luxury 4 BHK penthouse with private terrace jacuzzi and panoramic city views.",
                "property_type": "penthouse",
                "listing_type": "rent",
                "bhk": 4,
                "area_sqft": 2200,
                "price": 85000,
                "price_display": "₹85,000/mo",
                "furnishing": "furnished",
                "amenities": ["Fully Furnished", "Terrace", "Pool", "Gym", "Concierge"],
                "address": "Sakore Nagar, Viman Nagar",
                "locality": "Viman Nagar",
                "city": "Pune",
                "latitude": 18.5690,
                "longitude": 73.9160,
                "badge": "Luxury",
                "is_verified": True,
                "is_rera": True,
                "match_score": 87,
                "rating": 4.9,
                "dist_metro": "2.0 km Airport",
                "agent_id": users[UserRole.AGENT].id,
                "images": [
                    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Modern Studio · Kharadi",
                "description": "Compact studio with smart home automation, security cameras, and modular fit-outs.",
                "property_type": "studio",
                "listing_type": "rent",
                "bhk": 1,
                "area_sqft": 480,
                "price": 16000,
                "price_display": "₹16,000/mo",
                "furnishing": "furnished",
                "amenities": ["Furnished", "Security", "CCTV", "Power Backup"],
                "address": "Chandan Nagar, Kharadi",
                "locality": "Kharadi",
                "city": "Pune",
                "latitude": 18.5550,
                "longitude": 73.9480,
                "badge": "Value Pick",
                "is_verified": True,
                "is_rera": True,
                "match_score": 81,
                "rating": 4.2,
                "dist_metro": "0.8 km Metro",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop&auto=format"
                ]
            },

            # ── COMMERCIAL PROPERTIES ────────────────────────────────────
            {
                "title": "Prestige Tech Park Suite",
                "description": "Ready-to-occupy Grade A IT commercial office with central air conditioning and cafeteria.",
                "property_type": "office",
                "listing_type": "commercial",
                "bhk": None,
                "area_sqft": 3200,
                "price": 14000000,
                "price_display": "₹1.4Cr",
                "furnishing": "furnished",
                "amenities": ["Furnished", "Conference", "Cafeteria", "24/7 Security"],
                "address": "Phase 2, Hinjewadi",
                "locality": "Hinjewadi",
                "city": "Pune",
                "latitude": 18.5880,
                "longitude": 73.7250,
                "badge": "Premium",
                "is_verified": True,
                "is_rera": True,
                "match_score": 95,
                "rating": 4.8,
                "dist_metro": "0.2 km IT Hub",
                "sponsored": True,
                "sponsored_label": "Featured Space",
                "agent_id": users[UserRole.AGENT].id,
                "images": [
                    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Kharadi Business Centre",
                "description": "Open plan IT/ITES office suite with dedicated server room and 6 reserved car parking slots.",
                "property_type": "office",
                "listing_type": "commercial",
                "bhk": None,
                "area_sqft": 1800,
                "price": 8200000,
                "price_display": "₹82L",
                "furnishing": "furnished",
                "amenities": ["Open Plan", "Server Room", "Parking", "Fiber Internet"],
                "address": "EON Free Zone Rd, Kharadi",
                "locality": "Kharadi",
                "city": "Pune",
                "latitude": 18.5528,
                "longitude": 73.9532,
                "badge": "AI Pick",
                "is_verified": True,
                "is_rera": True,
                "match_score": 90,
                "rating": 4.7,
                "dist_metro": "0.5 km Metro",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "CoWork Hub · Viman Nagar",
                "description": "Premium plug-and-play coworking facility with hot desks, meeting rooms, and high-speed fiber.",
                "property_type": "office",
                "listing_type": "commercial",
                "bhk": None,
                "area_sqft": 4000,
                "price": 3500000,
                "price_display": "₹35L",
                "furnishing": "furnished",
                "amenities": ["Hot-desk", "Meeting Rooms", "Café", "Reception"],
                "address": "Symbiosis Road, Viman Nagar",
                "locality": "Viman Nagar",
                "city": "Pune",
                "latitude": 18.5710,
                "longitude": 73.9180,
                "badge": "Top Rated",
                "is_verified": True,
                "is_rera": False,
                "match_score": 88,
                "rating": 4.6,
                "dist_metro": "2.5 km Airport",
                "agent_id": users[UserRole.AGENT].id,
                "images": [
                    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Magarpatta Retail Unit",
                "description": "Ground floor prime retail showroom with high footfall, wide frontage, and visitor parking.",
                "property_type": "office",
                "listing_type": "commercial",
                "bhk": None,
                "area_sqft": 950,
                "price": 5600000,
                "price_display": "₹56L",
                "furnishing": "unfurnished",
                "amenities": ["Ground Floor", "High Footfall", "Parking", "Display Glass"],
                "address": "Magarpatta City, Hadapsar",
                "locality": "Hadapsar",
                "city": "Pune",
                "latitude": 18.5140,
                "longitude": 73.9280,
                "badge": "Value Pick",
                "is_verified": True,
                "is_rera": True,
                "match_score": 85,
                "rating": 4.5,
                "dist_metro": "0.1 km Metro",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Senapati Bapat Tower",
                "description": "Independent commercial building floor with panoramic views, power substation and 24/7 security.",
                "property_type": "office",
                "listing_type": "commercial",
                "bhk": None,
                "area_sqft": 7500,
                "price": 32000000,
                "price_display": "₹3.2Cr",
                "furnishing": "furnished",
                "amenities": ["Full Floor", "Terrace", "24/7 Access", "Power Substation"],
                "address": "Senapati Bapat Road, Shivaji Nagar",
                "locality": "Senapati Bapat Rd",
                "city": "Pune",
                "latitude": 18.5385,
                "longitude": 73.8300,
                "badge": "Premium",
                "is_verified": True,
                "is_rera": True,
                "match_score": 83,
                "rating": 4.9,
                "dist_metro": "1.0 km Metro",
                "agent_id": users[UserRole.AGENT].id,
                "images": [
                    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Baner IT Campus Unit",
                "description": "Corporate office suite in newly developed IT campus on Baner expressway junction.",
                "property_type": "office",
                "listing_type": "commercial",
                "bhk": None,
                "area_sqft": 2100,
                "price": 6800000,
                "price_display": "₹68L",
                "furnishing": "semi-furnished",
                "amenities": ["Open Plan", "Parking", "Power Backup", "Fire Safety"],
                "address": "Bangalore Highway Junction, Baner",
                "locality": "Baner",
                "city": "Pune",
                "latitude": 18.5680,
                "longitude": 73.7740,
                "badge": "New Launch",
                "is_verified": True,
                "is_rera": True,
                "match_score": 80,
                "rating": 4.3,
                "dist_metro": "0.4 km Highway",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1600508773759-e3a87c921ad8?w=800&h=600&fit=crop&auto=format"
                ]
            },
            # ── AMRAVATI PROPERTIES ──────────────────────────────────────
            {
                "title": "Shivshahi Residency",
                "description": "Spacious 2 BHK flat in the heart of Amravati with garden view and modern fittings.",
                "property_type": "apartment",
                "listing_type": "buy",
                "bhk": 2,
                "area_sqft": 950,
                "price": 3200000,
                "price_display": "₹32L",
                "furnishing": "semi-furnished",
                "amenities": ["Parking", "Security", "Garden", "Lift"],
                "address": "Rajapeth, Amravati",
                "locality": "Rajapeth",
                "city": "Amravati",
                "state": "Maharashtra",
                "country": "India",
                "pincode": "444601",
                "latitude": 20.9330,
                "longitude": 77.7523,
                "badge": "Value Pick",
                "is_verified": True,
                "is_rera": True,
                "match_score": 88,
                "rating": 4.4,
                "dist_metro": "1.5 km Bus Stand",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Amravati Green Valley",
                "description": "Premium 3 BHK villa with private parking, terrace garden, and Vastu-compliant design.",
                "property_type": "villa",
                "listing_type": "buy",
                "bhk": 3,
                "area_sqft": 1800,
                "price": 5500000,
                "price_display": "₹55L",
                "furnishing": "unfurnished",
                "amenities": ["Garden", "Parking", "Terrace", "Water Supply"],
                "address": "Camp Area, Amravati",
                "locality": "Camp",
                "city": "Amravati",
                "state": "Maharashtra",
                "country": "India",
                "pincode": "444602",
                "latitude": 20.9277,
                "longitude": 77.7561,
                "badge": "Premium",
                "is_verified": True,
                "is_rera": True,
                "match_score": 91,
                "rating": 4.6,
                "dist_metro": "2.0 km Railway Station",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Amravati Heights Rental",
                "description": "Furnished 2 BHK rental apartment near bus stand with all modern amenities.",
                "property_type": "apartment",
                "listing_type": "rent",
                "bhk": 2,
                "area_sqft": 900,
                "price": 12000,
                "price_display": "₹12,000/mo",
                "furnishing": "furnished",
                "amenities": ["WiFi", "Parking", "Security", "Power Backup"],
                "address": "Badnera Road, Amravati",
                "locality": "Badnera Road",
                "city": "Amravati",
                "state": "Maharashtra",
                "country": "India",
                "pincode": "444605",
                "latitude": 20.9190,
                "longitude": 77.7710,
                "badge": "Budget Pick",
                "is_verified": True,
                "is_rera": False,
                "match_score": 85,
                "rating": 4.2,
                "dist_metro": "0.5 km Market",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&auto=format"
                ]
            },
            # ── NAGPUR PROPERTIES ────────────────────────────────────────
            {
                "title": "Dharampeth Luxury Flat",
                "description": "Premium 3 BHK apartment in prime Dharampeth locality with city skyline views.",
                "property_type": "apartment",
                "listing_type": "buy",
                "bhk": 3,
                "area_sqft": 1600,
                "price": 9500000,
                "price_display": "₹95L",
                "furnishing": "semi-furnished",
                "amenities": ["Gym", "Pool", "Parking", "Clubhouse", "Security"],
                "address": "Dharampeth, Nagpur",
                "locality": "Dharampeth",
                "city": "Nagpur",
                "state": "Maharashtra",
                "country": "India",
                "pincode": "440010",
                "latitude": 21.1433,
                "longitude": 79.0815,
                "badge": "AI Pick",
                "is_verified": True,
                "is_rera": True,
                "match_score": 94,
                "rating": 4.7,
                "dist_metro": "1.0 km Metro",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Manish Nagar Villa",
                "description": "Beautiful 4 BHK independent villa with private garden and modern architecture.",
                "property_type": "villa",
                "listing_type": "buy",
                "bhk": 4,
                "area_sqft": 2500,
                "price": 15000000,
                "price_display": "₹1.5Cr",
                "furnishing": "unfurnished",
                "amenities": ["Garden", "Parking", "Security", "Terrace", "Solar Panel"],
                "address": "Manish Nagar, Nagpur",
                "locality": "Manish Nagar",
                "city": "Nagpur",
                "state": "Maharashtra",
                "country": "India",
                "pincode": "440015",
                "latitude": 21.1100,
                "longitude": 79.0500,
                "badge": "Premium",
                "is_verified": True,
                "is_rera": True,
                "match_score": 90,
                "rating": 4.8,
                "dist_metro": "2.5 km Airport",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&auto=format"
                ]
            },
            # ── MUMBAI PROPERTIES ────────────────────────────────────────
            {
                "title": "Andheri West Skyline",
                "description": "Modern 2 BHK apartment in Andheri West with metro connectivity and premium amenities.",
                "property_type": "apartment",
                "listing_type": "buy",
                "bhk": 2,
                "area_sqft": 850,
                "price": 18000000,
                "price_display": "₹1.8Cr",
                "furnishing": "semi-furnished",
                "amenities": ["Gym", "Pool", "Parking", "Concierge", "Metro Access"],
                "address": "Lokhandwala, Andheri West",
                "locality": "Andheri West",
                "city": "Mumbai",
                "state": "Maharashtra",
                "country": "India",
                "pincode": "400053",
                "latitude": 19.1364,
                "longitude": 72.8296,
                "badge": "Premium",
                "is_verified": True,
                "is_rera": True,
                "match_score": 95,
                "rating": 4.7,
                "dist_metro": "0.3 km Metro",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&auto=format"
                ]
            },
            {
                "title": "Powai Lake View Tower",
                "description": "Luxurious 3 BHK apartment overlooking Powai Lake with smart home features.",
                "property_type": "apartment",
                "listing_type": "buy",
                "bhk": 3,
                "area_sqft": 1400,
                "price": 32000000,
                "price_display": "₹3.2Cr",
                "furnishing": "furnished",
                "amenities": ["Lake View", "Gym", "Pool", "Clubhouse", "Concierge"],
                "address": "Hiranandani Gardens, Powai",
                "locality": "Powai",
                "city": "Mumbai",
                "state": "Maharashtra",
                "country": "India",
                "pincode": "400076",
                "latitude": 19.1197,
                "longitude": 72.9074,
                "badge": "Luxury Pick",
                "is_verified": True,
                "is_rera": True,
                "match_score": 96,
                "rating": 4.9,
                "dist_metro": "1.5 km IT Park",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&auto=format"
                ]
            },
            # ── NASHIK PROPERTIES ────────────────────────────────────────
            {
                "title": "Nashik Vineyard Residency",
                "description": "Beautiful 2 BHK apartment near Sula vineyards with scenic mountain views.",
                "property_type": "apartment",
                "listing_type": "buy",
                "bhk": 2,
                "area_sqft": 1050,
                "price": 4200000,
                "price_display": "₹42L",
                "furnishing": "semi-furnished",
                "amenities": ["Garden", "Parking", "Security", "Gym"],
                "address": "Gangapur Road, Nashik",
                "locality": "Gangapur Road",
                "city": "Nashik",
                "state": "Maharashtra",
                "country": "India",
                "pincode": "422013",
                "latitude": 20.0063,
                "longitude": 73.7630,
                "badge": "Top Rated",
                "is_verified": True,
                "is_rera": True,
                "match_score": 89,
                "rating": 4.5,
                "dist_metro": "1.0 km Market",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800&h=600&fit=crop&auto=format"
                ]
            },
            # ── JAIPUR PROPERTIES ────────────────────────────────────────
            {
                "title": "Pink City Heights",
                "description": "Royal 3 BHK apartment with Rajasthani architecture near Hawa Mahal.",
                "property_type": "apartment",
                "listing_type": "buy",
                "bhk": 3,
                "area_sqft": 1500,
                "price": 7500000,
                "price_display": "₹75L",
                "furnishing": "semi-furnished",
                "amenities": ["Pool", "Gym", "Parking", "Garden", "Terrace"],
                "address": "Malviya Nagar, Jaipur",
                "locality": "Malviya Nagar",
                "city": "Jaipur",
                "state": "Rajasthan",
                "country": "India",
                "pincode": "302017",
                "latitude": 26.8584,
                "longitude": 75.8013,
                "badge": "Premium",
                "is_verified": True,
                "is_rera": True,
                "match_score": 92,
                "rating": 4.6,
                "dist_metro": "1.2 km Metro",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&auto=format"
                ]
            },
            # ── BANGALORE PROPERTIES ─────────────────────────────────────
            {
                "title": "Whitefield Tech Park Residency",
                "description": "Modern 2 BHK apartment near ITPL and Whitefield metro with smart home features.",
                "property_type": "apartment",
                "listing_type": "buy",
                "bhk": 2,
                "area_sqft": 1100,
                "price": 7800000,
                "price_display": "₹78L",
                "furnishing": "semi-furnished",
                "amenities": ["Gym", "Pool", "Parking", "EV Charging", "Shuttle"],
                "address": "ITPL Main Road, Whitefield",
                "locality": "Whitefield",
                "city": "Bangalore",
                "state": "Karnataka",
                "country": "India",
                "pincode": "560066",
                "latitude": 12.9698,
                "longitude": 77.7500,
                "badge": "IT Special",
                "is_verified": True,
                "is_rera": True,
                "match_score": 93,
                "rating": 4.6,
                "dist_metro": "0.5 km Metro",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&auto=format"
                ]
            },
            # ── HYDERABAD PROPERTIES ─────────────────────────────────────
            {
                "title": "Gachibowli IT Corridor Flat",
                "description": "Premium 2 BHK apartment near Microsoft and Google campuses with excellent connectivity.",
                "property_type": "apartment",
                "listing_type": "buy",
                "bhk": 2,
                "area_sqft": 1200,
                "price": 8500000,
                "price_display": "₹85L",
                "furnishing": "semi-furnished",
                "amenities": ["Gym", "Pool", "Parking", "Clubhouse", "Jogging Track"],
                "address": "Financial District, Gachibowli",
                "locality": "Gachibowli",
                "city": "Hyderabad",
                "state": "Telangana",
                "country": "India",
                "pincode": "500032",
                "latitude": 17.4400,
                "longitude": 78.3489,
                "badge": "AI Pick",
                "is_verified": True,
                "is_rera": True,
                "match_score": 95,
                "rating": 4.8,
                "dist_metro": "1.0 km IT Park",
                "owner_id": users[UserRole.SELLER].id,
                "images": [
                    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&auto=format"
                ]
            }
        ]

        # Also add state/country/pincode to existing Pune properties
        for p_data in all_properties:
            if p_data.get("city") == "Pune" and "state" not in p_data:
                p_data["state"] = "Maharashtra"
                p_data["country"] = "India"

        for p_data in all_properties:
            images = p_data.pop("images", [])
            p = db.query(Property).filter(Property.title == p_data["title"]).first()
            if not p:
                p = Property(**p_data)
                db.add(p)
                db.commit()
                db.refresh(p)
                for idx, img_url in enumerate(images):
                    db.add(PropertyMedia(property_id=p.id, url=img_url, media_type="image", sort_order=idx))
                db.commit()

        # 4. MULTI-CITY FACILITIES
        multi_city_facilities = [
            ("Ruby Hall Clinic (Hospital)", "hospital", 18.5328, 73.8762, "Dhole Patil Rd, Pune"),
            ("Symbiosis International School", "school", 18.5721, 73.9145, "Viman Nagar, Pune"),
            ("Baner Metro Station", "metro", 18.5590, 73.7868, "Baner Road, Pune"),
            ("Hinjewadi Rajiv Gandhi IT Park", "it park", 18.5913, 73.7389, "Hinjewadi Phase 1, Pune"),
            ("Chaturshringi Temple", "temple", 18.5385, 73.8300, "Senapati Bapat Rd, Pune"),
            ("Phoenix Marketcity", "market", 18.5620, 73.9168, "Viman Nagar, Pune"),
            # Amravati facilities
            ("Amravati Railway Station", "transit", 20.9320, 77.7500, "Station Road, Amravati"),
            ("IRWIN Hospital Amravati", "hospital", 20.9350, 77.7550, "Camp Area, Amravati"),
            ("Amravati Bus Stand", "transit", 20.9310, 77.7540, "Rajapeth, Amravati"),
            # Nagpur facilities
            ("Nagpur Metro Station", "metro", 21.1458, 79.0882, "Sitabuldi, Nagpur"),
            ("AIIMS Nagpur", "hospital", 21.1200, 79.0450, "Mihan, Nagpur"),
            ("Nagpur Airport", "airport", 21.0922, 79.0472, "Sonegaon, Nagpur"),
            # Mumbai facilities
            ("Andheri Metro Station", "metro", 19.1197, 72.8464, "Andheri, Mumbai"),
            ("Hiranandani Hospital", "hospital", 19.1200, 72.9100, "Powai, Mumbai"),
            # Jaipur facilities
            ("Jaipur Metro Station", "metro", 26.9124, 75.7873, "Chandpole, Jaipur"),
            ("SMS Hospital Jaipur", "hospital", 26.9196, 75.8070, "JLN Marg, Jaipur"),
        ]

        for name, ftype, lat, lon, addr in multi_city_facilities:
            f = db.query(Facility).filter(Facility.name == name).first()
            if not f:
                f = Facility(name=name, type=ftype, latitude=lat, longitude=lon, address=addr)
                db.add(f)
                db.commit()

        # 5. MULTI-CITY BUILDER PROJECTS
        multi_city_projects = [
            {
                "name": "Prestige Smart City",
                "description": "Integrated 40-acre residential township featuring 10 residential towers.",
                "address": "Near Mumbai-Pune Expressway, Punawale",
                "locality": "Punawale",
                "city": "Pune",
                "state": "Maharashtra",
                "country": "India",
                "latitude": 18.6250,
                "longitude": 73.7420,
                "construction_status": "Under Construction",
                "expected_completion_date": "Dec 2027",
                "amenities": ["Clubhouse", "Infinity Pool", "Tennis Court", "Jogging Track"]
            },
            {
                "name": "Amravati City Center",
                "description": "Modern residential complex with 4 towers in the heart of Amravati.",
                "address": "Near Railway Station, Amravati",
                "locality": "Camp",
                "city": "Amravati",
                "state": "Maharashtra",
                "country": "India",
                "latitude": 20.9300,
                "longitude": 77.7530,
                "construction_status": "New Launch",
                "expected_completion_date": "Jun 2028",
                "amenities": ["Clubhouse", "Garden", "Parking", "Security"]
            },
            {
                "name": "Nagpur Metro Heights",
                "description": "Premium residential towers near Nagpur Metro corridor.",
                "address": "Dharampeth, Nagpur",
                "locality": "Dharampeth",
                "city": "Nagpur",
                "state": "Maharashtra",
                "country": "India",
                "latitude": 21.1430,
                "longitude": 79.0810,
                "construction_status": "Under Construction",
                "expected_completion_date": "Mar 2028",
                "amenities": ["Gym", "Pool", "Metro Access", "EV Charging"]
            }
        ]

        for proj_data in multi_city_projects:
            proj = db.query(Project).filter(Project.name == proj_data["name"]).first()
            if not proj:
                proj = Project(
                    builder_id=users[UserRole.BUILDER].id,
                    **proj_data
                )
                db.add(proj)
                db.commit()
                db.refresh(proj)

                bld = Building(project_id=proj.id, name="Tower Alpha")
                db.add(bld)
                db.commit()
                db.refresh(bld)

                flr = Floor(building_id=bld.id, floor_number=5)
                db.add(flr)
                db.commit()
                db.refresh(flr)

                u1 = Unit(project_id=proj.id, floor_id=flr.id, unit_number="501", bhk=2, area_sqft=1050, carpet_area=820, price=6500000, status="available")
                u2 = Unit(project_id=proj.id, floor_id=flr.id, unit_number="502", bhk=3, area_sqft=1450, carpet_area=1150, price=8900000, status="available")
                db.add_all([u1, u2])
                db.commit()

        print("[SUCCESS] Full multi-city production inventory seeded with properties across Pune, Amravati, Nagpur, Mumbai, Nashik, Jaipur, Bangalore, and Hyderabad!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
