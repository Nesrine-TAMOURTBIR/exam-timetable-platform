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

@router.post("/draft", response_model=OptimizationStats)
async def run_draft_generation(
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Generate a Draft Timetable (Quick Heuristic)
    """
    print(f"Draft Generation triggered by {current_user.email}")
    try:
        engine = OptimizationEngine(AsyncSessionLocal)
        start_time = time.time()
        
        # Run only the constructive heuristic steps
        await engine.load_data()
        engine.build_conflict_graph()
        success = engine.initial_solution() # This saves if we modify run() logic or call save explicitly
        if success:
             await engine.save_results()
        
        end_time = time.time()
        
        stats = OptimizationStats(
            total_exams=len(engine.exams),
            conflicts_found=0, # Placeholder
            success=success,
            execution_time=end_time - start_time
        )
        return stats
    except Exception as e:
        print(f"Error during draft generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/run", response_model=OptimizationStats)
async def run_optimization(
    current_user: User = Depends(deps.get_current_active_superuser), # Only admin
) -> Any:
    """
    Trigger the full optimization engine (Admin only)
    """
    print(f"Full Optimization triggered by {current_user.email}")
    
    try:
        engine = OptimizationEngine(AsyncSessionLocal)
        
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
    except Exception as e:
        print(f"Error during optimization: {e}")
        raise HTTPException(status_code=500, detail=str(e))
