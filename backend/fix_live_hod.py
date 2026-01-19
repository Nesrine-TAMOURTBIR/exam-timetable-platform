from sqlalchemy import create_engine, text
from passlib.context import CryptContext

# Connection
db_url = "postgresql://exam_db_7br4_user:ntSPKYfZplyNAqdc46pmQoGVxz7vdrHc@dpg-d5f46fali9vc73dbgpkg-a.frankfurt-postgres.render.com/exam_db_7br4"
engine = create_engine(db_url)

# Fallback string for demo data
fixed_hash = "hashed_secret"

def fix_hod():
    print(f"Fixing Schema and HOD on {db_url}...")
    with engine.connect() as conn:
        # 1. Fix Schema if missing columns
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id INTEGER"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS program_id INTEGER"))
            conn.commit()
            print("Schema updated (added columns if missing).")
        except Exception as e:
            print(f"Schema update notice: {e}")

        # 2. Update Password & Role & Dept for User
        update_user = text("""
            UPDATE users 
            SET hashed_password = :hash, 
                role = 'head',
                department_id = 1
            WHERE email = 'head@example.com'
        """)
        conn.execute(update_user, {"hash": fixed_hash})
        conn.commit()
        print("User password & role updated.")

        # 2. Check if user exists (to get ID)
        res = conn.execute(text("SELECT id FROM users WHERE email = 'head@example.com'"))
        user = res.fetchone()
        if not user:
            print("ERROR: User head@example.com not found!")
            return
        
        user_id = user[0]
        print(f"User ID is {user_id}")

        # 3. Ensure Professor Profile exists
        res = conn.execute(text("SELECT id FROM professors WHERE user_id = :uid"), {"uid": user_id})
        prof = res.fetchone()
        if not prof:
            print("Creating Professor profile for HOD...")
            conn.execute(text("INSERT INTO professors (user_id, department_id) VALUES (:uid, 1)"), {"uid": user_id})
            conn.commit()
        else:
            print("Professor profile already exists. Updating department...")
            conn.execute(text("UPDATE professors SET department_id = 1 WHERE user_id = :uid"), {"uid": user_id})
            conn.commit()

        print("HOD Fix Complete!")

if __name__ == "__main__":
    fix_hod()
