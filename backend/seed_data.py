import asyncio
import sys
import platform

# Fix for Windows: Use SelectorEventLoop instead of ProactorEventLoop
if platform.system() == 'Windows':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import random
from faker import Faker
from sqlalchemy import select
from app.api import deps
from app.db.session import AsyncSessionLocal, engine
from app.models.all_models import Base, Department, Program, Professor, Student, Module, Enrollment, Room, Exam, User, UserRole

fake = Faker()

NUM_DEPTS = 7
NUM_PROGRAMS = 200
NUM_PROFS = 500
NUM_STUDENTS = 13000
MODULES_PER_PROGRAM = 12
ENROLLMENTS_PER_STUDENT = 10
NUM_ROOMS = 100

async def seed_data():
    async with AsyncSessionLocal() as session:
        print("Creating Departments...")
        depts = [Department(name=f"Department of {fake.unique.word().title()}") for _ in range(NUM_DEPTS)]
        session.add_all(depts)
        await session.commit()
        for d in depts: await session.refresh(d)
        
        print("Creating Users & Professors...")
        profs = []
        prof_users = []
        import time
        fake.unique.clear()  # Clear unique cache to avoid conflicts
        for i in range(NUM_PROFS):
            u = User(
                email=f"prof_{i}_{int(time.time())}_{random.randint(1000,9999)}@{fake.domain_name()}",
                hashed_password="hashed_secret",
                full_name=fake.name(),
                role=UserRole.PROFESSOR.value
            )
            prof_users.append(u)
        try:
            session.add_all(prof_users)
            await session.commit()
        except Exception as e:
            await session.rollback()
            print(f"Error creating professors: {e}")
            # Try to get existing users
            result = await session.execute(select(User).where(User.role == UserRole.PROFESSOR.value))
            prof_users = result.scalars().all()
            print(f"Using {len(prof_users)} existing professors")
        for u in prof_users: await session.refresh(u)

        for i, u in enumerate(prof_users):
            p = Professor(
                user_id=u.id,
                department_id=random.choice(depts).id
            )
            profs.append(p)
        session.add_all(profs)
        await session.commit()
        for p in profs: await session.refresh(p)
        
        print("Creating Programs...")
        # Check existing programs first
        result = await session.execute(select(Program))
        existing_programs = result.scalars().all()
        
        if len(existing_programs) >= NUM_PROGRAMS:
            print(f"Using {len(existing_programs)} existing programs")
            programs = existing_programs[:NUM_PROGRAMS]
        else:
            programs = list(existing_programs)
            fake.unique.clear()
            import time
            for i in range(len(programs), NUM_PROGRAMS):
                programs.append(Program(
                    name=f"Program_{i}_{int(time.time())}_{random.randint(1000,9999)}",
                    department_id=random.choice(depts).id
                ))
            try:
                session.add_all(programs[len(existing_programs):])
                await session.commit()
            except Exception as e:
                await session.rollback()
                print(f"Some programs already exist, using existing ones")
                result = await session.execute(select(Program))
                programs = result.scalars().all()[:NUM_PROGRAMS]
        for p in programs: await session.refresh(p)

        print("Creating Modules & Exams...")
        modules = []
        exams = []
        for prog in programs:
            for _ in range(MODULES_PER_PROGRAM):
                m = Module(
                    name=f"Intro to {fake.word().title()} {random.randint(100, 999)}",
                    program_id=prog.id,
                    professor_id=random.choice(profs).id
                )
                modules.append(m)
        session.add_all(modules)
        await session.commit()
        for m in modules: await session.refresh(m)
        
        # Create one Exam per module
        for m in modules:
            exams.append(Exam(module_id=m.id, duration_minutes=90))
        session.add_all(exams)
        await session.commit()

        print("Creating Rooms...")
        rooms = []
        for i in range(1, NUM_ROOMS + 1):
            rooms.append(Room(
                name=f"Room {i}", 
                capacity=random.choice([30, 50, 100, 200, 300])
            ))
        session.add_all(rooms)
        await session.commit()

        print(f"Creating {NUM_STUDENTS} Students & Enrollments (Batch Insert)...")
        # Batching Students and Enrollments to avoid memory issues
        BATCH_SIZE = 1000
        
        # Pre-fetch modules by program for fast lookup
        modules_by_program = {p.id: [] for p in programs}
        for m in modules:
            modules_by_program[m.program_id].append(m)
            
        student_users = []
        students = []
        all_enrollments = []
        
        for batch_start in range(0, NUM_STUDENTS, BATCH_SIZE):
            current_batch_size = min(BATCH_SIZE, NUM_STUDENTS - batch_start)
            
            # 1. Create Users
            import time
            batch_users = []
            for i in range(current_batch_size):
                u = User(
                    email=f"student_{batch_start + i}_{int(time.time())}_{random.randint(10000,99999)}@{fake.domain_name()}",
                    hashed_password="hashed_secret",
                    full_name=fake.name(),
                    role=UserRole.STUDENT.value
                )
                batch_users.append(u)
            try:
                session.add_all(batch_users)
                await session.commit()
            except Exception as e:
                await session.rollback()
                print(f"Error in batch {batch_start}: {e}")
                continue
            for u in batch_users: await session.refresh(u)
            
            # 2. Create Students
            batch_students = []
            for u in batch_users:
                prog = random.choice(programs)
                batch_students.append(Student(user_id=u.id, program_id=prog.id))
            session.add_all(batch_students)
            await session.commit()
            for s in batch_students: await session.refresh(s)
            
            # 3. Create Enrollments
            batch_enrollments = []
            for s in batch_students:
                available_modules = modules_by_program.get(s.program_id, [])
                if available_modules:
                    # Pick random modules from their program
                    selected = random.sample(available_modules, k=min(len(available_modules), ENROLLMENTS_PER_STUDENT))
                    for m in selected:
                        batch_enrollments.append(Enrollment(student_id=s.id, module_id=m.id))
            
            session.add_all(batch_enrollments)
            await session.commit()
            print(f"Processed {batch_start + current_batch_size} students...")

        print("Seeding Complete!")

if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_data())
