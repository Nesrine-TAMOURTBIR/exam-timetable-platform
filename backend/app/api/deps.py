from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import AsyncSessionLocal
from app.models.all_models import User
from app.core import security
import os

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl=f"/api/v1/login/access-token")

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_user(token: str = Depends(reusable_oauth2), db = Depends(get_db)) -> User:
    try:
        payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=[os.getenv("ALGORITHM")])
        token_data = payload.get("sub")
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    # Check User with profiles pre-loaded to avoid async lazy loading errors
    result = await db.execute(
        select(User)
        .where(User.id == int(token_data))
        .options(selectinload(User.student_profile), selectinload(User.professor_profile))
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

async def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != 'admin': # Simple check
         raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user
