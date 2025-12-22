from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class UserBase(BaseModel):
    email: Optional[str] = None
    is_active: Optional[bool] = True
    full_name: Optional[str] = None

class TimetableEntrySchema(BaseModel):
    id: int
    exam_id: int
    room_id: int
    supervisor_id: int
    start_time: datetime
    end_time: datetime
    
    # Nested info (optional but good for UI)
    exam_name: Optional[str] = None
    room_name: Optional[str] = None
    supervisor_name: Optional[str] = None

    class Config:
        orm_mode = True

class OptimizationStats(BaseModel):
    total_exams: int
    conflicts_found: int
    success: bool
    execution_time: float
