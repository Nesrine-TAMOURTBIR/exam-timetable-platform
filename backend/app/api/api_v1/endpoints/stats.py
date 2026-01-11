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
    # --- Detailed Statistics for Charts ---

    # 1. Exams by Day (Timeline)
    # Group by date part of start_time
    day_stats_query = (
        select(func.date(TimetableEntry.start_time).label("date"), func.count(TimetableEntry.id).label("count"))
        .group_by(func.date(TimetableEntry.start_time))
        .order_by(func.date(TimetableEntry.start_time))
    )
    day_res = await db.execute(day_stats_query)
    stats["exams_by_day"] = [{"date": str(row.date), "count": row.count} for row in day_res.all()]

    # 2. Room Occupancy (using the new PL/pgSQL function or direct query)
    # Let's use a direct query for robustness in case function isn't yet in DB during dev
    occupancy_query = """
        SELECT 
            r.name,
            AVG(CAST(en_counts.cnt AS NUMERIC) / r.capacity * 100) as avg_rate
        FROM rooms r
        JOIN timetable_entries t ON r.id = t.room_id
        JOIN exams e ON t.exam_id = e.id
        JOIN (SELECT module_id, COUNT(*) as cnt FROM enrollments GROUP BY module_id) en_counts ON e.module_id = en_counts.module_id
        GROUP BY r.name
        LIMIT 10;
    """
    occ_res = await db.execute(sa.text(occupancy_query))
    stats["room_occupancy"] = [{"name": row[0], "rate": float(row[1])} for row in occ_res.fetchall()]

    # 3. Professor Load (Equality of Supervisions)
    prof_load_query = """
        SELECT 
            u.full_name,
            COUNT(t.id) as count
        FROM professors p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN timetable_entries t ON p.id = t.supervisor_id
        GROUP BY u.full_name
        ORDER BY count DESC
        LIMIT 10;
    """
    load_res = await db.execute(sa.text(prof_load_query))
    stats["prof_load"] = [{"name": row[0], "count": row[1]} for row in load_res.fetchall()]

    return stats
