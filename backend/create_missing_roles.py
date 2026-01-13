import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.all_models import User, UserRole, Professor, Department

async def create_roles():
    async with AsyncSessionLocal() as session:
        # 1. Create Dean
        print("Checking for Dean...")
        result = await session.execute(select(User).where(User.role == 'dean'))
        dean = result.scalars().first()
        
        if not dean:
            print("Creating Dean User...")
            dean = User(
                email="dean@example.com",
                hashed_password="hashed_secret", # Using the fallback hash
                full_name="Dr. Dean Johnson",
                role="dean",
                is_active=True
            )
            session.add(dean)
            await session.commit()
            print("Dean Created: dean@example.com")
        else:
        # 1b. Create Vice-Dean
        print("Checking for Vice-Dean...")
        result = await session.execute(select(User).where(User.role == 'vice_dean'))
        vicedean = result.scalars().first()
        
        if not vicedean:
            print("Creating Vice-Dean User...")
            vicedean = User(
                email="vicedean@example.com",
                hashed_password="hashed_secret",
                full_name="Dr. Sarah Vice-Dean",
                role="vice_dean",
                is_active=True
            )
            session.add(vicedean)
            await session.commit()
            print("Vice-Dean Created: vicedean@example.com")
        else:
            print("Vice-Dean already exists.")

        # 2. Create Head of Department
        print("Checking for Head of Dept...")
        result = await session.execute(select(User).where(User.role == 'head'))
        head = result.scalars().first()
        
        if not head:
            print("Creating Head User...")
            head = User(
                email="head@example.com",
                hashed_password="hashed_secret",
                full_name="Prof. Sarah Head",
                role="head",
                is_active=True
            )
            session.add(head)
            await session.commit()
            await session.refresh(head)
            
            # Link to Department 1
            # Check if dept 1 exists
            dept = await session.get(Department, 1)
            if dept:
                print(f"Linking Head to Department: {dept.name}")
                prof_profile = Professor(
                    user_id=head.id,
                    department_id=dept.id
                )
                session.add(prof_profile)
                await session.commit()
                print("Head Linked to Department.")
            else:
                print("Department 1 not found, skipping specific link.")
            
            print("Head Created: head@example.com")
        else:
            print("Head already exists.")

if __name__ == "__main__":
    asyncio.run(create_roles())
