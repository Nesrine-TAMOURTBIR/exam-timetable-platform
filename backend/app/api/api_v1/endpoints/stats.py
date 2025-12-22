from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, distinct
from app.api import deps
from app.models.all_models import User, Student, Professor, Room, Department, Exam, TimetableEntry, Module, Program

router = APIRouter()

@router.get("/dashboard-kpi")
async def get_dashboard_kpi(
    db = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get Key Performance Indicators based on user role.
    """
    
    stats = {
        "total_students": 0,
        "total_profs": 0,
        "total_exams": 0,
        "conflicts": 0, # Placeholder
        "occupancy_rate": 0
    }
    
    # Global Stats (Fast counts)
    total_students = await db.execute(select(func.count(Student.id)))
    stats["total_students"] = total_students.scalar()
    
    total_profs = await db.execute(select(func.count(Professor.id)))
    stats["total_profs"] = total_profs.scalar()
    
    total_exams = await db.execute(select(func.count(TimetableEntry.id)))
    stats["total_exams"] = total_exams.scalar()
    
    
    # Department specific logic
    if current_user.role == 'head':
        # Find the department for this head
        # Head is a user linked to a Professor profile linked to a Department
        # Join: Professor -> User
        query = select(Professor).where(Professor.user_id == current_user.id)
        result = await db.execute(query)
        prof_profile = result.scalars().first()
        
        if prof_profile and prof_profile.department_id:
            dept_id = prof_profile.department_id
            
            # Filter stats by dept
            # Students in programs of this dept
            # Student -> Program -> Department
            student_count = await db.execute(
                select(func.count(Student.id))
                .join(Student.program)
                .where(Department.id == dept_id)
            )
            stats["total_students"] = student_count.scalar()
            
            # Profs in this dept
            prof_count = await db.execute(
                select(func.count(Professor.id))
                .where(Professor.department_id == dept_id)
            )
            stats["total_profs"] = prof_count.scalar()
            
            # Exams for modules in this dept
            # TimetableEntry -> Exam -> Module -> Program -> Department
            exam_count = await db.execute(
                select(func.count(TimetableEntry.id))
                .join(TimetableEntry.exam)
                .join(Exam.module)
                .join(Module.program)
                .where(Department.id == dept_id)
            )
            stats["total_exams"] = exam_count.scalar()
            
            stats["scope"] = "Department"
    else:
        stats["scope"] = "University"

    return stats
