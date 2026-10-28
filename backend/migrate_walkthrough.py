import sqlite3
from app.db.session import engine, Base
from app.models import PropertyWalkthrough, PropertyMedia

def run():
    # 1. First ensure tables defined in SQLAlchemy are created if not present
    Base.metadata.create_all(bind=engine)
    print("Base metadata tables checked/created.")

    # 2. Check SQLite columns if using SQLite
    try:
        con = sqlite3.connect('sai.db')
        cur = con.cursor()

        def add_col_if_missing(table, col, col_type):
            cur.execute(f"PRAGMA table_info({table})")
            cols = [r[1] for r in cur.fetchall()]
            if col not in cols:
                print(f"Adding {col} ({col_type}) to {table}")
                cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")

        add_col_if_missing('property_media', 'media_category', "VARCHAR(50) DEFAULT 'other'")
        add_col_if_missing('property_media', 'thumbnail_url', "VARCHAR(1000)")
        add_col_if_missing('property_media', 'updated_at', "DATETIME")

        con.commit()
        con.close()
        print("SQLite column migration complete.")
    except Exception as e:
        print("Note: SQLite manual column check exception (might be postgres or already done):", e)

if __name__ == '__main__':
    run()
