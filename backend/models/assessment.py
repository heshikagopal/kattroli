from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, Float, DateTime
from sqlalchemy.orm import relationship
from backend.database import Base

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    roadmap_item_id = Column(Integer, ForeignKey("roadmap_items.id"), nullable=True)
    score_percentage = Column(Float, nullable=False)
    passed = Column(Boolean, default=False)
    feedback = Column(Text, nullable=True)
    weak_subtopics = Column(Text, nullable=True) # JSON list
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="assessments")
    skill = relationship("Skill")
    roadmap_item = relationship("RoadmapItem", back_populates="assessments")
    answers = relationship("AssessmentAnswer", back_populates="assessment", cascade="all, delete-orphan")

class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    difficulty_level = Column(Integer, default=1) # 1 to 5
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="mcq") # mcq, coding, conceptual
    code_snippet = Column(Text, nullable=True)
    options_json = Column(Text, nullable=False) # JSON list of string options
    correct_answer = Column(String(500), nullable=False)
    explanation = Column(Text, nullable=True)
    subtopic = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    skill = relationship("Skill", back_populates="questions")

class AssessmentAnswer(Base):
    __tablename__ = "assessment_answers"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("assessment_questions.id"), nullable=False, index=True)
    user_answer = Column(String(500), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    points_earned = Column(Float, default=0.0)

    # Relationships
    assessment = relationship("Assessment", back_populates="answers")
    question = relationship("AssessmentQuestion")
