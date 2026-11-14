from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from backend.database import Base

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    provider = Column(String(100), nullable=False) # MDN, freeCodeCamp, The Odin Project, Python Docs, etc.
    resource_type = Column(String(50), nullable=False) # Documentation, Tutorial, Video, Project
    difficulty = Column(String(50), default="Beginner") # Beginner, Intermediate, Advanced
    duration_minutes = Column(Integer, default=60)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=True)
    is_free = Column(Boolean, default=True) # Prioritize free resources
    last_verified_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    skill = relationship("Skill", back_populates="resources")
    roadmap_item_associations = relationship("RoadmapItemResource", back_populates="resource")

class RoadmapItemResource(Base):
    __tablename__ = "roadmap_item_resources"

    id = Column(Integer, primary_key=True, index=True)
    roadmap_item_id = Column(Integer, ForeignKey("roadmap_items.id"), nullable=False, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False, index=True)
    suitability_reason = Column(Text, nullable=True)
    explanation_learner_match = Column(Text, nullable=True) # Why matches learner's specific proficiency
    expected_outcome = Column(Text, nullable=True)

    # Relationships
    roadmap_item = relationship("RoadmapItem", back_populates="resource_associations")
    resource = relationship("Resource", back_populates="roadmap_item_associations")
