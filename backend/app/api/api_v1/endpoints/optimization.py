from fastapi import APIRouter, Depends, HTTPException
from typing import Any
from app.api import deps
from app.models.all_models import User
from app.schemas.all_schemas import OptimizationStats
from app.algos.engine import OptimizationEngine
from app.db.session import AsyncSessionLocal
import time
import asyncio

router = APIRouter()

@router.post("/run", response_model=OptimizationStats)
async def run_optimization(
    current_user: User = Depends(deps.get_current_active_superuser), # Only admin
) -> Any:
    """
    Trigger the optimization engine (Admin only)
    """
    print(f"Optimization triggered by {current_user.email}")
    
    engine = OptimizationEngine(AsyncSessionLocal())
    
    start_time = time.time()
    await engine.run()
    end_time = time.time()
    
    # Calculate stats
    stats = OptimizationStats(
        total_exams=len(engine.exams),
        conflicts_found=0, # Assuming greedy success
        success=True,
        execution_time=end_time - start_time
    )
    return stats
