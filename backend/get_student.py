import asyncio
from sqlalchemy import select, func
from app.db.session import AsyncSessionLocal
from app.models.all_models import User, UserRole

async def get_student():
    async with AsyncSessionLocal() as session:
        # Check total users
        result = await session.execute(select(func.count(User.id)))
        count = result.scalar()
        print(f"Total Users: {count}")
        
        # Try to find one student
        result = await session.execute(select(User).where(User.role == 'student').limit(1))
        student = result.scalars().first()

        # Try to find one professor
        result = await session.execute(select(User).where(User.role == 'professor').limit(1))
        professor = result.scalars().first()

        # Try to find one Dean
        result = await session.execute(select(User).where(User.role == 'dean').limit(1))
        dean = result.scalars().first()

        # Try to find one Head of Dept
        result = await session.execute(select(User).where(User.role == 'head').limit(1))
        head = result.scalars().first()
        
        output = []
        output.append("##################################################")
        output.append("                 DEMO CREDENTIALS                 ")
        output.append("##################################################")
        output.append("1. EXAM ADMIN (Planning Dept):")
        output.append("   Email:    admin@example.com")
        output.append("   Password: secret")
        output.append("--------------------------------------------------")
        
        if dean:
            output.append("2. DEAN / VICE-DEAN:")
            output.append(f"   Email:    {dean.email}")
            output.append(f"   Password: secret")
        else:
            output.append("2. DEAN: Not Found (Need to create)")

        if head:
            output.append("3. DEPARTMENT HEAD:")
            output.append(f"   Email:    {head.email}")
            output.append(f"   Password: secret")
        else:
            output.append("3. DEPARTMENT HEAD: Not Found (Need to create)")
            
        output.append("--------------------------------------------------")
        
        if professor:
            output.append("4. PROFESSOR:")
            output.append(f"   Email:    {professor.email}")
            output.append(f"   Password: secret")
        else:
            output.append("4. PROFESSOR: Not Found")
            
        output.append("--------------------------------------------------")

        if student:
            output.append("5. STUDENT:")
            output.append(f"   Email:    {student.email}")
            output.append(f"   Password: secret")
        else:
            output.append("5. STUDENT: Not Found")
        output.append("##################################################")
        
        final_str = "\n".join(output)
        print(final_str)
        
        with open("demo_credentials.txt", "w") as f:
            f.write(final_str)

if __name__ == "__main__":
    asyncio.run(get_student())
