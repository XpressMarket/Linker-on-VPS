# backend/app/api/v1/admin.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.db.session import get_db
from app.models.product import Product, ProductImage
from app.models.user import User, UserRole, AdminPinQuota, RoleChangeAudit
from app.models.admin_log import AdminLog
from app.api.v1.auth import (
    require_admin, 
    require_super_admin,
    require_executive_admin,  # ✅ NEW
    require_platform_owner     # ✅ NEW
)
from app.services.storage import delete_image
from datetime import datetime, timezone


today = datetime.now(timezone.utc).date()

router = APIRouter()

# ============================================================================
# Existing Schemas (PRESERVED)
# ============================================================================

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


# ============================================================================
# ✅ NEW: RBAC Schemas
# ============================================================================

class PinQuotaInfo(BaseModel):
    admin_id: str
    admin_email: str
    role: str
    pins_used: int
    pin_limit: int
    pins_remaining: int

class RoleChangeRequest(BaseModel):
    target_user_id: str
    new_role: str
    reason: Optional[str] = None

class RoleAssignmentResponse(BaseModel):
    success: bool
    message: str
    user_id: str
    old_role: str
    new_role: str

class UserListItem(BaseModel):
    id: str
    email: str
    role: str
    is_email_verified: bool
    is_protected: bool
    created_at: datetime

class RoleChangeAuditItem(BaseModel):
    id: str
    target_user_email: str
    changed_by_email: Optional[str]
    old_role: str
    new_role: str
    reason: Optional[str]
    created_at: datetime


# ============================================================================
# ✅ UPDATED: PIN_LIMITS constant (replaces global 5-pin limit)
# ============================================================================

PIN_LIMITS = {
    UserRole.PLATFORM_OWNER: 6,
    UserRole.EXECUTIVE_ADMIN: 4,
    UserRole.ADMIN: 2,
    UserRole.SUPER_ADMIN: 6,  # Backward compatibility
    UserRole.USER: 0  # changed from USER to user
}


# ============================================================================
# Helper Functions (PRESERVED + ENHANCED)
# ============================================================================

async def log_admin_action(
    db: AsyncSession,
    admin_id: uuid.UUID,
    action: str,
    target_type: str,
    target_id: uuid.UUID,
    ip_address: str = None
):
    """✅ PRESERVED: Your existing log function"""
    log = AdminLog(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        ip_address=ip_address
    )
    db.add(log)
    await db.commit()


# ✅ NEW: Helper function for pin quota management
async def get_or_create_pin_quota(db: AsyncSession, admin_id: uuid.UUID) -> AdminPinQuota:
    """Get or create pin quota for admin"""
    result = await db.execute(
        select(AdminPinQuota).where(AdminPinQuota.admin_id == admin_id)
    )
    quota = result.scalar_one_or_none()
    
    if not quota:
        quota = AdminPinQuota(admin_id=admin_id, pins_used=0)
        db.add(quota)
        await db.commit()
        await db.refresh(quota)
    
    return quota


# ============================================================================
# Existing Admin Endpoints (PRESERVED - Your exact logic)
# ============================================================================

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """✅ PRESERVED: Your exact existing stats endpoint"""
    # Total products
    total_products_result = await db.execute(
        select(func.count()).select_from(Product).where(Product.is_active == True)
    )
    total_products = total_products_result.scalar()
    
    # Total users
    total_users_result = await db.execute(
        select(func.count()).select_from(User).where(
            and_(User.is_active == True, User.role == UserRole.USER) # changed from USER to user
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


# ✅ UPDATED: Pin product with individual quota tracking
@router.post("/pin-product")
async def pin_product(
    request: PinProductRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    ✅ UPDATED: Now tracks individual admin quotas instead of global limit
    """
    # Get admin's pin quota
    quota = await get_or_create_pin_quota(db, current_user.id)
    pin_limit = PIN_LIMITS.get(current_user.role, 0)
    
    # Check if admin has quota available
    if quota.pins_used >= pin_limit:
        raise HTTPException(
            status_code=400,
            detail=f"Pin quota exceeded. You have {pin_limit} pins maximum. Currently using {quota.pins_used}."
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
    
    # Pin the product and track who pinned it
    product.is_pinned = True
    product.pinned_by_admin_id = current_user.id
    product.pinned_at = datetime.now(timezone.utc)
    
    # Update admin's quota
    quota.pins_used += 1
    quota.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    
    # Log action
    await log_admin_action(
        db,
        current_user.id,
        "pin_product",
        "product",
        product.id
    )
    
    return {
        "message": "Product pinned successfully",
        "pins_used": quota.pins_used,
        "pins_remaining": pin_limit - quota.pins_used
    }


# ✅ UPDATED: Unpin product with quota return
@router.post("/unpin-product")
async def unpin_product(
    request: UnpinProductRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    ✅ UPDATED: Returns quota to the admin who originally pinned it
    Platform owner can unpin anyone's pins
    """
    result = await db.execute(
        select(Product).where(Product.id == uuid.UUID(request.product_id))
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not product.is_pinned:
        raise HTTPException(status_code=400, detail="Product is not pinned")
    
    # Check permission: can only unpin own pins unless platform owner
    if product.pinned_by_admin_id != current_user.id and current_user.role != UserRole.PLATFORM_OWNER:
        raise HTTPException(
            status_code=403, 
            detail="You can only unpin products you pinned yourself"
        )
    
    # Get the admin who pinned it to return their quota
    pinned_by_id = product.pinned_by_admin_id
    
    # Unpin the product
    product.is_pinned = False
    product.pinned_by_admin_id = None
    product.pinned_at = None
    
    # Return quota to the original pinner
    if pinned_by_id:
        quota = await get_or_create_pin_quota(db, pinned_by_id)
        if quota.pins_used > 0:
            quota.pins_used -= 1
            quota.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    
    # Log action
    await log_admin_action(
        db,
        current_user.id,
        "unpin_product",
        "product",
        product.id
    )
    
    return {
        "message": "Product unpinned successfully",
        "quota_returned_to": str(pinned_by_id) if pinned_by_id else None
    }


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_product(
    product_id: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """✅ PRESERVED: Your exact existing delete logic with quota return added"""
    result = await db.execute(
        select(Product).where(Product.id == uuid.UUID(product_id))
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # ✅ NEW: Return pin quota if product was pinned
    if product.is_pinned and product.pinned_by_admin_id:
        quota = await get_or_create_pin_quota(db, product.pinned_by_admin_id)
        if quota.pins_used > 0:
            quota.pins_used -= 1
            quota.updated_at = datetime.now(timezone.utc)
    
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
    """✅ PRESERVED: Your exact existing activity logs endpoint"""
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


# ============================================================================
# ✅ NEW: Pin Quota Management Endpoints
# ============================================================================

@router.get("/my-pin-quota", response_model=PinQuotaInfo)
async def get_my_pin_quota(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get current admin's pin quota information"""
    quota = await get_or_create_pin_quota(db, current_user.id)
    pin_limit = PIN_LIMITS.get(current_user.role, 0)
    
    return PinQuotaInfo(
        admin_id=str(current_user.id),
        admin_email=current_user.email,
        role=current_user.role.value,
        pins_used=quota.pins_used,
        pin_limit=pin_limit,
        pins_remaining=pin_limit - quota.pins_used
    )

@router.get("/pin-quotas", response_model=List[PinQuotaInfo])
async def get_all_pin_quotas(
    current_user: User = Depends(require_executive_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get pin quota information for all admins (Executive+ only).
    Executive admins see only regular admins.
    Platform owner sees all admins.
    """
    # Build query based on role
    if current_user.role == UserRole.PLATFORM_OWNER:
        # Platform owner sees all admins
        query = select(User).where(
            User.role.in_([
                UserRole.ADMIN, 
                UserRole.EXECUTIVE_ADMIN, 
                UserRole.PLATFORM_OWNER,
                UserRole.SUPER_ADMIN
            ])
        )
    
    elif current_user.role == UserRole.EXECUTIVE_ADMIN:
        # ✅ FIXED: Executive admin sees only regular admins, NOT platform owners or other executives
        query = select(User).where(
            User.role == UserRole.ADMIN
        )
    
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    query = query.order_by(User.created_at)
    
    result = await db.execute(query)
    admins = result.scalars().all()
    
    quotas = []
    for admin in admins:
        quota = await get_or_create_pin_quota(db, admin.id)
        pin_limit = PIN_LIMITS.get(admin.role, 0)
        
        quotas.append(PinQuotaInfo(
            admin_id=str(admin.id),
            admin_email=admin.email,
            role=admin.role.value,
            pins_used=quota.pins_used,
            pin_limit=pin_limit,
            pins_remaining=pin_limit - quota.pins_used
        ))
    
    return quotas



# @router.get("/pin-quotas", response_model=List[PinQuotaInfo])
# async def get_all_pin_quotas(
#     current_user: User = Depends(require_executive_admin),
#     db: AsyncSession = Depends(get_db)
# ):
#     """Get pin quota information for all admins (Executive+ only)"""
#     # Get all admins
#     result = await db.execute(
#         select(User).where(
#             User.role.in_([
#                 UserRole.ADMIN, 
#                 UserRole.EXECUTIVE_ADMIN, 
#                 UserRole.PLATFORM_OWNER,
#                 UserRole.SUPER_ADMIN
#             ])
#         ).order_by(User.created_at)
#     )
#     admins = result.scalars().all()
    
#     quotas = []
#     for admin in admins:
#         quota = await get_or_create_pin_quota(db, admin.id)
#         pin_limit = PIN_LIMITS.get(admin.role, 0)
        
#         quotas.append(PinQuotaInfo(
#             admin_id=str(admin.id),
#             admin_email=admin.email,
#             role=admin.role.value,
#             pins_used=quota.pins_used,
#             pin_limit=pin_limit,
#             pins_remaining=pin_limit - quota.pins_used
#         ))
    
#     return quotas


# ============================================================================
# Existing Super Admin Endpoints (PRESERVED)
# ============================================================================

@router.post("/assign-admin")
async def assign_admin_role(
    request: AssignAdminRequest,
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """✅ PRESERVED: Your exact existing assign admin logic"""
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
    
    # ✅ NEW: Create pin quota for new admin
    await get_or_create_pin_quota(db, user.id)
    
    # Log action
    await log_admin_action(
        db,
        current_user.id,
        "assign_admin",
        "user",
        user.id
    )
    
    return {"message": f"Admin role assigned to {user.email}"}


@router.post("/remove-admin")
async def remove_admin_role(
    request: AssignAdminRequest,
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """✅ PRESERVED: Your exact existing remove admin logic with protection check"""
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
    
    # ✅ Check if user is protected (your existing code)
    if hasattr(user, 'is_protected') and user.is_protected:
        raise HTTPException(
            status_code=403,
            detail="This is a protected admin account and cannot be modified"
        )
    
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="User is not an admin")
    
    # ✅ NEW: Unpin all products pinned by this admin before demotion
    pinned_products_result = await db.execute(
        select(Product).where(Product.pinned_by_admin_id == user.id)
    )
    pinned_products = pinned_products_result.scalars().all()
    
    for product in pinned_products:
        product.is_pinned = False
        product.pinned_by_admin_id = None
        product.pinned_at = None
    
    user.role = UserRole.USER # changed from USER to user
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


@router.get("/users", response_model=List[dict])
async def list_all_users(
    page: int = 1,
    page_size: int = 50,
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """✅ PRESERVED: Your exact existing user list endpoint"""
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


# ============================================================================
# ✅ NEW: RBAC Role Management Endpoints
# ============================================================================

@router.post("/assign-role", response_model=RoleAssignmentResponse)
async def assign_role(
    request: RoleChangeRequest,
    current_user: User = Depends(require_executive_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Assign or change user role with hierarchical permissions.
    Executive admins can manage regular admins.
    Platform owner can manage executive admins and admins.
    """
    # Get target user
    result = await db.execute(
        select(User).where(User.id == uuid.UUID(request.target_user_id))
    )
    target_user = result.scalar_one_or_none()
    
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Cannot modify protected users
    if target_user.is_protected:
        raise HTTPException(
            status_code=403, 
            detail="Cannot modify protected user"
        )
    
    # Cannot modify self
    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=400, 
            detail="Cannot change your own role"
        )
    
    # Parse new role
    try:
        new_role = UserRole(request.new_role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Check if current user can assign this role
    if not current_user.can_manage_role(new_role):
        raise HTTPException(
            status_code=403,
            detail=f"You cannot assign the role: {new_role.value}"
        )
    
    # Check role limits
    if new_role == UserRole.EXECUTIVE_ADMIN:
        count_result = await db.execute(
            select(func.count(User.id)).where(User.role == UserRole.EXECUTIVE_ADMIN)
        )
        current_count = count_result.scalar()
        
        if target_user.role != UserRole.EXECUTIVE_ADMIN and current_count >= 4:
            raise HTTPException(
                status_code=400,
                detail="Maximum 4 Executive Admins allowed"
            )
    
    elif new_role == UserRole.ADMIN:
        count_result = await db.execute(
            select(func.count(User.id)).where(User.role == UserRole.ADMIN)
        )
        current_count = count_result.scalar()
        
        if target_user.role != UserRole.ADMIN and current_count >= 8:
            raise HTTPException(
                status_code=400,
                detail="Maximum 8 Admins allowed"
            )
    
    # Store old role for audit
    old_role = target_user.role
    
    # Update role
    target_user.role = new_role
    
    # Handle pin quota
    if new_role in [UserRole.ADMIN, UserRole.EXECUTIVE_ADMIN, UserRole.PLATFORM_OWNER]:
        # Create quota if promoting to admin
        await get_or_create_pin_quota(db, target_user.id)
    else:
        # Remove pins if demoting from admin
        if old_role in [UserRole.ADMIN, UserRole.EXECUTIVE_ADMIN, UserRole.PLATFORM_OWNER, UserRole.SUPER_ADMIN]:
            # Unpin all products
            pinned_result = await db.execute(
                select(Product).where(Product.pinned_by_admin_id == target_user.id)
            )
            pinned_products = pinned_result.scalars().all()
            
            for product in pinned_products:
                product.is_pinned = False
                product.pinned_by_admin_id = None
                product.pinned_at = None
    
    # Create audit record
    audit = RoleChangeAudit(
        target_user_id=target_user.id,
        changed_by_id=current_user.id,
        old_role=old_role,
        new_role=new_role,
        reason=request.reason
    )
    db.add(audit)
    
    # Log action
    await log_admin_action(
        db,
        current_user.id,
        "role_change",
        "user",
        target_user.id
    )
    
    await db.commit()
    
    return RoleAssignmentResponse(
        success=True,
        message=f"Role updated successfully",
        user_id=str(target_user.id),
        old_role=old_role.value,
        new_role=new_role.value
    )


@router.get("/role-changes", response_model=List[RoleChangeAuditItem])
async def get_role_changes(
    limit: int = 50,
    current_user: User = Depends(require_executive_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get role change audit trail (Executive+ only)"""
    query = (
        select(RoleChangeAudit)
        .order_by(RoleChangeAudit.created_at.desc())
        .limit(limit)
    )
    
    result = await db.execute(query)
    audits = result.scalars().all()
    
    changes = []
    for audit in audits:
        # Get target user email
        target_result = await db.execute(
            select(User).where(User.id == audit.target_user_id)
        )
        target_user = target_result.scalar_one_or_none()
        
        # Get changer email
        changed_by_email = None
        if audit.changed_by_id:
            changer_result = await db.execute(
                select(User).where(User.id == audit.changed_by_id)
            )
            changer = changer_result.scalar_one_or_none()
            if changer:
                changed_by_email = changer.email
        
        changes.append(RoleChangeAuditItem(
            id=str(audit.id),
            target_user_email=target_user.email if target_user else "Unknown",
            changed_by_email=changed_by_email or "System",
            old_role=audit.old_role.value,
            new_role=audit.new_role.value,
            reason=audit.reason,
            created_at=audit.created_at
        ))
    
    return changes


@router.get("/manageable-users", response_model=List[UserListItem])
async def get_manageable_users(
    current_user: User = Depends(require_executive_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of users this admin can manage.
    Executive admins see users and admins ONLY (not platform owners or other executives).
    Platform owner sees all except protected.
    """
    # Build query based on role
    if current_user.role == UserRole.PLATFORM_OWNER:
        # Platform owner sees all except protected users
        query = select(User).where(User.is_protected == False)
    
    elif current_user.role == UserRole.EXECUTIVE_ADMIN:
        # ✅ FIXED: Executive admin sees ONLY users and admins
        # They should NOT see platform owners or other executive admins
        query = select(User).where(
            User.role.in_([UserRole.USER, UserRole.ADMIN])
        )
    
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    query = query.order_by(User.created_at.desc())
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return [
        UserListItem(
            id=str(user.id),
            email=user.email,
            role=user.role.value,
            is_email_verified=user.is_email_verified,
            is_protected=user.is_protected,
            created_at=user.created_at
        )
        for user in users
    ]



# @router.get("/manageable-users", response_model=List[UserListItem])
# async def get_manageable_users(
#     current_user: User = Depends(require_executive_admin),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Get list of users this admin can manage.
#     Executive admins see users and admins.
#     Platform owner sees all except protected.
#     """
#     # Build query based on role
#     if current_user.role == UserRole.PLATFORM_OWNER:
#         # Platform owner sees all except protected
#         query = select(User).where(User.is_protected == False)
#     elif current_user.role == UserRole.EXECUTIVE_ADMIN:
#         # Executive admin sees users and admins
#         query = select(User).where(
#             User.role.in_([UserRole.USER, UserRole.ADMIN])
#            # changed from USER to user
#         )
#     else:
#         raise HTTPException(status_code=403, detail="Insufficient permissions")
    
#     query = query.order_by(User.created_at.desc())
    
#     result = await db.execute(query)
#     users = result.scalars().all()
    
#     return [
#         UserListItem(
#             id=str(user.id),
#             email=user.email,
#             role=user.role.value,
#             is_email_verified=user.is_email_verified,
#             is_protected=user.is_protected,
#             created_at=user.created_at
#         )
#         for user in users
#     ]





# backend/app/api/v1/admin.py


# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy import select, func, and_
# from typing import List
# from pydantic import BaseModel
# from datetime import datetime
# import uuid

# from app.db.session import get_db
# from app.models.product import Product, ProductImage
# from app.models.user import User, UserRole
# from app.models.admin_log import AdminLog
# from app.api.v1.auth import require_admin, require_super_admin
# from app.services.storage import delete_image
# from datetime import datetime, timezone


# today = datetime.now(timezone.utc).date()

# router = APIRouter()

# # Schemas
# class PinProductRequest(BaseModel):
#     product_id: str

# class UnpinProductRequest(BaseModel):
#     product_id: str

# class AssignAdminRequest(BaseModel):
#     user_id: str

# class DashboardStats(BaseModel):
#     total_products: int
#     total_users: int
#     total_admins: int
#     pinned_products: int
#     products_today: int

# class AdminActivityLog(BaseModel):
#     id: str
#     admin_email: str
#     action: str
#     target_type: str
#     target_id: str
#     created_at: datetime

# # Helper function
# async def log_admin_action(
#     db: AsyncSession,
#     admin_id: uuid.UUID,
#     action: str,
#     target_type: str,
#     target_id: uuid.UUID,
#     ip_address: str = None
# ):
#     log = AdminLog(
#         admin_id=admin_id,
#         action=action,
#         target_type=target_type,
#         target_id=target_id,
#         ip_address=ip_address
#     )
#     db.add(log)
#     await db.commit()


# # Admin endpoints
# @router.get("/stats", response_model=DashboardStats)
# async def get_dashboard_stats(
#     current_user: User = Depends(require_admin),
#     db: AsyncSession = Depends(get_db)
# ):
#     # Total products
#     total_products_result = await db.execute(
#         select(func.count()).select_from(Product).where(Product.is_active == True)
#     )
#     total_products = total_products_result.scalar()
    
#     # Total users
#     total_users_result = await db.execute(
#         select(func.count()).select_from(User).where(
#             and_(User.is_active == True, User.role == UserRole.USER)
#         )
#     )
#     total_users = total_users_result.scalar()
    
#     # Total admins
#     total_admins_result = await db.execute(
#         select(func.count()).select_from(User).where(
#             User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN])
#         )
#     )
#     total_admins = total_admins_result.scalar()
    
#     # Pinned products
#     pinned_result = await db.execute(
#         select(func.count()).select_from(Product).where(
#             and_(Product.is_active == True, Product.is_pinned == True)
#         )
#     )
#     pinned_products = pinned_result.scalar()
    
#     # Products created today
#     # today = datetime.now(timezone.utc) #datetime.utcnow().date()
#     products_today_result = await db.execute(
#         select(func.count()).select_from(Product).where(
#             func.date(Product.created_at) == today
#             )
#         )
#     products_today = products_today_result.scalar()
    
#     return DashboardStats(
#         total_products=total_products,
#         total_users=total_users,
#         total_admins=total_admins,
#         pinned_products=pinned_products,
#         products_today=products_today
#     )


# @router.post("/pin-product")
# async def pin_product(
#     request: PinProductRequest,
#     current_user: User = Depends(require_admin),
#     db: AsyncSession = Depends(get_db)
# ):
#     # Check current pinned count
#     pinned_count_result = await db.execute(
#         select(func.count()).select_from(Product).where(Product.is_pinned == True)
#     )
#     pinned_count = pinned_count_result.scalar()
    
#     if pinned_count >= 5:
#         raise HTTPException(
#             status_code=400,
#             detail="Maximum 5 products can be pinned. Please unpin a product first."
#         )
    
#     # Find product
#     result = await db.execute(
#         select(Product).where(Product.id == uuid.UUID(request.product_id))
#     )
#     product = result.scalar_one_or_none()
    
#     if not product:
#         raise HTTPException(status_code=404, detail="Product not found")
    
#     if product.is_pinned:
#         raise HTTPException(status_code=400, detail="Product is already pinned")
    
#     product.is_pinned = True
#     await db.commit()
    
#     # Log action
#     await log_admin_action(
#         db,
#         current_user.id,
#         "pin_product",
#         "product",
#         product.id
#     )
    
#     return {"message": "Product pinned successfully"}


# @router.post("/unpin-product")
# async def unpin_product(
#     request: UnpinProductRequest,
#     current_user: User = Depends(require_admin),
#     db: AsyncSession = Depends(get_db)
# ):
#     result = await db.execute(
#         select(Product).where(Product.id == uuid.UUID(request.product_id))
#     )
#     product = result.scalar_one_or_none()
    
#     if not product:
#         raise HTTPException(status_code=404, detail="Product not found")
    
#     if not product.is_pinned:
#         raise HTTPException(status_code=400, detail="Product is not pinned")
    
#     product.is_pinned = False
#     await db.commit()
    
#     # Log action
#     await log_admin_action(
#         db,
#         current_user.id,
#         "unpin_product",
#         "product",
#         product.id
#     )
    
#     return {"message": "Product unpinned successfully"}


# @router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def admin_delete_product(
#     product_id: str,
#     current_user: User = Depends(require_admin),
#     db: AsyncSession = Depends(get_db)
# ):
#     result = await db.execute(
#         select(Product).where(Product.id == uuid.UUID(product_id))
#     )
#     product = result.scalar_one_or_none()
    
#     if not product:
#         raise HTTPException(status_code=404, detail="Product not found")
    
#     # Delete images from storage
#     images_result = await db.execute(
#         select(ProductImage).where(ProductImage.product_id == product.id)
#     )
#     images = images_result.scalars().all()
    
#     for image in images:
#         await delete_image(image.image_key)
    
#     # Log action
#     await log_admin_action(
#         db,
#         current_user.id,
#         "delete_product",
#         "product",
#         product.id
#     )
    
#     # Delete product
#     await db.delete(product)
#     await db.commit()
    
#     return None


# @router.get("/activity-logs", response_model=List[AdminActivityLog])
# async def get_activity_logs(
#     limit: int = 50,
#     current_user: User = Depends(require_admin),
#     db: AsyncSession = Depends(get_db)
# ):
#     query = select(AdminLog, User).join(
#         User, AdminLog.admin_id == User.id
#     ).order_by(AdminLog.created_at.desc()).limit(limit)
    
#     result = await db.execute(query)
#     logs = result.all()
    
#     return [
#         AdminActivityLog(
#             id=str(log.AdminLog.id),
#             admin_email=log.User.email,
#             action=log.AdminLog.action,
#             target_type=log.AdminLog.target_type or "",
#             target_id=str(log.AdminLog.target_id) if log.AdminLog.target_id else "",
#             created_at=log.AdminLog.created_at
#         )
#         for log in logs
#     ]


# # Super Admin endpoints
# @router.post("/assign-admin")
# async def assign_admin_role(
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
#             detail="Cannot modify super admin role"
#         )
    
#     if user.role == UserRole.ADMIN:
#         raise HTTPException(status_code=400, detail="User is already an admin")
    
#     user.role = UserRole.ADMIN
#     await db.commit()
    
#     # Log action
#     await log_admin_action(
#         db,
#         current_user.id,
#         "assign_admin",
#         "user",
#         user.id
#     )
    
#     return {"message": f"Admin role assigned to {user.email}"}

# # To not remove admin

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
    
#     # ✅ NEW: Check if user is protected
#     if hasattr(user, 'is_protected') and user.is_protected:
#         raise HTTPException(
#             status_code=403,
#             detail="This is a protected admin account and cannot be modified"
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


# @router.get("/users", response_model=List[dict])
# async def list_all_users(
#     page: int = 1,
#     page_size: int = 50,
#     current_user: User = Depends(require_super_admin),
#     db: AsyncSession = Depends(get_db)
# ):
#     offset = (page - 1) * page_size
    
#     query = select(User).order_by(User.created_at.desc()).offset(offset).limit(page_size)
#     result = await db.execute(query)
#     users = result.scalars().all()
    
#     return [
#         {
#             "id": str(user.id),
#             "email": user.email,
#             "role": user.role.value,
#             "is_email_verified": user.is_email_verified,
#             "is_active": user.is_active,
#             "created_at": user.created_at
#         }
#         for user in users
#     ]