import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.all_models import User
from app.core.security import verify_password

async def check_admin():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == "admin@example.com"))
        user = result.scalars().first()
        
        if user:
            print(f"User found: {user.email}")
            print(f"Stored Hash: {user.hashed_password}")
            
            # Test 'secret'
            is_valid_hash = verify_password("secret", user.hashed_password)
            print(f"Verify 'secret' against hash: {is_valid_hash}")
            
            is_fallback_valid = (user.hashed_password == "hashed_secret")
            print(f"Is fallback 'hashed_secret': {is_fallback_valid}")
            
        else:
            print("Admin user NOT FOUND")

if __name__ == "__main__":
    asyncio.run(check_admin())
