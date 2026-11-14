from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from backend.database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False) # Engineering, Data, Cloud, Security
    icon = Column(String(50), default="Briefcase")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    role_skills = relationship("RoleSkill", back_populates="role", cascade="all, delete-orphan")
    roadmaps = relationship("Roadmap", back_populates="role")

class RoleSkill(Base):
    __tablename__ = "role_skills"

    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    required_level = Column(Float, nullable=False, default=3.0) # 1.0 to 5.0
    weight = Column(Float, nullable=False, default=1.0) # 1.0 to 5.0 importance
    is_core = Column(Boolean, default=True)
    dependency_depth = Column(Integer, default=1) # 1 (foundation) to 3 (specialized)

    # Relationships
    role = relationship("Role", back_populates="role_skills")
    skill = relationship("Skill", back_populates="role_skills")
