from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.api import deps
from app.models.all_models import User, TimetableEntry, Exam, Professor, Student, Module, Enrollment
from app.schemas.all_schemas import TimetableEntrySchema

router = APIRouter()

@router.get("/", response_model=List[TimetableEntrySchema])
async def read_timetable(
    db = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    department_id: Optional[int] = None,
    program_id: Optional[int] = None,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve timetable entries.
    """
    # Join with Exam/Module? Schema expects IDs, so simple select is fine.
    # API could support filtering by student/prof (based on current_user role)
    
    # Main query
    query = select(TimetableEntry).options(
        selectinload(TimetableEntry.exam).selectinload(Exam.module).selectinload(Module.program),
        selectinload(TimetableEntry.room),
        selectinload(TimetableEntry.supervisor).selectinload(Professor.user)
    )
    
    # Filter based on role
    if current_user.role == 'student':
        # Show all exams for their program
        query = query.join(Exam, TimetableEntry.exam_id == Exam.id)\
                     .join(Module, Exam.module_id == Module.id)\
                     .join(Program, Module.program_id == Program.id)\
                     .join(Student, Student.program_id == Program.id)\
                     .where(Student.user_id == current_user.id)
                     
    elif current_user.role == 'professor':
        query = query.join(Professor, TimetableEntry.supervisor_id == Professor.id)\
                     .where(Professor.user_id == current_user.id)
                     
    elif current_user.role == 'head':
        prof_res = await db.execute(select(Professor).where(Professor.user_id == current_user.id))
        prof = prof_res.scalars().first()
        if prof:
            query = query.join(Exam, TimetableEntry.exam_id == Exam.id)\
                         .join(Module, Exam.module_id == Module.id)\
                         .join(Program, Module.program_id == Program.id)\
                         .where(Program.department_id == prof.department_id)
        else:
            # Fallback for demo: if no prof profile, show everything or specific dept??
            # Let's return empty to be strict, but log it
            print(f"HOD User {current_user.email} has no professor profile!")
            return []

    # Apply global filters on top
    if department_id:
        # We might need to join again or use the existing join path
        # To be safe, we check if already joined to Program
        if current_user.role not in ['student', 'head']:
            query = query.join(Exam, TimetableEntry.exam_id == Exam.id)\
                         .join(Module, Exam.module_id == Module.id)\
                         .join(Program, Module.program_id == Program.id)
        query = query.where(Program.department_id == department_id)
        
    if program_id:
        if current_user.role not in ['student', 'head'] and not department_id:
            query = query.join(Exam, TimetableEntry.exam_id == Exam.id)\
                         .join(Module, Exam.module_id == Module.id)
        query = query.where(Module.program_id == program_id)
        
    result = await db.execute(query.offset(skip).limit(limit).distinct())
    entries = result.scalars().all()
    
    # Transform to schema if needed, but Pydantic orm_mode might need help with deep nesting or properties
    # Simplest: Map manually or use properties in Pydantic v2
    # Here we map to dictionary with flat names
    mapped = []
    for e in entries:
        mapped.append({
            "id": e.id,
            "exam_id": e.exam_id,
            "room_id": e.room_id,
            "supervisor_id": e.supervisor_id,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "status": e.status,
            "exam_name": e.exam.module.name if e.exam and e.exam.module else f"Exam {e.exam_id}",
            "room_name": e.room.name if e.room else f"Room {e.room_id}",
            "supervisor_name": e.supervisor.user.full_name if e.supervisor and e.supervisor.user else f"Prof {e.supervisor_id}"
        })
    return mapped
