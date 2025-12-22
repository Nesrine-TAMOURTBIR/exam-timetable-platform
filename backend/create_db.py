import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv

load_dotenv()

# Parse DATABASE_URL manually or create a new connection string to 'postgres' db
# DATABASE_URL=postgresql+asyncpg://postgres:Nesrine5%23*@localhost/exam_db
# We need strictly sync psycopg2 connection to 'postgres'
password = "Nesrine5#*" # Raw password
user = "postgres"
host = "localhost"

# Connect to default 'postgres' database
try:
    con = psycopg2.connect(dbname='postgres', user=user, host=host, password=password)
    con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = con.cursor()
    
    # Check if exists
    cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'exam_db'")
    exists = cur.fetchone()
    if not exists:
        print("Creating database exam_db...")
        cur.execute('CREATE DATABASE exam_db')
        print("Database created.")
    else:
        print("Database exam_db already exists.")
        
    cur.close()
    con.close()
except Exception as e:
    print(f"Error creating database: {e}")
