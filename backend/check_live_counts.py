import asyncio
from sqlalchemy import select, func
from app.db.session import AsyncSessionLocal
from app.models.all_models import User, Professor, Student

async def check_live_counts():
    async with AsyncSessionLocal() as session:
        # Count all students
        user_count = await session.execute(select(func.count(User.id)))
        student_count = await session.execute(select(func.count(User.id)).where(User.role == 'student'))
        prof_count = await session.execute(select(func.count(Professor.id)))
        dept_count = await session.execute(select(func.count(User.id)).where(User.role == 'head'))
        
        print(f"Total Users: {user_count.scalar()}")
        print(f"Students: {student_count.scalar()}")
        print(f"Professors: {prof_count.scalar()}")
        print(f"Heads: {dept_count.scalar()}")

if __name__ == "__main__":
    import os
    # Ensure current directory is backend
    import asyncio
    asyncio.run(check_live_counts())
