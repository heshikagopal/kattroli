from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Boolean
from sqlalchemy.orm import relationship
from backend.database import Base

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    category = Column(String(100), nullable=False) # Frontend, Backend, Data, Cloud, Fundamentals, etc.
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user_skills = relationship("UserSkill", back_populates="skill")
    role_skills = relationship("RoleSkill", back_populates="skill")
    resources = relationship("Resource", back_populates="skill")
    questions = relationship("AssessmentQuestion", back_populates="skill")
    prerequisites = relationship("SkillPrerequisite", foreign_keys="SkillPrerequisite.skill_id", back_populates="skill")
    dependents = relationship("SkillPrerequisite", foreign_keys="SkillPrerequisite.prerequisite_id", back_populates="prerequisite")

class SkillPrerequisite(Base):
    __tablename__ = "skill_prerequisites"

    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    prerequisite_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    required_proficiency = Column(Float, default=2.0) # Proficiency needed before unlocking
    is_strict = Column(Boolean, default=True) # If True, blocks advanced module recommendation

    # Relationships
    skill = relationship("Skill", foreign_keys=[skill_id], back_populates="prerequisites")
    prerequisite = relationship("Skill", foreign_keys=[prerequisite_id], back_populates="dependents")

class UserSkill(Base):
    __tablename__ = "user_skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    proficiency_level = Column(Float, default=0.0) # Synthesized 0.0 to 5.0
    self_reported_level = Column(Float, default=0.0) # 0.0 to 5.0
    resume_level = Column(Float, default=0.0) # 0.0 to 5.0 from resume analysis
    assessment_level = Column(Float, default=0.0) # 0.0 to 5.0 from diagnostic assessments
    practical_level = Column(Float, default=0.0) # 0.0 to 5.0 from practical exercises
    confidence_score = Column(Float, default=0.5) # 0.0 to 1.0
    source = Column(String(50), default="onboarding") # onboarding, assessment, resume, practical
    evidence_sources = Column(String(255), default="self_reported") # comma-separated list of active evidence
    validation_status = Column(String(50), default="self_reported") # self_reported, assessment_validated, practically_validated, fully_validated, needs_calibration
    discrepancy_note = Column(Text, nullable=True) # e.g. "Overestimation detected: self 4.0 vs assessment 2.0"
    last_evaluated_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="user_skills")
    skill = relationship("Skill", back_populates="user_skills")
