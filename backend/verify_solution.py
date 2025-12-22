import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def verify():
    async with AsyncSessionLocal() as session:
        print("Checking solution validity using DB stored procedure...")
        result = await session.execute(text("SELECT * FROM validate_timetable()"))
        rows = result.fetchall()
        
        if not rows:
            print("SUCCESS: No conflicts found in the database!")
        else:
            print(f"FAILURE: Found {len(rows)} conflicts:")
            for r in rows:
                print(f" - {r.conflict_type}: {r.details}")

if __name__ == "__main__":
    asyncio.run(verify())
