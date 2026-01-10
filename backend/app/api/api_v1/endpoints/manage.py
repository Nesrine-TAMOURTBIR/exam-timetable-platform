"""
Management endpoints for Admin/Head users
CRUD operations for departments, programs, modules, rooms, users, exams
"""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from app.api import deps
from app.models.all_models import (
    User, UserRole, Department, Program, Module, Room, Exam, 
    Professor, Student
)
from pydantic import BaseModel, EmailStr

router = APIRouter()

# ==================== SCHEMAS ====================

class DepartmentCreate(BaseModel):
    name: str

class ProgramCreate(BaseModel):
    name: str
    department_id: int

class ModuleCreate(BaseModel):
    name: str
    program_id: int
    professor_id: Optional[int] = None

class RoomCreate(BaseModel):
    name: str
    capacity: int

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str
    department_id: Optional[int] = None  # For professors/heads
    program_id: Optional[int] = None  # For students

class ExamCreate(BaseModel):
    module_id: int
    duration_minutes: int = 90

# ==================== DEPARTMENTS ====================

@router.get("/departments", response_model=List[dict])
async def list_departments(
    db = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """List all departments (Admin, Dean, Head)"""
    if current_user.role not in ['admin', 'dean', 'head']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.execute(select(Department))
    depts = result.scalars().all()
    return [{"id": d.id, "name": d.name} for d in depts]

@router.post("/departments", response_model=dict)
async def create_department(
    data: DepartmentCreate,
    db = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Create a department (Admin only)"""
    dept = Department(name=data.name)
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return {"id": dept.id, "name": dept.name}

# ==================== PROGRAMS ====================

@router.get("/programs", response_model=List[dict])
async def list_programs(
    db = Depends(deps.get_db),
    department_id: Optional[int] = None,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """List programs, optionally filtered by department"""
    query = select(Program)
    if department_id:
        query = query.where(Program.department_id == department_id)
    
    result = await db.execute(query)
    programs = result.scalars().all()
    return [{"id": p.id, "name": p.name, "department_id": p.department_id} for p in programs]

@router.post("/programs", response_model=dict)
async def create_program(
    data: ProgramCreate,
    db = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Create a program (Admin, Head)"""
    if current_user.role not in ['admin', 'head']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify department exists
    dept = await db.get(Department, data.department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    program = Program(name=data.name, department_id=data.department_id)
    db.add(program)
    await db.commit()
    await db.refresh(program)
    return {"id": program.id, "name": program.name, "department_id": program.department_id}

# ==================== MODULES ====================

@router.get("/modules", response_model=List[dict])
async def list_modules(
    db = Depends(deps.get_db),
    program_id: Optional[int] = None,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """List modules, optionally filtered by program"""
    query = select(Module)
    if program_id:
        query = query.where(Module.program_id == program_id)
    
    result = await db.execute(query.options(selectinload(Module.program)))
    modules = result.scalars().all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "program_id": m.program_id,
            "program_name": m.program.name if m.program else None,
            "professor_id": m.professor_id
        }
        for m in modules
    ]

@router.post("/modules", response_model=dict)
async def create_module(
    data: ModuleCreate,
    db = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Create a module (Admin, Head)"""
    if current_user.role not in ['admin', 'head']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify program exists
    program = await db.get(Program, data.program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    module = Module(name=data.name, program_id=data.program_id, professor_id=data.professor_id)
    db.add(module)
    await db.commit()
    await db.refresh(module)
    return {"id": module.id, "name": module.name, "program_id": module.program_id}

# ==================== ROOMS ====================

@router.get("/rooms", response_model=List[dict])
async def list_rooms(
    db = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """List all rooms"""
    result = await db.execute(select(Room))
    rooms = result.scalars().all()
    return [{"id": r.id, "name": r.name, "capacity": r.capacity} for r in rooms]

@router.post("/rooms", response_model=dict)
async def create_room(
    data: RoomCreate,
    db = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Create a room (Admin only)"""
    room = Room(name=data.name, capacity=data.capacity)
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return {"id": room.id, "name": room.name, "capacity": room.capacity}

@router.delete("/rooms/{room_id}")
async def delete_room(
    room_id: int,
    db = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Delete a room (Admin only)"""
    room = await db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    stmt = delete(Room).where(Room.id == room_id)
    await db.execute(stmt)
    await db.commit()
    return {"message": "Room deleted"}

# ==================== USERS ====================

@router.get("/users", response_model=List[dict])
async def list_users(
    db = Depends(deps.get_db),
    role: Optional[str] = None,
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """List users, optionally filtered by role (Admin only)"""
    query = select(User)
    if role:
        query = query.where(User.role == role)
    
    result = await db.execute(query)
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active
        }
        for u in users
    ]

@router.post("/users", response_model=dict)
async def create_user(
    data: UserCreate,
    db = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Create a user (Admin only)"""
    # Check if email exists
    result = await db.execute(select(User).where(User.email == data.email))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Validate role
    if data.role not in ['admin', 'dean', 'head', 'professor', 'student']:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    user = User(
        email=data.email,
        hashed_password="hashed_secret",  # Using fallback for demo
        full_name=data.full_name,
        role=data.role,
        is_active=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create profile if needed
    if data.role == 'professor' and data.department_id:
        prof = Professor(user_id=user.id, department_id=data.department_id)
        db.add(prof)
        await db.commit()
    elif data.role == 'student' and data.program_id:
        student = Student(user_id=user.id, program_id=data.program_id)
        db.add(student)
        await db.commit()
    elif data.role == 'head' and data.department_id:
        prof = Professor(user_id=user.id, department_id=data.department_id)
        db.add(prof)
        await db.commit()
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role
    }

# ==================== EXAMS ====================

@router.get("/exams", response_model=List[dict])
async def list_exams(
    db = Depends(deps.get_db),
    module_id: Optional[int] = None,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """List exams, optionally filtered by module"""
    query = select(Exam)
    if module_id:
        query = query.where(Exam.module_id == module_id)
    
    result = await db.execute(query.options(selectinload(Exam.module)))
    exams = result.scalars().all()
    return [
        {
            "id": e.id,
            "module_id": e.module_id,
            "module_name": e.module.name if e.module else None,
            "duration_minutes": e.duration_minutes
        }
        for e in exams
    ]

@router.post("/exams", response_model=dict)
async def create_exam(
    data: ExamCreate,
    db = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Create an exam (Admin, Head)"""
    if current_user.role not in ['admin', 'head']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify module exists
    module = await db.get(Module, data.module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Check if exam already exists for this module
    result = await db.execute(select(Exam).where(Exam.module_id == data.module_id))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Exam already exists for this module")
    
    exam = Exam(module_id=data.module_id, duration_minutes=data.duration_minutes)
    db.add(exam)
    await db.commit()
    await db.refresh(exam)
    return {"id": exam.id, "module_id": exam.module_id, "duration_minutes": exam.duration_minutes}

