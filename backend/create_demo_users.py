"""
Script to create demo users for testing
All users have password: 'secret'
"""
import asyncio
import sys
import platform

# Fix for Windows
if platform.system() == 'Windows':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.all_models import User, UserRole, Professor, Department, Student, Program

async def create_demo_users():
    async with AsyncSessionLocal() as session:
        print("=" * 60)
        print("Creating Demo Users")
        print("=" * 60)
        
        credentials_list = []
        
        # 1. Admin
        result = await session.execute(select(User).where(User.email == "admin@example.com"))
        admin = result.scalars().first()
        if not admin:
            admin = User(
                email="admin@example.com",
                hashed_password="hashed_secret",
                full_name="Directeur des Examens",
                role=UserRole.ADMIN.value,
                is_active=True
            )
            session.add(admin)
            print("v Admin created: admin@example.com / secret")
        else:
            admin.full_name = "Directeur des Examens"
            admin.role = UserRole.ADMIN.value
            print("v Admin updated: admin@example.com / secret")
        await session.commit()
        credentials_list.append(("Directeur Examens", "admin@example.com", "secret"))
        
        # 2. Dean
        result = await session.execute(select(User).where(User.email == "dean@example.com"))
        dean = result.scalars().first()
        if not dean:
            dean = User(
                email="dean@example.com",
                hashed_password="hashed_secret",
                full_name="Doyen de la Faculté",
                role=UserRole.DEAN.value,
                is_active=True
            )
            session.add(dean)
            print("✓ Dean created: dean@example.com / secret")
        else:
            dean.full_name = "Doyen de la Faculté"
            dean.role = UserRole.DEAN.value
            print("v Dean updated: dean@example.com / secret")
        await session.commit()
        credentials_list.append(("Doyen", "dean@example.com", "secret"))
        
        # 2b. Vice-Dean
        result = await session.execute(select(User).where(User.email == "vicedean@example.com"))
        vicedean = result.scalars().first()
        if not vicedean:
            vicedean = User(
                email="vicedean@example.com",
                hashed_password="hashed_secret",
                full_name="Dr. Sarah Vice-Dean",
                role=UserRole.VICE_DEAN.value,
                is_active=True
            )
            session.add(vicedean)
            await session.commit()
            print("v Vice-Dean created: vicedean@example.com / secret")
        else:
            print("v Vice-Dean already exists: vicedean@example.com / secret")
        credentials_list.append(("Vice-Dean", "vicedean@example.com", "secret"))
        
        # 3. Head of Department
        result = await session.execute(select(User).where(User.email == "head@example.com"))
        head = result.scalars().first()
        if not head:
            head = User(
                email="head@example.com",
                hashed_password="hashed_secret",
                full_name="Prof. Fatima Head",
                role=UserRole.HEAD_OF_DEPT.value,
                is_active=True
            )
            session.add(head)
            await session.commit()
            await session.refresh(head)
            
            # Link to first department
            dept_result = await session.execute(select(Department).limit(1))
            dept = dept_result.scalars().first()
            if dept:
                prof_profile = Professor(
                    user_id=head.id,
                    department_id=dept.id
                )
                session.add(prof_profile)
                await session.commit()
                print(f"v Head created and linked to department: head@example.com / secret")
            else:
                print("v Head created (no departments yet): head@example.com / secret")
        else:
            print("v Head already exists: head@example.com / secret")
        credentials_list.append(("Head of Department", "head@example.com", "secret"))
        
        # 4. Demo Professor
        result = await session.execute(select(User).where(User.email == "prof@example.com"))
        prof_user = result.scalars().first()
        if not prof_user:
            prof_user = User(
                email="prof@example.com",
                hashed_password="hashed_secret",
                full_name="Prof. Mohamed Ali",
                role=UserRole.PROFESSOR.value,
                is_active=True
            )
            session.add(prof_user)
            await session.commit()
            await session.refresh(prof_user)
            
            # Link to first department
            dept_result = await session.execute(select(Department).limit(1))
            dept = dept_result.scalars().first()
            if dept:
                prof_profile = Professor(
                    user_id=prof_user.id,
                    department_id=dept.id
                )
                session.add(prof_profile)
                await session.commit()
                print(f"v Professor created: prof@example.com / secret")
            else:
                print("v Professor created (no departments yet): prof@example.com / secret")
        else:
            print("v Professor already exists: prof@example.com / secret")
        credentials_list.append(("Professor", "prof@example.com", "secret"))
        
        # 5. Demo Student
        result = await session.execute(select(User).where(User.email == "student@example.com"))
        student_user = result.scalars().first()
        if not student_user:
            student_user = User(
                email="student@example.com",
                hashed_password="hashed_secret",
                full_name="Student Test User",
                role=UserRole.STUDENT.value,
                is_active=True
            )
            session.add(student_user)
            await session.commit()
            await session.refresh(student_user)
            
            # Link to first program
            prog_result = await session.execute(select(Program).limit(1))
            program = prog_result.scalars().first()
            if program:
                student_profile = Student(
                    user_id=student_user.id,
                    program_id=program.id
                )
                session.add(student_profile)
                await session.commit()
                print(f"v Student created: student@example.com / secret")
            else:
                print("v Student created (no programs yet): student@example.com / secret")
        else:
            print("v Student already exists: student@example.com / secret")
        credentials_list.append(("Student", "student@example.com", "secret"))
        
        print("\n" + "=" * 60)
        print("DEMO CREDENTIALS SUMMARY")
        print("=" * 60)
        for role, email, password in credentials_list:
            print(f"{role:20} : {email:25} / {password}")
        print("=" * 60)
        print("\nAll users created successfully!")
        print("Note: Make sure to run seed_data.py first to have departments/programs available")

if __name__ == "__main__":
    asyncio.run(create_demo_users())

