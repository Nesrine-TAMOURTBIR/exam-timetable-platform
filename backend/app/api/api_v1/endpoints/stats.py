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
    # 4. Conflict Rates (Strategic View for Dean/Head)
    # Conflict is detected if validate_timetable() returns results.
    # For a strategic view, we want conflicts per dept or program.
    conflict_query = """
        SELECT 
            d.name,
            COUNT(DISTINCT t.id) as conflict_count
        FROM timetable_entries t
        JOIN exams e ON t.exam_id = e.id
        JOIN modules m ON e.module_id = m.id
        JOIN programs p ON m.program_id = p.id
        JOIN departments d ON p.department_id = d.id
        JOIN (
            -- Subquery to find exam_ids that have conflicts (Student Daily Limit)
            SELECT t1.exam_id
            FROM timetable_entries t1
            JOIN exams e1 ON t1.exam_id = e1.id
            JOIN modules m1 ON e1.module_id = m1.id
            JOIN enrollments en1 ON m1.id = en1.module_id
            JOIN students s1 ON en1.student_id = s1.id
            GROUP BY s1.id, t1.start_time::DATE, t1.exam_id
            HAVING COUNT(*) > 1
        ) conflicts ON t.exam_id = conflicts.exam_id
        GROUP BY d.name;
    """
    conf_res = await db.execute(sa.text(conflict_query))
    stats["conflicts_by_dept"] = [{"name": row[0], "count": row[1]} for row in conf_res.fetchall()]

    if current_user.role == 'head':
        # Conflicts per program for this head's department
        prog_conflict_query = """
            SELECT 
                p.name,
                COUNT(DISTINCT t.id) as conflict_count
            FROM timetable_entries t
            JOIN exams e ON t.exam_id = e.id
            JOIN modules m ON e.module_id = m.id
            JOIN programs p ON m.program_id = p.id
            JOIN (
                SELECT t1.exam_id
                FROM timetable_entries t1
                JOIN exams e1 ON t1.exam_id = e1.id
                JOIN modules m1 ON e1.module_id = m1.id
                JOIN enrollments en1 ON m1.id = en1.module_id
                JOIN students s1 ON en1.student_id = s1.id
                GROUP BY s1.id, t1.start_time::DATE, t1.exam_id
                HAVING COUNT(*) > 1
            ) conflicts ON t.exam_id = conflicts.exam_id
            WHERE p.department_id = :dept_id
            GROUP BY p.name;
        """
        # Get dept_id
        prof_res = await db.execute(select(Professor).where(Professor.user_id == current_user.id))
        prof = prof_res.scalars().first()
        if prof:
            prog_conf_res = await db.execute(sa.text(prog_conflict_query), {"dept_id": prof.department_id})
            stats["conflicts_by_program"] = [{"name": row[0], "count": row[1]} for row in prog_conf_res.fetchall()]

    # 5. Validation Workflow Summary (Dean/Vice-Dean Strategic KPIs)
    status_query = select(TimetableEntry.status, func.count(TimetableEntry.id)).group_by(TimetableEntry.status)
    status_res = await db.execute(status_query)
    stats["validation_status"] = {row[0]: row[1] for row in status_res.all()}
    
    # Ensure all statuses exist in dict
    for s in ["DRAFT", "DEPT_APPROVED", "FINAL_APPROVED"]:
        if s not in stats["validation_status"]:
            stats["validation_status"][s] = 0

    # 6. Global Room Occupancy Rate (%)
    # Average of (module_enrollments / room_capacity) * 100
    occ_query = """
        SELECT 
            AVG(CAST(en_counts.cnt AS NUMERIC) / r.capacity * 100) as avg_rate
        FROM rooms r
        JOIN timetable_entries t ON r.id = t.room_id
        JOIN exams e ON t.exam_id = e.id
        JOIN (SELECT module_id, COUNT(*) as cnt FROM enrollments GROUP BY module_id) en_counts ON e.module_id = en_counts.module_id
        WHERE r.capacity > 0;
    """
    occ_res = await db.execute(sa.text(occ_query))
    stats["occupancy_rate"] = float(occ_res.scalar() or 0)

    # 7. Quality Score (Simplified logic: 100 - (conflicts / total_exams * 100))
    total_entries = stats["total_exams"]
    if total_entries > 0:
        total_conflicts = sum(d["count"] for d in stats["conflicts_by_dept"])
        stats["quality_score"] = max(0, 100 - (total_conflicts / total_entries * 100))
    else:
        stats["quality_score"] = 100

    return stats
