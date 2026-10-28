import sqlite3
import os
import sys
from sqlalchemy import inspect, text
from app.db.session import engine, Base
import app.models # Ensure all models are loaded

def run_migration():
    print("Running migration for 3D Building, Floor, Unit and Booking tables...")
    # First, run create_all to create any non-existent tables (like unit_bookings and booking_audit_logs)
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)

    # Check columns in 'projects'
    project_cols = {c['name']: c for c in inspector.get_columns('projects')}
    with engine.begin() as conn:
        if 'metadata_json' not in project_cols:
            print("Adding metadata_json to projects...")
            conn.execute(text("ALTER TABLE projects ADD COLUMN metadata_json JSON DEFAULT '{}'"))

    # Check columns in 'buildings'
    bld_cols = {c['name']: c for c in inspector.get_columns('buildings')}
    with engine.begin() as conn:
        if 'floor_height' not in bld_cols:
            print("Adding floor_height to buildings...")
            conn.execute(text("ALTER TABLE buildings ADD COLUMN floor_height FLOAT DEFAULT 3.2"))
        if 'building_width' not in bld_cols:
            print("Adding building_width to buildings...")
            conn.execute(text("ALTER TABLE buildings ADD COLUMN building_width FLOAT DEFAULT 36.0"))
        if 'building_depth' not in bld_cols:
            print("Adding building_depth to buildings...")
            conn.execute(text("ALTER TABLE buildings ADD COLUMN building_depth FLOAT DEFAULT 24.0"))
        if 'orientation' not in bld_cols:
            print("Adding orientation to buildings...")
            conn.execute(text("ALTER TABLE buildings ADD COLUMN orientation FLOAT DEFAULT 0.0"))
        if 'front_direction' not in bld_cols:
            print("Adding front_direction to buildings...")
            conn.execute(text("ALTER TABLE buildings ADD COLUMN front_direction VARCHAR(50) DEFAULT 'North'"))
        if 'entrance_position' not in bld_cols:
            print("Adding entrance_position to buildings...")
            conn.execute(text("ALTER TABLE buildings ADD COLUMN entrance_position VARCHAR(50) DEFAULT 'North'"))
        if 'parking_levels' not in bld_cols:
            print("Adding parking_levels to buildings...")
            conn.execute(text("ALTER TABLE buildings ADD COLUMN parking_levels INTEGER DEFAULT 2"))
        if 'amenities' not in bld_cols:
            print("Adding amenities to buildings...")
            conn.execute(text("ALTER TABLE buildings ADD COLUMN amenities JSON DEFAULT '[]'"))

    # Check columns in 'floors'
    floor_cols = {c['name']: c for c in inspector.get_columns('floors')}
    with engine.begin() as conn:
        if 'floor_label' not in floor_cols:
            print("Adding floor_label to floors...")
            conn.execute(text("ALTER TABLE floors ADD COLUMN floor_label VARCHAR(50)"))
        if 'floor_type' not in floor_cols:
            print("Adding floor_type to floors...")
            conn.execute(text("ALTER TABLE floors ADD COLUMN floor_type VARCHAR(50) DEFAULT 'residential'"))
        if 'height_offset' not in floor_cols:
            print("Adding height_offset to floors...")
            conn.execute(text("ALTER TABLE floors ADD COLUMN height_offset FLOAT"))
        if 'metadata_json' not in floor_cols:
            print("Adding metadata_json to floors...")
            conn.execute(text("ALTER TABLE floors ADD COLUMN metadata_json JSON DEFAULT '{}'"))

    # Check columns in 'units'
    unit_cols = {c['name']: c for c in inspector.get_columns('units')}
    with engine.begin() as conn:
        if 'unit_label' not in unit_cols:
            print("Adding unit_label to units...")
            conn.execute(text("ALTER TABLE units ADD COLUMN unit_label VARCHAR(50)"))
        if 'bedrooms' not in unit_cols:
            print("Adding bedrooms to units...")
            conn.execute(text("ALTER TABLE units ADD COLUMN bedrooms INTEGER"))
        if 'bathrooms' not in unit_cols:
            print("Adding bathrooms to units...")
            conn.execute(text("ALTER TABLE units ADD COLUMN bathrooms INTEGER DEFAULT 2"))
        if 'balconies' not in unit_cols:
            print("Adding balconies to units...")
            conn.execute(text("ALTER TABLE units ADD COLUMN balconies INTEGER DEFAULT 1"))
        if 'built_up_area' not in unit_cols:
            print("Adding built_up_area to units...")
            conn.execute(text("ALTER TABLE units ADD COLUMN built_up_area FLOAT"))
        if 'direction' not in unit_cols:
            print("Adding direction to units...")
            conn.execute(text("ALTER TABLE units ADD COLUMN direction VARCHAR(50) DEFAULT 'East'"))
        if 'entrance_direction' not in unit_cols:
            print("Adding entrance_direction to units...")
            conn.execute(text("ALTER TABLE units ADD COLUMN entrance_direction VARCHAR(50) DEFAULT 'North'"))
        if 'balcony_direction' not in unit_cols:
            print("Adding balcony_direction to units...")
            conn.execute(text("ALTER TABLE units ADD COLUMN balcony_direction VARCHAR(50) DEFAULT 'East'"))
        if 'position_x' not in unit_cols:
            print("Adding position_x to units...")
            conn.execute(text("ALTER TABLE units ADD COLUMN position_x FLOAT DEFAULT 0.0"))
        if 'position_y' not in unit_cols:
            print("Adding position_y to units...")
            conn.execute(text("ALTER TABLE units ADD COLUMN position_y FLOAT DEFAULT 0.0"))
        if 'position_z' not in unit_cols:
            print("Adding position_z to units...")
            conn.execute(text("ALTER TABLE units ADD COLUMN position_z FLOAT DEFAULT 0.0"))
        if 'wing' not in unit_cols:
            print("Adding wing to units...")
            conn.execute(text("ALTER TABLE units ADD COLUMN wing VARCHAR(50)"))
        if 'floor_plan_url' not in unit_cols:
            print("Adding floor_plan_url to units...")
            conn.execute(text("ALTER TABLE units ADD COLUMN floor_plan_url VARCHAR(500)"))
        if 'floor_plan_data' not in unit_cols:
            print("Adding floor_plan_data to units...")
            conn.execute(text("ALTER TABLE units ADD COLUMN floor_plan_data JSON DEFAULT '{}'"))
        if 'config_3d_id' not in unit_cols:
            print("Adding config_3d_id to units...")
            conn.execute(text("ALTER TABLE units ADD COLUMN config_3d_id INTEGER"))
        if 'metadata_json' not in unit_cols:
            print("Adding metadata_json to units...")
            conn.execute(text("ALTER TABLE units ADD COLUMN metadata_json JSON DEFAULT '{}'"))

    print("Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
