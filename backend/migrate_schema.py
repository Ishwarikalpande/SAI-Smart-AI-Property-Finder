import sqlite3

def run():
    con = sqlite3.connect('sai.db')
    cur = con.cursor()

    def add_col_if_missing(table, col, col_type):
        cur.execute(f'PRAGMA table_info({table})')
        cols = [r[1] for r in cur.fetchall()]
        if col not in cols:
            print(f'Adding {col} to {table}')
            cur.execute(f'ALTER TABLE {table} ADD COLUMN {col} {col_type}')

    add_col_if_missing('properties', 'views_count', 'INTEGER DEFAULT 0')
    add_col_if_missing('properties', 'saves_count', 'INTEGER DEFAULT 0')
    add_col_if_missing('properties', 'verification_status', 'VARCHAR(50) DEFAULT "PENDING"')

    add_col_if_missing('agent_profiles', 'rating', 'FLOAT DEFAULT 4.9')
    add_col_if_missing('agent_profiles', 'review_count', 'INTEGER DEFAULT 24')
    add_col_if_missing('agent_profiles', 'city', 'VARCHAR(100) DEFAULT "Pune"')
    add_col_if_missing('agent_profiles', 'areas_served', 'JSON DEFAULT "[]"')
    add_col_if_missing('agent_profiles', 'languages', 'JSON DEFAULT "[\'English\', \'Hindi\', \'Marathi\']"')
    add_col_if_missing('agent_profiles', 'bio', 'TEXT')
    add_col_if_missing('agent_profiles', 'profile_image', 'VARCHAR(500)')
    add_col_if_missing('agent_profiles', 'notification_settings', 'JSON DEFAULT "{}"')
    add_col_if_missing('agent_profiles', 'privacy_settings', 'JSON DEFAULT "{}"')
    add_col_if_missing('agent_profiles', 'verification_status', 'VARCHAR(50) DEFAULT "PENDING"')

    add_col_if_missing('builder_profiles', 'rera_id', 'VARCHAR(100)')
    add_col_if_missing('builder_profiles', 'support_email', 'VARCHAR(255)')
    add_col_if_missing('builder_profiles', 'city', 'VARCHAR(100) DEFAULT "Pune"')
    add_col_if_missing('builder_profiles', 'company_type', 'VARCHAR(100) DEFAULT "Real Estate Developer"')
    add_col_if_missing('builder_profiles', 'rating', 'FLOAT DEFAULT 4.8')
    add_col_if_missing('builder_profiles', 'notification_settings', 'JSON DEFAULT "{}"')
    add_col_if_missing('builder_profiles', 'privacy_settings', 'JSON DEFAULT "{}"')
    add_col_if_missing('builder_profiles', 'verification_status', 'VARCHAR(50) DEFAULT "PENDING"')

    con.commit()
    con.close()
    print("Columns synced successfully!")

if __name__ == '__main__':
    run()
