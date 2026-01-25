# backend/app/api/v1/admin.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.db.session import get_db
from app.models.product import Product, ProductImage
from app.models.user import User, UserRole
from app.models.admin_log import AdminLog
from app.api.v1.auth import require_admin, require_super_admin
from app.services.storage import delete_image
from datetime import datetime, timezone


today = datetime.now(timezone.utc).date()

router = APIRouter()

# Schemas
class PinProductRequest(BaseModel):
    product_id: str

class UnpinProductRequest(BaseModel):
    product_id: str

class AssignAdminRequest(BaseModel):
    user_id: str

class DashboardStats(BaseModel):
    total_products: int
    total_users: int
    total_admins: int
    pinned_products: int
    products_today: int

class AdminActivityLog(BaseModel):
    id: str
    admin_email: str
    action: str
    target_type: str
    target_id: str
    created_at: datetime

# Helper function
async def log_admin_action(
    db: AsyncSession,
    admin_id: uuid.UUID,
    action: str,
    target_type: str,
    target_id: uuid.UUID,
    ip_address: str = None
):
    log = AdminLog(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        ip_address=ip_address
    )
    db.add(log)
    await db.commit()


# Admin endpoints
@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    # Total products
    total_products_result = await db.execute(
        select(func.count()).select_from(Product).where(Product.is_active == True)
    )
    total_products = total_products_result.scalar()
    
    # Total users
    total_users_result = await db.execute(
        select(func.count()).select_from(User).where(
            and_(User.is_active == True, User.role == UserRole.USER)
        )
    )
    total_users = total_users_result.scalar()
    
    # Total admins
    total_admins_result = await db.execute(
        select(func.count()).select_from(User).where(
            User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN])
        )
    )
    total_admins = total_admins_result.scalar()
    
    # Pinned products
    pinned_result = await db.execute(
        select(func.count()).select_from(Product).where(
            and_(Product.is_active == True, Product.is_pinned == True)
        )
    )
    pinned_products = pinned_result.scalar()
    
    # Products created today
    # today = datetime.now(timezone.utc) #datetime.utcnow().date()
    products_today_result = await db.execute(
        select(func.count()).select_from(Product).where(
            func.date(Product.created_at) == today
            )
        )
    products_today = products_today_result.scalar()
    
    return DashboardStats(
        total_products=total_products,
        total_users=total_users,
        total_admins=total_admins,
        pinned_products=pinned_products,
        products_today=products_today
    )


@router.post("/pin-product")
async def pin_product(
    request: PinProductRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    # Check current pinned count
    pinned_count_result = await db.execute(
        select(func.count()).select_from(Product).where(Product.is_pinned == True)
    )
    pinned_count = pinned_count_result.scalar()
    
    if pinned_count >= 5:
        raise HTTPException(
            status_code=400,
            detail="Maximum 5 products can be pinned. Please unpin a product first."
        )
    
    # Find product
    result = await db.execute(
        select(Product).where(Product.id == uuid.UUID(request.product_id))
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.is_pinned:
        raise HTTPException(status_code=400, detail="Product is already pinned")
    
    product.is_pinned = True
    await db.commit()
    
    # Log action
    await log_admin_action(
        db,
        current_user.id,
        "pin_product",
        "product",
        product.id
    )
    
    return {"message": "Product pinned successfully"}


@router.post("/unpin-product")
async def unpin_product(
    request: UnpinProductRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Product).where(Product.id == uuid.UUID(request.product_id))
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not product.is_pinned:
        raise HTTPException(status_code=400, detail="Product is not pinned")
    
    product.is_pinned = False
    await db.commit()
    
    # Log action
    await log_admin_action(
        db,
        current_user.id,
        "unpin_product",
        "product",
        product.id
    )
    
    return {"message": "Product unpinned successfully"}


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_product(
    product_id: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Product).where(Product.id == uuid.UUID(product_id))
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Delete images from storage
    images_result = await db.execute(
        select(ProductImage).where(ProductImage.product_id == product.id)
    )
    images = images_result.scalars().all()
    
    for image in images:
        await delete_image(image.image_key)
    
    # Log action
    await log_admin_action(
        db,
        current_user.id,
        "delete_product",
        "product",
        product.id
    )
    
    # Delete product
    await db.delete(product)
    await db.commit()
    
    return None


@router.get("/activity-logs", response_model=List[AdminActivityLog])
async def get_activity_logs(
    limit: int = 50,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    query = select(AdminLog, User).join(
        User, AdminLog.admin_id == User.id
    ).order_by(AdminLog.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    logs = result.all()
    
    return [
        AdminActivityLog(
            id=str(log.AdminLog.id),
            admin_email=log.User.email,
            action=log.AdminLog.action,
            target_type=log.AdminLog.target_type or "",
            target_id=str(log.AdminLog.target_id) if log.AdminLog.target_id else "",
            created_at=log.AdminLog.created_at
        )
        for log in logs
    ]


# Super Admin endpoints
@router.post("/assign-admin")
async def assign_admin_role(
    request: AssignAdminRequest,
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).where(User.id == uuid.UUID(request.user_id))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=400,
            detail="Cannot modify super admin role"
        )
    
    if user.role == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="User is already an admin")
    
    user.role = UserRole.ADMIN
    await db.commit()
    
    # Log action
    await log_admin_action(
        db,
        current_user.id,
        "assign_admin",
        "user",
        user.id
    )
    
    return {"message": f"Admin role assigned to {user.email}"}

# To not remove admin

@router.post("/remove-admin")
async def remove_admin_role(
    request: AssignAdminRequest,
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).where(User.id == uuid.UUID(request.user_id))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove super admin role"
        )
    
    # ✅ NEW: Check if user is protected
    if hasattr(user, 'is_protected') and user.is_protected:
        raise HTTPException(
            status_code=403,
            detail="This is a protected admin account and cannot be modified"
        )
    
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="User is not an admin")
    
    user.role = UserRole.USER
    await db.commit()
    
    # Log action
    await log_admin_action(
        db,
        current_user.id,
        "remove_admin",
        "user",
        user.id
    )
    
    return {"message": f"Admin role removed from {user.email}"}

# @router.post("/remove-admin")
# async def remove_admin_role(
#     request: AssignAdminRequest,
#     current_user: User = Depends(require_super_admin),
#     db: AsyncSession = Depends(get_db)
# ):
#     result = await db.execute(
#         select(User).where(User.id == uuid.UUID(request.user_id))
#     )
#     user = result.scalar_one_or_none()
    
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
    
#     if user.role == UserRole.SUPER_ADMIN:
#         raise HTTPException(
#             status_code=400,
#             detail="Cannot remove super admin role"
#         )
    
#     if user.role != UserRole.ADMIN:
#         raise HTTPException(status_code=400, detail="User is not an admin")
    
#     user.role = UserRole.USER
#     await db.commit()
    
#     # Log action
#     await log_admin_action(
#         db,
#         current_user.id,
#         "remove_admin",
#         "user",
#         user.id
#     )
    
#     return {"message": f"Admin role removed from {user.email}"}


@router.get("/users", response_model=List[dict])
async def list_all_users(
    page: int = 1,
    page_size: int = 50,
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    offset = (page - 1) * page_size
    
    query = select(User).order_by(User.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()
    
    return [
        {
            "id": str(user.id),
            "email": user.email,
            "role": user.role.value,
            "is_email_verified": user.is_email_verified,
            "is_active": user.is_active,
            "created_at": user.created_at
        }
        for user in users
    ]