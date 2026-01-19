import os
import csv
from sqlalchemy import create_engine, text

db_url = "postgresql://exam_db_7br4_user:ntSPKYfZplyNAqdc46pmQoGVxz7vdrHc@dpg-d5f46fali9vc73dbgpkg-a.frankfurt-postgres.render.com/exam_db_7br4"
engine = create_engine(db_url)

def export_csv_lists():
    print("Exporting data to CSV...")
    with engine.connect() as conn:
        # 1. Students List
        print("Fetching Students...")
        res = conn.execute(text("""
            SELECT u.id, u.full_name, u.email, p.name as program_name, d.name as department_name
            FROM users u
            JOIN students s ON u.id = s.user_id
            JOIN programs p ON s.program_id = p.id
            JOIN departments d ON p.department_id = d.id
            WHERE u.role = 'student'
            ORDER BY u.full_name
        """))
        students = res.fetchall()
        
        with open("students_list.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["ID", "Full Name", "Email", "Program", "Department"])
            for row in students:
                writer.writerow(row)
        print(f"Exported {len(students)} students.")

        # 2. Professors List
        print("Fetching Professors...")
        res = conn.execute(text("""
            SELECT u.id, u.full_name, u.email, d.name as department_name
            FROM users u
            JOIN professors p ON u.id = p.user_id
            LEFT JOIN departments d ON p.department_id = d.id
            WHERE u.role = 'professor' OR u.role = 'head'
            ORDER BY u.full_name
        """))
        profs = res.fetchall()
        
        with open("professors_list.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["ID", "Full Name", "Email", "Department"])
            for row in profs:
                writer.writerow(row)
        print(f"Exported {len(profs)} professors.")

if __name__ == "__main__":
    export_csv_lists()
