import asyncio
import os
from sqlalchemy import select, text
from app.db.session import AsyncSessionLocal
from app.models.all_models import Base, Department, Program, User, Professor, Student, Room, Module, Enrollment, Exam, TimetableEntry

TABLES = [
    ('departments', Department),
    ('programs', Program),
    ('users', User),
    ('professors', Professor),
    ('students', Student),
    ('rooms', Room),
    ('modules', Module),
    ('enrollments', Enrollment),
    ('exams', Exam),
    ('timetable_entries', TimetableEntry)
]

async def export_data():
    output_file = "live_database_dump.sql"
    async with AsyncSessionLocal() as session:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("-- Live Data Export from Render\n")
            f.write("SET statement_timeout = 0;\n")
            f.write("SET lock_timeout = 0;\n\n")
            
            for table_name, model in TABLES:
                print(f"Exporting {table_name}...")
                result = await session.execute(select(model))
                rows = result.scalars().all()
                
                f.write(f"-- TABLE: {table_name} ({len(rows)} records)\n")
                if not rows:
                    f.write(f"-- No data in {table_name}\n\n")
                    continue
                
                # Get columns
                columns = [c.name for c in model.__table__.columns]
                col_str = ", ".join(columns)
                
                for row in rows:
                    vals = []
                    for col in columns:
                        val = getattr(row, col)
                        if val is None:
                            vals.append("NULL")
                        elif isinstance(val, (int, float)):
                            vals.append(str(val))
                        elif isinstance(val, bool):
                            vals.append("TRUE" if val else "FALSE")
                        else:
                            # Escape single quotes
                            escaped = str(val).replace("'", "''")
                            vals.append(f"'{escaped}'")
                    
                    val_str = ", ".join(vals)
                    f.write(f"INSERT INTO {table_name} ({col_str}) VALUES ({val_str});\n")
                f.write("\n")
                
    print(f"Export complete: {output_file}")

if __name__ == "__main__":
    asyncio.run(export_data())
