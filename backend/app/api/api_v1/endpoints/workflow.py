from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from app.api import deps
from app.models.all_models import User, TimetableEntry, Exam, Module, Program, Department, Professor

router = APIRouter()

@router.post("/validate-dept/{dept_id}")
async def validate_by_head(
    dept_id: int,
    db = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Validation by Head of Department.
    Marks all timetable entries for modules in this department as DEPT_APPROVED.
    """
    if current_user.role != 'head':
        raise HTTPException(status_code=403, detail="Only Head of Department can validate")
    
    # Verify current_user belongs to this department
    result = await db.execute(select(Professor).where(Professor.user_id == current_user.id))
    prof = result.scalars().first()
    if not prof or prof.department_id != dept_id:
        raise HTTPException(status_code=403, detail="You can only validate your own department")

    # Update all entries for this department
    # TimetableEntry -> Exam -> Module -> Program -> Department
    stmt = (
        update(TimetableEntry)
        .where(TimetableEntry.exam_id.in_(
            select(Exam.id)
            .join(Module)
            .join(Program)
            .where(Program.department_id == dept_id)
        ))
        .values(status="DEPT_APPROVED")
    )
    await db.execute(stmt)
    await db.commit()
    return {"message": f"Department {dept_id} validated successfully"}

@router.post("/approve-final")
async def approve_by_dean(
    db = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Final approval by Dean or Vice-Dean.
    Marks all DEPT_APPROVED entries as FINAL_APPROVED.
    """
    if current_user.role not in ['dean', 'vice_dean']:
        raise HTTPException(status_code=403, detail="Only Dean or Vice-Dean can approve")

    stmt = (
        update(TimetableEntry)
        .where(TimetableEntry.status == "DEPT_APPROVED")
        .values(status="FINAL_APPROVED")
    )
    await db.execute(stmt)
    await db.commit()
    return {"message": "All department-validated entries are now final"}

@router.get("/status-summary")
async def get_workflow_status(
    db = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Summary of validation status for Dean/Vice-Dean dashboard.
    """
    if current_user.role not in ['dean', 'vice_dean', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Count entries by status
    from sqlalchemy import func
    result = await db.execute(select(TimetableEntry.status, func.count(TimetableEntry.id)).group_by(TimetableEntry.status))
    counts = {row[0]: row[1] for row in result.all()}
    return counts
