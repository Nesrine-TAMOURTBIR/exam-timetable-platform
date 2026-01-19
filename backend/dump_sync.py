import os
from sqlalchemy import create_engine, text, inspect
import datetime

# Get connection string from .env manually to be safe
db_url = "postgresql://exam_db_7br4_user:ntSPKYfZplyNAqdc46pmQoGVxz7vdrHc@dpg-d5f46fali9vc73dbgpkg-a.frankfurt-postgres.render.com/exam_db_7br4"

# Use psycopg2 or similar (sync)
# postgresql://user:pass@host/db
engine = create_engine(db_url)

TABLES = [
    'departments',
    'programs',
    'users',
    'professors',
    'students',
    'rooms',
    'modules',
    'enrollments',
    'exams',
    'timetable_entries'
]

def export_sync():
    output_file = "live_database_dump.sql"
    print(f"Connecting to: {db_url}")
    
    with engine.connect() as conn:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("-- Live Data Export (Sync)\n")
            f.write("SET statement_timeout = 0;\n\n")
            
            for table_name in TABLES:
                print(f"Exporting {table_name}...")
                res = conn.execute(text(f"SELECT * FROM {table_name}"))
                rows = res.fetchall()
                cols = res.keys()
                
                f.write(f"-- TABLE: {table_name} ({len(rows)} records)\n")
                if not rows:
                    f.write("\n")
                    continue
                
                col_str = ", ".join(cols)
                for row in rows:
                    vals = []
                    for val in row:
                        if val is None:
                            vals.append("NULL")
                        elif isinstance(val, (int, float)):
                            vals.append(str(val))
                        elif isinstance(val, bool):
                            vals.append("TRUE" if val else "FALSE")
                        elif isinstance(val, (datetime.datetime, datetime.date)):
                            vals.append(f"'{val.isoformat()}'")
                        else:
                            escaped = str(val).replace("'", "''")
                            vals.append(f"'{escaped}'")
                    
                    val_str = ", ".join(vals)
                    f.write(f"INSERT INTO {table_name} ({col_str}) VALUES ({val_str});\n")
                f.write("\n")

    print(f"Export complete: {output_file}")

if __name__ == "__main__":
    export_sync()
