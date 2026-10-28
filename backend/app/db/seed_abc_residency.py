import os
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.project import Project, Building, Floor, Unit, UnitBooking, BookingAuditLog
from app.core.security import get_password_hash

def seed_abc_residency():
    print("Seeding ABC Residency (20 Floors, 8 Units/Floor, Flat 20-C, Flat 10-B)...")
    db: Session = SessionLocal()
    try:
        # Find or create a builder user
        builder = db.query(User).filter(User.role == UserRole.BUILDER).first()
        if not builder:
            builder = User(
                email="builder.abc@saiurban.com",
                hashed_password=get_password_hash("Builder@123"),
                full_name="ABC Infrastructure Developers",
                role=UserRole.BUILDER,
                is_active=True,
                is_verified=True,
                phone="+91 98230 11223"
            )
            db.add(builder)
            db.flush()

        # Check if ABC Residency already exists
        project = db.query(Project).filter(Project.name == "ABC Residency").first()
        if not project:
            project = Project(
                builder_id=builder.id,
                name="ABC Residency",
                description="Ultra-premium smart residential township featuring high-rise towers, panoramic skyline views, 3D interactive discovery, clubhouse, infinity pool, and advanced IoT integration.",
                address="Camp Road, Opposite City Park, Amravati",
                locality="Camp Road",
                city="Amravati",
                state="Maharashtra",
                country="India",
                pincode="444602",
                latitude=20.9374,
                longitude=77.7796,
                construction_status="Under Construction",
                expected_completion_date="December 2027",
                amenities=[
                    "3D Virtual Walkthrough Enabled",
                    "Infinity Rooftop Pool",
                    "Clubhouse & Gymnasium",
                    "Landscaped Sky Gardens",
                    "High-speed Smart Elevators",
                    "EV Charging Bays",
                    "24/7 Smart AI Security",
                    "Kids Play Zone",
                    "Jogging Track"
                ],
                status="active"
            )
            db.add(project)
            db.flush()
        else:
            project.city = "Amravati"
            project.locality = "Camp Road"

        # Check or create Tower A
        tower_a = db.query(Building).filter(Building.project_id == project.id, Building.name == "Tower A").first()
        if not tower_a:
            tower_a = Building(
                project_id=project.id,
                name="Tower A",
                code="A",
                floors_count=20,
                units_per_floor=8,
                total_units=160,
                description="Iconic 20-storey luxury tower offering 2, 3 and 4 BHK air-conditioned smart homes with panoramic skyline and garden vistas.",
                status="Under Construction",
                floor_height=3.2,
                building_width=42.0,
                building_depth=26.0,
                orientation=0.0, # 0 deg = North
                front_direction="North",
                entrance_position="North",
                parking_levels=2,
                amenities=["Triple-height Entrance Lobby", "High-speed Lifts", "Terrace Observatory", "Sky Lounge"]
            )
            db.add(tower_a)
            db.flush()
        else:
            tower_a.floors_count = 20
            tower_a.units_per_floor = 8
            tower_a.total_units = 160

        # Check or create Tower B (to test tower switching)
        tower_b = db.query(Building).filter(Building.project_id == project.id, Building.name == "Tower B").first()
        if not tower_b:
            tower_b = Building(
                project_id=project.id,
                name="Tower B",
                code="B",
                floors_count=15,
                units_per_floor=6,
                total_units=90,
                description="Contemporary 15-storey residential tower overlooking central landscaped courtyard and water features.",
                status="Under Construction",
                floor_height=3.2,
                building_width=36.0,
                building_depth=24.0,
                orientation=90.0, # Facing East
                front_direction="East",
                entrance_position="East",
                parking_levels=2,
                amenities=["Double-height Lobby", "Dedicated Lifts", "Yoga Deck"]
            )
            db.add(tower_b)
            db.flush()

        # Ensure all 20 floors exist for Tower A
        existing_floors_a = {f.floor_number: f for f in db.query(Floor).filter(Floor.building_id == tower_a.id).all()}
        for fn in range(1, 21):
            if fn not in existing_floors_a:
                fl = Floor(
                    building_id=tower_a.id,
                    floor_number=fn,
                    floor_label=f"Floor {fn}" if fn < 20 else "Floor 20 - Sky Suites",
                    floor_type="residential" if fn < 20 else "penthouse",
                    height_offset=(fn - 1) * 3.2
                )
                db.add(fl)
                db.flush()
                existing_floors_a[fn] = fl

        # Generate units for Tower A: 20 floors x 8 units (A, B, C, D, E, F, G, H)
        unit_configs = [
            {"code": "A", "bhk": 2, "bedrooms": 2, "bathrooms": 2, "balconies": 1, "area": 1050.0, "built_up": 1200.0, "base_price": 6800000.0, "dir": "North", "ent_dir": "South", "balc_dir": "North", "pos_x": -14.0, "pos_z": -7.5},
            {"code": "B", "bhk": 2, "bedrooms": 2, "bathrooms": 2, "balconies": 1, "area": 1100.0, "built_up": 1250.0, "base_price": 7150000.0, "dir": "West", "ent_dir": "East", "balc_dir": "West", "pos_x": -5.0, "pos_z": -7.5},
            {"code": "C", "bhk": 3, "bedrooms": 3, "bathrooms": 2, "balconies": 2, "area": 1450.0, "built_up": 1650.0, "base_price": 8850000.0, "dir": "East", "ent_dir": "North", "balc_dir": "East", "pos_x": 5.0, "pos_z": -7.5},
            {"code": "D", "bhk": 3, "bedrooms": 3, "bathrooms": 3, "balconies": 2, "area": 1550.0, "built_up": 1780.0, "base_price": 9500000.0, "dir": "North-East", "ent_dir": "South", "balc_dir": "North-East", "pos_x": 14.0, "pos_z": -7.5},
            {"code": "E", "bhk": 4, "bedrooms": 4, "bathrooms": 3, "balconies": 3, "area": 1950.0, "built_up": 2200.0, "base_price": 12500000.0, "dir": "South-East", "ent_dir": "North", "balc_dir": "South-East", "pos_x": 14.0, "pos_z": 7.5},
            {"code": "F", "bhk": 3, "bedrooms": 3, "bathrooms": 2, "balconies": 2, "area": 1420.0, "built_up": 1620.0, "base_price": 8700000.0, "dir": "South", "ent_dir": "North", "balc_dir": "South", "pos_x": 5.0, "pos_z": 7.5},
            {"code": "G", "bhk": 2, "bedrooms": 2, "bathrooms": 2, "balconies": 1, "area": 1120.0, "built_up": 1280.0, "base_price": 7250000.0, "dir": "South-West", "ent_dir": "East", "balc_dir": "South-West", "pos_x": -5.0, "pos_z": 7.5},
            {"code": "H", "bhk": 1, "bedrooms": 1, "bathrooms": 1, "balconies": 1, "area": 680.0, "built_up": 780.0, "base_price": 4500000.0, "dir": "West", "ent_dir": "East", "balc_dir": "West", "pos_x": -14.0, "pos_z": 7.5},
        ]

        # Fetch existing units in Tower A
        existing_units_a = {(u.floor_number, u.unit_number): u for u in db.query(Unit).filter(Unit.tower_id == tower_a.id).all()}

        for fn in range(1, 21):
            fl = existing_floors_a[fn]
            floor_price_premium = (fn - 1) * 35000.0 # Floor rise premium

            for cfg in unit_configs:
                u_code = cfg["code"]
                key = (fn, u_code)
                u_num = f"{fn}-{u_code}"
                final_price = cfg["base_price"] + floor_price_premium

                # Determine status variation for realistic test
                # Requirement: Flat 20-C MUST be AVAILABLE!
                # Flat 10-B MUST be AVAILABLE!
                if fn == 20 and u_code == "C":
                    status_val = "available"
                elif fn == 10 and u_code == "B":
                    status_val = "available"
                elif fn == 20 and u_code == "A":
                    status_val = "reserved"
                elif fn == 20 and u_code == "B":
                    status_val = "booked"
                elif fn == 20 and u_code == "D":
                    status_val = "sold"
                elif fn == 20 and u_code == "E":
                    status_val = "blocked"
                elif fn % 4 == 0 and u_code in ["A", "D"]:
                    status_val = "booked"
                elif fn % 5 == 0 and u_code == "E":
                    status_val = "sold"
                elif fn % 3 == 0 and u_code == "G":
                    status_val = "reserved"
                elif fn == 1 and u_code == "H":
                    status_val = "blocked"
                else:
                    status_val = "available"

                if key in existing_units_a:
                    u = existing_units_a[key]
                    u.floor_id = fl.id
                    u.floor_number = fn
                    u.unit_number = u_code
                    u.unit_label = f"Flat {u_num}"
                    u.bhk = cfg["bhk"]
                    u.bedrooms = cfg["bedrooms"]
                    u.bathrooms = cfg["bathrooms"]
                    u.balconies = cfg["balconies"]
                    u.area_sqft = cfg["area"]
                    u.carpet_area = cfg["area"]
                    u.built_up_area = cfg["built_up"]
                    u.price = final_price
                    u.direction = cfg["dir"]
                    u.entrance_direction = cfg["ent_dir"]
                    u.balcony_direction = cfg["balc_dir"]
                    u.position_x = cfg["pos_x"]
                    u.position_y = (fn - 1) * 3.2
                    u.position_z = cfg["pos_z"]
                    u.status = status_val
                else:
                    u = Unit(
                        project_id=project.id,
                        tower_id=tower_a.id,
                        floor_id=fl.id,
                        floor_number=fn,
                        unit_number=u_code,
                        unit_label=f"Flat {u_num}",
                        bhk=cfg["bhk"],
                        bedrooms=cfg["bedrooms"],
                        bathrooms=cfg["bathrooms"],
                        balconies=cfg["balconies"],
                        area_sqft=cfg["area"],
                        carpet_area=cfg["area"],
                        built_up_area=cfg["built_up"],
                        price=final_price,
                        parking="1 Covered",
                        direction=cfg["dir"],
                        entrance_direction=cfg["ent_dir"],
                        balcony_direction=cfg["balc_dir"],
                        position_x=cfg["pos_x"],
                        position_y=(fn - 1) * 3.2,
                        position_z=cfg["pos_z"],
                        wing="North Corridor" if cfg["pos_z"] < 0 else "South Corridor",
                        status=status_val
                    )
                    db.add(u)

        # Seed Tower B floors and sample units
        existing_floors_b = {f.floor_number: f for f in db.query(Floor).filter(Floor.building_id == tower_b.id).all()}
        for fn in range(1, 16):
            if fn not in existing_floors_b:
                fl = Floor(
                    building_id=tower_b.id,
                    floor_number=fn,
                    floor_label=f"Floor {fn}",
                    floor_type="residential",
                    height_offset=(fn - 1) * 3.2
                )
                db.add(fl)
                db.flush()
                existing_floors_b[fn] = fl

        existing_units_b = {(u.floor_number, u.unit_number): u for u in db.query(Unit).filter(Unit.tower_id == tower_b.id).all()}
        b_unit_configs = [
            {"code": "1", "bhk": 2, "bedrooms": 2, "bathrooms": 2, "balconies": 1, "area": 1150.0, "built_up": 1300.0, "base_price": 7500000.0, "dir": "East", "ent_dir": "West", "balc_dir": "East", "pos_x": -10.0, "pos_z": -6.0},
            {"code": "2", "bhk": 3, "bedrooms": 3, "bathrooms": 2, "balconies": 2, "area": 1400.0, "built_up": 1600.0, "base_price": 8900000.0, "dir": "East", "ent_dir": "West", "balc_dir": "East", "pos_x": 0.0, "pos_z": -6.0},
            {"code": "3", "bhk": 3, "bedrooms": 3, "bathrooms": 3, "balconies": 2, "area": 1500.0, "built_up": 1720.0, "base_price": 9400000.0, "dir": "North", "ent_dir": "South", "balc_dir": "North", "pos_x": 10.0, "pos_z": -6.0},
            {"code": "4", "bhk": 2, "bedrooms": 2, "bathrooms": 2, "balconies": 1, "area": 1100.0, "built_up": 1250.0, "base_price": 7200000.0, "dir": "West", "ent_dir": "East", "balc_dir": "West", "pos_x": 10.0, "pos_z": 6.0},
            {"code": "5", "bhk": 2, "bedrooms": 2, "bathrooms": 2, "balconies": 1, "area": 1080.0, "built_up": 1220.0, "base_price": 7100000.0, "dir": "West", "ent_dir": "East", "balc_dir": "West", "pos_x": 0.0, "pos_z": 6.0},
            {"code": "6", "bhk": 1, "bedrooms": 1, "bathrooms": 1, "balconies": 1, "area": 690.0, "built_up": 800.0, "base_price": 4600000.0, "dir": "South", "ent_dir": "North", "balc_dir": "South", "pos_x": -10.0, "pos_z": 6.0},
        ]
        for fn in range(1, 16):
            fl = existing_floors_b[fn]
            for cfg in b_unit_configs:
                u_code = cfg["code"]
                key = (fn, u_code)
                u_num = f"{fn}-{u_code}"
                if key not in existing_units_b:
                    u = Unit(
                        project_id=project.id,
                        tower_id=tower_b.id,
                        floor_id=fl.id,
                        floor_number=fn,
                        unit_number=u_code,
                        unit_label=f"Flat {u_num}",
                        bhk=cfg["bhk"],
                        bedrooms=cfg["bedrooms"],
                        bathrooms=cfg["bathrooms"],
                        balconies=cfg["balconies"],
                        area_sqft=cfg["area"],
                        carpet_area=cfg["area"],
                        built_up_area=cfg["built_up"],
                        price=cfg["base_price"] + (fn - 1) * 30000.0,
                        parking="1 Covered",
                        direction=cfg["dir"],
                        entrance_direction=cfg["ent_dir"],
                        balcony_direction=cfg["balc_dir"],
                        position_x=cfg["pos_x"],
                        position_y=(fn - 1) * 3.2,
                        position_z=cfg["pos_z"],
                        status="available" if (fn + int(u_code)) % 3 != 0 else "booked"
                    )
                    db.add(u)

        db.commit()
        print(f"Successfully seeded ABC Residency! Project ID: {project.id}, Tower A ID: {tower_a.id}, Tower B ID: {tower_b.id}")

        # Verify Flat 20-C specifically
        flat_20c = db.query(Unit).filter(Unit.tower_id == tower_a.id, Unit.floor_number == 20, Unit.unit_number == "C").first()
        if flat_20c:
            print(f"Verified Flat 20-C: ID={flat_20c.id}, Label={flat_20c.unit_label}, BHK={flat_20c.bhk}, Area={flat_20c.area_sqft}, Price=Rs.{flat_20c.price}, Direction={flat_20c.direction}, Status={flat_20c.status}")

        flat_10b = db.query(Unit).filter(Unit.tower_id == tower_a.id, Unit.floor_number == 10, Unit.unit_number == "B").first()
        if flat_10b:
            print(f"Verified Flat 10-B: ID={flat_10b.id}, Label={flat_10b.unit_label}, BHK={flat_10b.bhk}, Area={flat_10b.area_sqft}, Price=Rs.{flat_10b.price}, Direction={flat_10b.direction}, Status={flat_10b.status}")

    except Exception as e:
        db.rollback()
        print(f"Error seeding ABC Residency: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_abc_residency()
