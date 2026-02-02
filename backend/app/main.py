from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine, Base

# Import all models (REQUIRED so create_all sees them)
from app.models.user import User
from app.models.product import Product, ProductImage
from app.models.verification import VerificationToken
from app.models.admin_log import AdminLog


# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up...")

    try:
        async with engine.begin() as conn:
            # ✅ NEW: simple connection test (safe, no schema changes)
            await conn.execute(text("SELECT 1"))

            # ✅ KEEP your existing behavior EXACTLY
            await conn.run_sync(Base.metadata.create_all)

            print("✅ Database connected successfully!")
            print("✅ Database tables created/verified!")

    except Exception as e:
        print(f"❌ Database error: {e}")

    yield

    # Shutdown
    print("Shutting down...")
    await engine.dispose()


app = FastAPI(
    title="Marketplace API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs"
)


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# Root endpoints
@app.get("/")
async def root():
    return {
        "message": "Marketplace API is running",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}


# Import and activate API routes
from app.api.v1 import auth, products, admin

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])



# Added the above for db correspondence and not creating new tables after a restart 

# # backend/main.py

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.staticfiles import StaticFiles
# from contextlib import asynccontextmanager
# from pathlib import Path

# from app.core.config import settings
# from app.db.session import engine, Base

# # Import all models
# from app.models.user import User
# from app.models.product import Product, ProductImage
# from app.models.verification import VerificationToken
# from app.models.admin_log import AdminLog

# # Create uploads directory if it doesn't exist
# UPLOAD_DIR = Path("uploads")
# UPLOAD_DIR.mkdir(exist_ok=True)

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Startup
#     print("Starting up...")
#     try:
#         async with engine.begin() as conn:
#             await conn.run_sync(Base.metadata.create_all)
#             print("✅ Database connected successfully!")
#             print("✅ Database tables created/verified!")
#     except Exception as e:
#         print(f"❌ Database error: {e}")
    
#     yield
    
#     # Shutdown
#     print("Shutting down...")
#     await engine.dispose()

# app = FastAPI(
#     title="Marketplace API",
#     version="1.0.0",
#     lifespan=lifespan,
#     docs_url="/api/docs"
# )

# # CORS Middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=settings.ALLOWED_ORIGINS,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Mount static files for uploads
# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# # Root endpoints
# @app.get("/")
# async def root():
#     return {
#         "message": "Marketplace API is running",
#         "version": "1.0.0",
#         "environment": settings.ENVIRONMENT
#     }

# @app.get("/health")
# async def health_check():
#     return {"status": "healthy", "database": "connected"}

# # Import and activate API routes
# from app.api.v1 import auth, products, admin

# app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
# app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
# app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])











# backend/main.py

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from contextlib import asynccontextmanager

# from app.core.config import settings
# from app.db.session import engine, Base

# # Import all models
# from app.models.user import User
# from app.models.product import Product, ProductImage
# from app.models.verification import VerificationToken
# from app.models.admin_log import AdminLog

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Startup
#     print("Starting up...")
#     try:
#         async with engine.begin() as conn:
#             await conn.run_sync(Base.metadata.create_all)
#             print("✅ Database connected successfully!")
#             print("✅ Database tables created/verified!")
#     except Exception as e:
#         print(f"❌ Database error: {e}")
    
#     yield
    
#     # Shutdown
#     print("Shutting down...")
#     await engine.dispose()

# app = FastAPI(
#     title="Marketplace API",
#     version="1.0.0",
#     lifespan=lifespan,
#     docs_url="/api/docs"
# )

# # CORS Middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=settings.ALLOWED_ORIGINS,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Root endpoints
# @app.get("/")
# async def root():
#     return {
#         "message": "Marketplace API is running",
#         "version": "1.0.0",
#         "environment": settings.ENVIRONMENT
#     }

# @app.get("/health")
# async def health_check():
#     return {"status": "healthy", "database": "connected"}

# # Import and activate API routes
# from app.api.v1 import auth, products, admin

# app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
# app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
# app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])







# backend/main.py




# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from contextlib import asynccontextmanager

# from app.core.config import settings
# from app.db.session import engine, Base
# from app.api.v1 import auth

# # Import all models so they're registered with Base
# from app.models.user import User
# from app.models.product import Product, ProductImage
# from app.models.verification import VerificationToken
# from app.models.admin_log import AdminLog






# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Startup - create database tables
#     print("Starting up...")
#     try:
#         async with engine.begin() as conn:
#             # Create all tables
#             await conn.run_sync(Base.metadata.create_all)
#             print("✅ Database connected successfully!")
#             print("✅ Database tables created/verified!")
#     except Exception as e:
#         print(f"❌ Database error: {e}")
    
#     yield
    
#     # Shutdown
#     print("Shutting down...")
#     await engine.dispose()

# app = FastAPI(
#     title="Marketplace API",
#     version="1.0.0",
#     lifespan=lifespan,
#     docs_url="/api/docs"
# )

# app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])

# # CORS Middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=settings.ALLOWED_ORIGINS,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Root endpoints
# @app.get("/")
# async def root():
#     return {
#         "message": "Marketplace API is running",
#         "version": "1.0.0",
#         "environment": settings.ENVIRONMENT
#     }

# @app.get("/health")
# async def health_check():
#     return {"status": "healthy", "database": "connected"}















# API Routes - we'll uncomment these step by step
# from app.api.v1 import auth, products, admin
# app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
# app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
# app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])









# backend/main.py


# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from contextlib import asynccontextmanager

# from app.core.config import settings
# from app.db.session import engine

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Startup - test database connection
#     print("Starting up...")
#     try:
#         async with engine.begin() as conn:
#             await conn.run_sync(lambda _: print("✅ Database connected successfully!"))
#     except Exception as e:
#         print(f"❌ Database connection failed: {e}")
    
#     yield
    
#     # Shutdown
#     print("Shutting down...")
#     await engine.dispose()

# app = FastAPI(
#     title="Marketplace API",
#     version="1.0.0",
#     lifespan=lifespan,
#     docs_url="/api/docs"
# )

# # CORS Middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=settings.ALLOWED_ORIGINS,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Root endpoints
# @app.get("/")
# async def root():
#     return {
#         "message": "Marketplace API is running",
#         "version": "1.0.0",
#         "environment": settings.ENVIRONMENT
#     }

# @app.get("/health")
# async def health_check():
#     return {"status": "healthy"}



# backend/main.py


# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from contextlib import asynccontextmanager

# from app.core.config import settings

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Startup
#     print("Starting up...")
#     yield
#     # Shutdown
#     print("Shutting down...")

# app = FastAPI(
#     title="Marketplace API",
#     version="1.0.0",
#     lifespan=lifespan,
#     docs_url="/api/docs"
# )

# # CORS Middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Root endpoints
# @app.get("/")
# async def root():
#     return {"message": "Marketplace API is running", "version": "1.0.0"}

# @app.get("/health")
# async def health_check():
#     return {"status": "healthy"}

# Import and include routers (we'll uncomment these step by step)
# Uncomment these lines once we fix the imports
# from app.api.v1 import auth, products, admin
# app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
# app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
# app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])










# backend/main.py






# from fastapi import FastAPI, Request
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.middleware.trustedhost import TrustedHostMiddleware
# from slowapi import Limiter, _rate_limit_exceeded_handler
# from slowapi.util import get_remote_address
# from slowapi.errors import RateLimitExceeded
# import redis.asyncio as redis
# from contextlib import asynccontextmanager

# from app.api.v1 import auth, products, admin
# from app.core.config import settings
# from app.core.security import SecurityHeadersMiddleware
# from app.db.session import engine, Base

# # Rate limiter
# limiter = Limiter(key_func=get_remote_address)

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Startup
#     async with engine.begin() as conn:
#         await conn.run_sync(Base.metadata.create_all)
    
#     # Initialize Redis
#     app.state.redis = await redis.from_url(
#         settings.REDIS_URL,
#         encoding="utf-8",
#         decode_responses=True
#     )
    
#     yield
    
#     # Shutdown
#     await app.state.redis.close()

# app = FastAPI(
#     title="Marketplace API",
#     version="1.0.0",
#     lifespan=lifespan,
#     docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None
# )

# # Middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=settings.ALLOWED_ORIGINS,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)
# app.add_middleware(SecurityHeadersMiddleware)

# app.state.limiter = limiter
# app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# # Routes
# app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
# app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
# app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
# # app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])



# @app.get("/health")
# async def health_check():
#     return {"status": "healthy"}

