from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class SkillBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None

class SkillResponse(SkillBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserSkillResponse(BaseModel):
    id: int
    skill_id: int
    skill_name: str
    category: str
    proficiency_level: float
    self_reported_level: float
    resume_level: Optional[float] = 0.0
    assessment_level: Optional[float] = 0.0
    practical_level: Optional[float] = 0.0
    confidence_score: float
    source: str
    evidence_sources: Optional[str] = "self_reported"
    validation_status: Optional[str] = "self_reported"
    discrepancy_note: Optional[str] = None
    last_evaluated_at: datetime

    class Config:
        from_attributes = True

class SkillRadarItem(BaseModel):
    skill: str
    proficiency: float
    required: float
    confidence: float
    category: str

class SkillAnalysisResponse(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    recommended_focus: List[str]
    radar_data: List[SkillRadarItem]
    missing_prerequisites: List[str]
    evidence_breakdown: Optional[List[Dict[str, Any]]] = None

class PrerequisiteNode(BaseModel):
    id: str
    skill_id: int
    label: str
    category: str
    status: str # completed, validated, in_progress, locked, recommended
    proficiency: float
    required_level: float
    confidence: float

class PrerequisiteEdge(BaseModel):
    id: str
    source: str
    target: str
    is_strict: bool

class PrerequisiteGraphResponse(BaseModel):
    nodes: List[PrerequisiteNode]
    edges: List[PrerequisiteEdge]
