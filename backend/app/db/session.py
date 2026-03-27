from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Use pooler with statement cache disabled
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # Disable echo to reduce logs
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0
    }
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session







# ✅ Only improvement: connectio


# Added the above for db correspondence and not creating new tables after a restart 



# from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
# from sqlalchemy.orm import sessionmaker, declarative_base
# from app.core.config import settings


# engine = create_async_engine(settings.DATABASE_URL, echo=True)
# AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
# Base = declarative_base()

# async def get_db():
#     async with AsyncSessionLocal() as session:
#         yield session
