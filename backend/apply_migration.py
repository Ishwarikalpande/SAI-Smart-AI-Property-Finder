import sqlite3
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(backend_dir, "sai.db")

def migrate():
    con = sqlite3.connect(db_path)
    cur = con.cursor()

    def add_col_if_missing(table, col, col_type):
        cur.execute(f"PRAGMA table_info({table})")
        cols = [r[1] for r in cur.fetchall()]
        if col not in cols:
            print(f"Adding column '{col}' to table '{table}'")
            cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")

    # Buildings
    add_col_if_missing("buildings", "code", "VARCHAR(50)")
    add_col_if_missing("buildings", "floors_count", "INTEGER DEFAULT 10")
    add_col_if_missing("buildings", "units_per_floor", "INTEGER DEFAULT 4")
    add_col_if_missing("buildings", "total_units", "INTEGER DEFAULT 40")
    add_col_if_missing("buildings", "description", "TEXT")
    add_col_if_missing("buildings", "status", "VARCHAR(50) DEFAULT 'Under Construction'")

    # Units
    add_col_if_missing("units", "tower_id", "INTEGER")
    add_col_if_missing("units", "floor_number", "INTEGER DEFAULT 1")

    # Enquiries
    add_col_if_missing("enquiries", "project_id", "INTEGER")
    add_col_if_missing("enquiries", "tower_id", "INTEGER")
    add_col_if_missing("enquiries", "unit_id", "INTEGER")
    add_col_if_missing("enquiries", "budget", "VARCHAR(100)")

    # Promotions
    add_col_if_missing("listing_promotions", "project_id", "INTEGER")

    con.commit()
    con.close()
    print("[OK] Schema updated successfully in sai.db")

    # Run create_all to create any new tables (like property_views)
    from app.db.session import engine
    from app.db.base import Base
    Base.metadata.create_all(bind=engine)
    print("[OK] Base.metadata.create_all completed")

if __name__ == "__main__":
    migrate()
