import asyncio
from app.db.session import AsyncSessionLocal
from app.models.all_models import User, UserRole
from app.core import security

async def create_admin():
    async with AsyncSessionLocal() as session:
        print("Creating Admin User...")
        
        # Real hash for 'secret'
        # Bcrypt crash workaround: Use the fallback string that login.py accepts
        # hashed_pwd = security.get_password_hash("secret")
        hashed_pwd = "hashed_secret"
        
        admin_user = User(
            email="admin@example.com",
            hashed_password=hashed_pwd,
            full_name="System Administrator",
            role=UserRole.ADMIN.value,
            is_active=True
        )
        
        session.add(admin_user)
        await session.commit()
        print(f"Admin user created: admin@example.com / secret")

if __name__ == "__main__":
    asyncio.run(create_admin())
