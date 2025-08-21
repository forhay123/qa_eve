import psycopg2
from passlib.context import CryptContext

# ---------------- CONFIG ----------------
DB_HOST = "dpg-d2iqaoili9vc73b7r9p0-a.oregon-postgres.render.com"
DB_PORT = 5432
DB_NAME = "qa_eve_db"
DB_USER = "qa_eve_db_user"
DB_PASSWORD = "aqLRiDfyv4EfAsoieVUfJMTfEu1gNC0c"  # <-- Replace with your DB password

ADMIN_USERNAME = "admin"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin@123"  # <-- Change if you want
ADMIN_FULLNAME = "Administrator"
# ----------------------------------------

# Hash the password
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed_password = pwd_context.hash(ADMIN_PASSWORD)

try:
    # Connect to PostgreSQL
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    cursor = conn.cursor()

    # Insert admin user
    insert_query = """
    INSERT INTO users (username, email, hashed_password, role, full_name)
    VALUES (%s, %s, %s, %s, %s)
    ON CONFLICT (username) DO NOTHING;
    """
    cursor.execute(insert_query, (ADMIN_USERNAME, ADMIN_EMAIL, hashed_password, "admin", ADMIN_FULLNAME))
    conn.commit()

    print("✅ Admin user created successfully!")

except Exception as e:
    print("❌ Error:", e)

finally:
    if cursor:
        cursor.close()
    if conn:
        conn.close()
