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
    print(f"[DRAFT] Draft Generation triggered by {current_user.email}")
    try:
        engine = OptimizationEngine(AsyncSessionLocal)
        start_time = time.time()
        
        print(f"[DRAFT] Starting draft generation...")
        # Run in draft mode (faster, fewer slots)
        await engine.run(mode="draft")
        
        end_time = time.time()
        print(f"[DRAFT] Completed! Total exams: {len(engine.exams)}, Time: {end_time - start_time:.2f}s")
        
        stats = OptimizationStats(
            total_exams=len(engine.exams),
            conflicts_found=0, # Placeholder
            success=True,
            execution_time=end_time - start_time
        )
        print(f"[DRAFT] Returning stats: {stats.dict()}")
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
    print(f"[OPTIMIZE] Full Optimization triggered by {current_user.email}")
    
    try:
        engine = OptimizationEngine(AsyncSessionLocal)
        
        print(f"[OPTIMIZE] Starting full optimization...")
        start_time = time.time()
        await engine.run(mode="optimized")
        end_time = time.time()
        print(f"[OPTIMIZE] Completed! Total exams: {len(engine.exams)}, Time: {end_time - start_time:.2f}s")
        
        # Calculate stats
        stats = OptimizationStats(
            total_exams=len(engine.exams),
            conflicts_found=0, # Assuming greedy success
            success=True,
            execution_time=end_time - start_time
        )
        print(f"[OPTIMIZE] Returning stats: {stats.dict()}")
        return stats
    except Exception as e:
        print(f"Error during optimization: {e}")
        raise HTTPException(status_code=500, detail=str(e))
