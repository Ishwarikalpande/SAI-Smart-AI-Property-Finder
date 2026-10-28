import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.property import Property
from app.models.property_media import PropertyMedia

def seed_cities():
    db = SessionLocal()
    agent = db.query(User).filter(User.role == UserRole.AGENT).first()
    builder = db.query(User).filter(User.role == UserRole.BUILDER).first()
    owner = db.query(User).filter(User.role == UserRole.SELLER).first()
    agent_id = agent.id if agent else 3
    builder_id = builder.id if builder else 4
    owner_id = owner.id if owner else 2

    cities_data = [
        # Bangalore
        {
            "city": "Bangalore",
            "state": "Karnataka",
            "lat": 12.9716,
            "lng": 77.5946,
            "props": [
                {
                    "title": "3 BHK Luxury Highrise in Whitefield",
                    "locality": "Whitefield",
                    "bhk": 3,
                    "price": 12500000,
                    "price_display": "₹1.25 Cr",
                    "area_sqft": 1650,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "semi-furnished",
                    "lat_offset": 0.015,
                    "lng_offset": 0.020,
                    "img": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
                },
                {
                    "title": "2 BHK Smart Tech Flat in Koramangala",
                    "locality": "Koramangala",
                    "bhk": 2,
                    "price": 9500000,
                    "price_display": "₹95 L",
                    "area_sqft": 1150,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "furnished",
                    "lat_offset": -0.012,
                    "lng_offset": -0.010,
                    "img": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"
                },
                {
                    "title": "4 BHK Modern Villa in Indiranagar",
                    "locality": "Indiranagar",
                    "bhk": 4,
                    "price": 28000000,
                    "price_display": "₹2.8 Cr",
                    "area_sqft": 2800,
                    "prop_type": "villa",
                    "listing_type": "buy",
                    "furnishing": "furnished",
                    "lat_offset": 0.008,
                    "lng_offset": -0.015,
                    "img": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"
                }
            ]
        },
        # Hyderabad
        {
            "city": "Hyderabad",
            "state": "Telangana",
            "lat": 17.3850,
            "lng": 78.4867,
            "props": [
                {
                    "title": "3 BHK Premium Gated Community in Gachibowli",
                    "locality": "Gachibowli",
                    "bhk": 3,
                    "price": 11000000,
                    "price_display": "₹1.10 Cr",
                    "area_sqft": 1550,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "semi-furnished",
                    "lat_offset": 0.020,
                    "lng_offset": 0.018,
                    "img": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
                },
                {
                    "title": "2 BHK Lake View Condo in Hitec City",
                    "locality": "Hitec City",
                    "bhk": 2,
                    "price": 8200000,
                    "price_display": "₹82 L",
                    "area_sqft": 1200,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "furnished",
                    "lat_offset": 0.015,
                    "lng_offset": -0.012,
                    "img": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80"
                }
            ]
        },
        # Chennai
        {
            "city": "Chennai",
            "state": "Tamil Nadu",
            "lat": 13.0827,
            "lng": 80.2707,
            "props": [
                {
                    "title": "3 BHK Coastal View Apartment in OMR",
                    "locality": "OMR",
                    "bhk": 3,
                    "price": 8800000,
                    "price_display": "₹88 L",
                    "area_sqft": 1420,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "semi-furnished",
                    "lat_offset": -0.015,
                    "lng_offset": 0.010,
                    "img": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
                },
                {
                    "title": "2 BHK Contemporary Flat in Anna Nagar",
                    "locality": "Anna Nagar",
                    "bhk": 2,
                    "price": 7500000,
                    "price_display": "₹75 L",
                    "area_sqft": 1050,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "furnished",
                    "lat_offset": 0.018,
                    "lng_offset": -0.015,
                    "img": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"
                },
                {
                    "title": "3 BHK Sea Breeze Residence in Adyar",
                    "locality": "Adyar",
                    "bhk": 3,
                    "price": 14500000,
                    "price_display": "₹1.45 Cr",
                    "area_sqft": 1600,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "semi-furnished",
                    "lat_offset": -0.020,
                    "lng_offset": 0.015,
                    "img": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"
                }
            ]
        },
        # Delhi NCR
        {
            "city": "Delhi NCR",
            "state": "Delhi NCR",
            "lat": 28.6139,
            "lng": 77.2090,
            "props": [
                {
                    "title": "3 BHK Elegant Flat in Dwarka Sector 12",
                    "locality": "Dwarka",
                    "bhk": 3,
                    "price": 13500000,
                    "price_display": "₹1.35 Cr",
                    "area_sqft": 1500,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "semi-furnished",
                    "lat_offset": -0.010,
                    "lng_offset": -0.025,
                    "img": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
                },
                {
                    "title": "4 BHK Heritage Bungalow in South Extension",
                    "locality": "South Extension",
                    "bhk": 4,
                    "price": 32000000,
                    "price_display": "₹3.2 Cr",
                    "area_sqft": 2600,
                    "prop_type": "villa",
                    "listing_type": "buy",
                    "furnishing": "furnished",
                    "lat_offset": -0.015,
                    "lng_offset": 0.012,
                    "img": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80"
                },
                {
                    "title": "2 BHK Modern Highrise in Vasant Kunj",
                    "locality": "Vasant Kunj",
                    "bhk": 2,
                    "price": 9800000,
                    "price_display": "₹98 L",
                    "area_sqft": 1100,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "semi-furnished",
                    "lat_offset": -0.022,
                    "lng_offset": -0.010,
                    "img": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
                }
            ]
        },
        # Ahmedabad
        {
            "city": "Ahmedabad",
            "state": "Gujarat",
            "lat": 23.0225,
            "lng": 72.5714,
            "props": [
                {
                    "title": "3 BHK Premium Residence on SG Highway",
                    "locality": "SG Highway",
                    "bhk": 3,
                    "price": 7800000,
                    "price_display": "₹78 L",
                    "area_sqft": 1450,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "semi-furnished",
                    "lat_offset": 0.015,
                    "lng_offset": -0.018,
                    "img": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"
                },
                {
                    "title": "2 BHK Smart Apartment in Prahlad Nagar",
                    "locality": "Prahlad Nagar",
                    "bhk": 2,
                    "price": 5800000,
                    "price_display": "₹58 L",
                    "area_sqft": 1080,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "furnished",
                    "lat_offset": -0.012,
                    "lng_offset": -0.015,
                    "img": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"
                }
            ]
        },
        # Kolkata
        {
            "city": "Kolkata",
            "state": "West Bengal",
            "lat": 22.5726,
            "lng": 88.3639,
            "props": [
                {
                    "title": "3 BHK Lake Facing Flat in New Town Action Area I",
                    "locality": "New Town",
                    "bhk": 3,
                    "price": 8200000,
                    "price_display": "₹82 L",
                    "area_sqft": 1380,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "semi-furnished",
                    "lat_offset": 0.020,
                    "lng_offset": 0.025,
                    "img": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
                },
                {
                    "title": "2 BHK Quiet Haven in Salt Lake Sector V",
                    "locality": "Salt Lake",
                    "bhk": 2,
                    "price": 6400000,
                    "price_display": "₹64 L",
                    "area_sqft": 1050,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "furnished",
                    "lat_offset": 0.012,
                    "lng_offset": 0.018,
                    "img": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
                }
            ]
        },
        # Surat
        {
            "city": "Surat",
            "state": "Gujarat",
            "lat": 21.1702,
            "lng": 72.8311,
            "props": [
                {
                    "title": "3 BHK Luxury Highrise in Vesu VIP Road",
                    "locality": "Vesu",
                    "bhk": 3,
                    "price": 7200000,
                    "price_display": "₹72 L",
                    "area_sqft": 1500,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "semi-furnished",
                    "lat_offset": -0.015,
                    "lng_offset": -0.010,
                    "img": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80"
                },
                {
                    "title": "2 BHK Elegant Flat in Adajan",
                    "locality": "Adajan",
                    "bhk": 2,
                    "price": 4800000,
                    "price_display": "₹48 L",
                    "area_sqft": 1100,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "furnished",
                    "lat_offset": 0.010,
                    "lng_offset": -0.012,
                    "img": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"
                }
            ]
        },
        # Indore
        {
            "city": "Indore",
            "state": "Madhya Pradesh",
            "lat": 22.7196,
            "lng": 75.8577,
            "props": [
                {
                    "title": "3 BHK Spacious Apartment in Vijay Nagar",
                    "locality": "Vijay Nagar",
                    "bhk": 3,
                    "price": 6800000,
                    "price_display": "₹68 L",
                    "area_sqft": 1400,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "semi-furnished",
                    "lat_offset": 0.018,
                    "lng_offset": 0.015,
                    "img": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
                },
                {
                    "title": "2 BHK Modern Living on Super Corridor",
                    "locality": "Super Corridor",
                    "bhk": 2,
                    "price": 4500000,
                    "price_display": "₹45 L",
                    "area_sqft": 1050,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "unfurnished",
                    "lat_offset": 0.022,
                    "lng_offset": -0.010,
                    "img": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"
                }
            ]
        },
        # Noida
        {
            "city": "Noida",
            "state": "Uttar Pradesh",
            "lat": 28.5355,
            "lng": 77.3910,
            "props": [
                {
                    "title": "3 BHK Golf View Apartment in Sector 150",
                    "locality": "Sector 150",
                    "bhk": 3,
                    "price": 11500000,
                    "price_display": "₹1.15 Cr",
                    "area_sqft": 1600,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "semi-furnished",
                    "lat_offset": -0.025,
                    "lng_offset": 0.018,
                    "img": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
                },
                {
                    "title": "2 BHK Smart Tech Apartment in Sector 62",
                    "locality": "Sector 62",
                    "bhk": 2,
                    "price": 6800000,
                    "price_display": "₹68 L",
                    "area_sqft": 1050,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "furnished",
                    "lat_offset": 0.015,
                    "lng_offset": -0.010,
                    "img": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"
                }
            ]
        },
        # Gurgaon
        {
            "city": "Gurgaon",
            "state": "Haryana",
            "lat": 28.4595,
            "lng": 77.0266,
            "props": [
                {
                    "title": "4 BHK Ultra Luxury Tower on Golf Course Road",
                    "locality": "Golf Course Road",
                    "bhk": 4,
                    "price": 26000000,
                    "price_display": "₹2.6 Cr",
                    "area_sqft": 2500,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "furnished",
                    "lat_offset": 0.010,
                    "lng_offset": 0.015,
                    "img": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80"
                },
                {
                    "title": "3 BHK Premium Gated Flat in Sector 57",
                    "locality": "Sector 57",
                    "bhk": 3,
                    "price": 14500000,
                    "price_display": "₹1.45 Cr",
                    "area_sqft": 1650,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "semi-furnished",
                    "lat_offset": -0.012,
                    "lng_offset": 0.018,
                    "img": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
                }
            ]
        },
        # Jaipur
        {
            "city": "Jaipur",
            "state": "Rajasthan",
            "lat": 26.9124,
            "lng": 75.7873,
            "props": [
                {
                    "title": "3 BHK Royal Heritage Villa in Vaishali Nagar",
                    "locality": "Vaishali Nagar",
                    "bhk": 3,
                    "price": 8500000,
                    "price_display": "₹85 L",
                    "area_sqft": 1700,
                    "prop_type": "villa",
                    "listing_type": "buy",
                    "furnishing": "furnished",
                    "lat_offset": 0.010,
                    "lng_offset": -0.018,
                    "img": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"
                },
                {
                    "title": "2 BHK Contemporary Flat in Malviya Nagar",
                    "locality": "Malviya Nagar",
                    "bhk": 2,
                    "price": 5200000,
                    "price_display": "₹52 L",
                    "area_sqft": 1050,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "semi-furnished",
                    "lat_offset": -0.015,
                    "lng_offset": 0.012,
                    "img": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"
                }
            ]
        },
        # Nashik
        {
            "city": "Nashik",
            "state": "Maharashtra",
            "lat": 19.9975,
            "lng": 73.7898,
            "props": [
                {
                    "title": "3 BHK Scenic Vineyard Flat on Gangapur Road",
                    "locality": "Gangapur Road",
                    "bhk": 3,
                    "price": 6200000,
                    "price_display": "₹62 L",
                    "area_sqft": 1350,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "semi-furnished",
                    "lat_offset": 0.012,
                    "lng_offset": -0.015,
                    "img": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
                },
                {
                    "title": "2 BHK Serene Living in Indira Nagar",
                    "locality": "Indira Nagar",
                    "bhk": 2,
                    "price": 4200000,
                    "price_display": "₹42 L",
                    "area_sqft": 980,
                    "prop_type": "apartment",
                    "listing_type": "buy",
                    "furnishing": "furnished",
                    "lat_offset": -0.010,
                    "lng_offset": 0.010,
                    "img": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
                }
            ]
        },
        # Bhopal
        {
            "city": "Bhopal",
            "state": "Madhya Pradesh",
            "lat": 23.2599,
            "lng": 77.4126,
            "props": [
                {
                    "title": "3 BHK Lake Vista Villa in Arera Colony",
                    "locality": "Arera Colony",
                    "bhk": 3,
                    "price": 7500000,
                    "price_display": "₹75 L",
                    "area_sqft": 1600,
                    "prop_type": "villa",
                    "listing_type": "buy",
                    "furnishing": "semi-furnished",
                    "lat_offset": -0.015,
                    "lng_offset": 0.010,
                    "img": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80"
                }
            ]
        }
    ]

    added = 0
    for c in cities_data:
        cityName = c["city"]
        stateName = c["state"]
        cLat = c["lat"]
        cLng = c["lng"]

        for item in c["props"]:
            # Check if property title already exists
            existing = db.query(Property).filter(Property.title == item["title"]).first()
            if existing:
                continue

            prop = Property(
                title=item["title"],
                description=f"Verified premium property in {item['locality']}, {cityName}. Features high-speed connectivity, superior build quality, 24/7 security, and serene living environment.",
                property_type=item["prop_type"],
                listing_type=item["listing_type"],
                bhk=item["bhk"],
                area_sqft=float(item["area_sqft"]),
                price=float(item["price"]),
                price_display=item["price_display"],
                furnishing=item["furnishing"],
                amenities=["Gym", "Swimming Pool", "24/7 Power Backup", "Clubhouse", "Children Play Area", "CCTV Security"],
                address=f"Near City Center, {item['locality']}, {cityName}",
                locality=item["locality"],
                city=cityName,
                state=stateName,
                country="India",
                pincode="400001",
                latitude=round(cLat + item["lat_offset"], 6),
                longitude=round(cLng + item["lng_offset"], 6),
                status="available",
                is_verified=True,
                is_rera=True,
                badge="Verified Hub",
                match_score=94,
                rating=4.8,
                agent_id=agent_id,
                builder_id=builder_id,
                owner_id=owner_id,
                verification_status="VERIFIED"
            )
            db.add(prop)
            db.commit()
            db.refresh(prop)

            media = PropertyMedia(
                property_id=prop.id,
                media_type="image",
                media_category="exterior",
                url=item["img"],
                sort_order=0
            )
            db.add(media)
            db.commit()
            added += 1

    print(f"[*] Successfully added {added} verified properties across all major cities!")
    db.close()

if __name__ == "__main__":
    seed_cities()
