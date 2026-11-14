from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, Float, DateTime
from sqlalchemy.orm import relationship
from backend.database import Base

class Roadmap(Base):
    __tablename__ = "roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False, index=True)
    version = Column(Integer, default=1, nullable=False) # e.g. 1 for v1, 2 for v2
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="active") # active, superseded, completed
    trigger_event = Column(String(100), default="initial_generation") # initial_generation, low_assessment_score, excellent_streak, career_goal_change, inactivity_rebalance
    reason_for_adaptation = Column(Text, nullable=True)
    version_diff_json = Column(Text, nullable=True) # JSON containing added, delayed, reused, completed, removed items
    total_weeks = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="roadmaps")
    role = relationship("Role", back_populates="roadmaps")
    items = relationship("RoadmapItem", back_populates="roadmap", cascade="all, delete-orphan", order_by="RoadmapItem.week_number, RoadmapItem.sequence_order")

class RoadmapItem(Base):
    __tablename__ = "roadmap_items"

    id = Column(Integer, primary_key=True, index=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id"), nullable=False, index=True)
    week_number = Column(Integer, nullable=False)
    sequence_order = Column(Integer, default=1)
    title = Column(String(255), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=True)
    learning_objectives = Column(Text, nullable=False) # Stored as JSON string or markdown
    duration_hours = Column(Float, default=10.0)
    
    # Practical exercise and evaluation fields
    practical_exercise = Column(Text, nullable=True) # Exercise prompt & task details
    practical_rubric = Column(Text, nullable=True) # JSON rubric breakdown
    practical_submission = Column(Text, nullable=True) # Learner solution/code/reflection
    practical_score = Column(Float, nullable=True) # 0 to 100
    practical_feedback = Column(Text, nullable=True) # Detailed AI evaluator feedback
    
    completion_criteria = Column(Text, nullable=True)
    status = Column(String(50), default="not_started") # not_started, in_progress, submitted_for_evaluation, completed, needs_improvement, skipped
    is_remedial = Column(Boolean, default=False)
    
    # Explainable AI fields
    explanation_gap = Column(Text, nullable=True) # Skill gap addressed
    explanation_prereq = Column(Text, nullable=True) # Prerequisite justification
    explanation_outcome = Column(Text, nullable=True) # Expected measurable outcome
    explanation_career = Column(Text, nullable=True) # Contribution to target role
    
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    roadmap = relationship("Roadmap", back_populates="items")
    skill = relationship("Skill")
    resource_associations = relationship("RoadmapItemResource", back_populates="roadmap_item", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="roadmap_item")
