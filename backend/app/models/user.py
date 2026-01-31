# backend/app/models/user.py
from sqlalchemy import Column, String, Boolean, Enum, DateTime, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

from app.db.session import Base

class UserRole(str, enum.Enum):
    """
    RBAC Role Hierarchy:
    - platform_owner: Root admin (1 user, protected) - replaces super_admin
    - executive_admin: Can manage regular admins (max 4)
    - admin: Can manage products, pin items (max 8)
    - user: Regular user (unlimited)
    """
  #  USER = "user"  changed from USER to user 
    USER = "user"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"  # ✅ KEPT for backward compatibility, will migrate to platform_owner
    EXECUTIVE_ADMIN = "executive_admin"  # ✅ NEW
    PLATFORM_OWNER = "platform_owner"    # ✅ NEW

class User(Base):
    __tablename__ = "users"
    
    # ✅ Preserved your exact field structure
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    # default=UserRole.user  ==  changed from USER to user
    is_email_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_protected = Column(Boolean, default=False)  # ✅ Already exists in your code
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))
    
    # ✅ NEW: Relationships for RBAC
    pin_quota = relationship("AdminPinQuota", back_populates="admin", uselist=False, cascade="all, delete-orphan")
    role_changes_performed = relationship("RoleChangeAudit", back_populates="changed_by_admin", foreign_keys="RoleChangeAudit.changed_by_id")
    role_changes_received = relationship("RoleChangeAudit", back_populates="target_user", foreign_keys="RoleChangeAudit.target_user_id")

    # ✅ NEW: Helper properties for role checking
    @property
    def is_admin(self) -> bool:
        """Check if user has any admin privileges"""
        return self.role in [UserRole.ADMIN, UserRole.EXECUTIVE_ADMIN, UserRole.PLATFORM_OWNER, UserRole.SUPER_ADMIN]
    
    @property
    def is_executive_admin(self) -> bool:
        """Check if user is executive admin or higher"""
        return self.role in [UserRole.EXECUTIVE_ADMIN, UserRole.PLATFORM_OWNER]
    
    @property
    def is_platform_owner(self) -> bool:
        """Check if user is platform owner"""
        return self.role == UserRole.PLATFORM_OWNER
    
    def can_manage_role(self, target_role: UserRole) -> bool:
        """
        Check if this user can assign/revoke a specific role.
        
        Hierarchy:
        - platform_owner: Can manage executive_admin and admin
        - executive_admin: Can manage admin only
        - admin: Cannot manage any roles
        - user: Cannot manage any roles
        """
        if self.role == UserRole.PLATFORM_OWNER:
            return target_role in [UserRole.EXECUTIVE_ADMIN, UserRole.ADMIN]
        elif self.role == UserRole.EXECUTIVE_ADMIN:
            return target_role == UserRole.ADMIN
        return False
    
    def get_pin_quota(self) -> int:
        """
        Get pin quota based on role.
        
        ⚠️ PIN QUOTA CONFIGURATION - Adjust these values to change limits:
        """
        quota_map = {
            UserRole.PLATFORM_OWNER: 6,
            UserRole.EXECUTIVE_ADMIN: 4,
            UserRole.ADMIN: 2,
            UserRole.SUPER_ADMIN: 6,  # Backward compatibility
            UserRole.USER: 0 # changed from USER to user
        }
        return quota_map.get(self.role, 0)


# ✅ NEW: Admin Pin Quota Tracking
class AdminPinQuota(Base):
    """Tracks individual pin quota usage for each admin"""
    __tablename__ = "admin_pin_quotas"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    pins_used = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    admin = relationship("User", back_populates="pin_quota")
    
    @staticmethod
    def get_pin_limit(role: UserRole) -> int:
        """
        Get maximum pins allowed for a role.
        
        ⚠️ ADJUST PIN LIMITS HERE
        """
        limits = {
            UserRole.PLATFORM_OWNER: 6,
            UserRole.EXECUTIVE_ADMIN: 4,
            UserRole.ADMIN: 2,
            UserRole.SUPER_ADMIN: 6,  # Backward compatibility
            UserRole.USER: 0 # changed from USER to user
        }
        return limits.get(role, 0)
    
    def can_pin(self, user_role: UserRole) -> bool:
        """Check if admin can pin more products"""
        limit = self.get_pin_limit(user_role)
        return self.pins_used < limit
    
    def remaining_pins(self, user_role: UserRole) -> int:
        """Get remaining pin quota"""
        limit = self.get_pin_limit(user_role)
        return max(0, limit - self.pins_used)


# ✅ NEW: Role Change Audit Trail
class RoleChangeAudit(Base):
    """Audit trail for all role changes"""
    __tablename__ = "role_change_audit"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    changed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    old_role = Column(Enum(UserRole), nullable=False)
    new_role = Column(Enum(UserRole), nullable=False)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    target_user = relationship("User", back_populates="role_changes_received", foreign_keys=[target_user_id])
    changed_by_admin = relationship("User", back_populates="role_changes_performed", foreign_keys=[changed_by_id])




# backend/app/models/user.py




# from sqlalchemy import Column, String, Boolean, Enum, DateTime
# from sqlalchemy.dialects.postgresql import UUID
# from sqlalchemy.sql import func
# import uuid
# import enum

# from app.db.session import Base

# class UserRole(str, enum.Enum):
#     USER = "user"
#     ADMIN = "admin"
#     SUPER_ADMIN = "super_admin"

# class User(Base):
#     __tablename__ = "users"
    
#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     email = Column(String(255), unique=True, nullable=False, index=True)
#     password_hash = Column(String(255), nullable=False)
#     role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
#     is_email_verified = Column(Boolean, default=False)
#     is_active = Column(Boolean, default=True)
#     is_protected = Column(Boolean, default=False)  #  NEW --- Added not to remove protected admin
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     updated_at = Column(DateTime(timezone=True), onupdate=func.now())
#     last_login = Column(DateTime(timezone=True))
