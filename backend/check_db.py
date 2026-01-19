import asyncio
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from app.db.session import AsyncSessionLocal
from app.models.all_models import User, Professor, Student, Department
from sqlalchemy import select, func

async def check():
    async with AsyncSessionLocal() as s:
        print("--- Checking Head ---")
        res = await s.execute(select(User).where(User.email == 'head@example.com'))
        u = res.scalars().first()
        if u:
            print(f"User: {u.email}, ID: {u.id}, Role: {u.role}")
            res = await s.execute(select(Professor).where(Professor.user_id == u.id))
            p = res.scalars().first()
            if p:
                print(f"Prof ID: {p.id}, Dept ID: {p.department_id}")
                d = await s.get(Department, p.department_id)
                print(f"Dept Name: {d.name if d else 'Unknown'}")
            else:
                print("No Professor profile for this user")
        else:
            print("User head@example.com not found")
            
        print("\n--- Checking Student Count ---")
        count = await s.execute(select(func.count(Student.id)))
        print(f"Total Students: {count.scalar()}")
        
        print("\n--- Checking Departments ---")
        res = await s.execute(select(Department))
        depts = res.scalars().all()
        for d in depts:
            print(f"Dept: {d.name}, ID: {d.id}")

if __name__ == "__main__":
    asyncio.run(check())
