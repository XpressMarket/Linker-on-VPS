import asyncio
from app.db.session import engine, Base
from app.models.user import User, UserRole, AdminPinQuota, RoleChangeAudit
from app.models.product import Product, ProductImage
from app.models.verification import VerificationToken
from app.models.admin_log import AdminLog
from app.core.security import get_password_hash

async def init_database():
    print("🔄 Creating all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ All tables created!")
    
    # Create platform owner account
    print("🔄 Creating platform owner account...")
    from app.db.session import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        platform_owner = User(
            email="obedojingwa@gmail.com",
            password_hash=get_password_hash("Andy"),
            role=UserRole.PLATFORM_OWNER,
            is_email_verified=True,
            is_active=True,
            is_protected=True
        )
        session.add(platform_owner)
        await session.commit()
        print(f"✅ Platform owner created: {platform_owner.email}")
        print("⚠️  CHANGE PASSWORD IMMEDIATELY after first login!")

if __name__ == "__main__":
    asyncio.run(init_database())
