from fastapi import APIRouter
from app.api.api_v1.endpoints import login, timetable, optimization, stats, manage, workflow

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(timetable.router, prefix="/timetable", tags=["timetable"])
api_router.include_router(optimization.router, prefix="/optimize", tags=["optimization"])
api_router.include_router(stats.router, prefix="/stats", tags=["stats"])
api_router.include_router(manage.router, prefix="/manage", tags=["management"])
api_router.include_router(workflow.router, prefix="/workflow", tags=["workflow"])
