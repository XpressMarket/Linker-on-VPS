# backend/app/models/admin_log.py
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, INET, JSONB
from sqlalchemy.sql import func
import uuid

from app.db.session import Base

class AdminLog(Base):
    __tablename__ = "admin_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    target_type = Column(String(50))
    target_id = Column(UUID(as_uuid=True))
    meta_data = Column(JSONB)  # ✅ renamed from 'metadata'
    ip_address = Column(INET)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
