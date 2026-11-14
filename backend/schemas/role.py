from pydantic import BaseModel
from typing import Optional, List

class RoleSkillItem(BaseModel):
    skill_id: int
    skill_name: str
    category: str
    required_level: float
    weight: float
    is_core: bool
    dependency_depth: int

class RoleResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    icon: str
    skills: List[RoleSkillItem] = []

    class Config:
        from_attributes = True

class SkillGapItem(BaseModel):
    skill_id: int
    skill_name: str
    current_level: float
    required_level: float
    gap: float
    weight: float
    priority_score: float
    is_core: bool
    status: str # "Mastered", "Needs Improvement", "Missing Prerequisite"

class CareerMatchResponse(BaseModel):
    role_id: int
    role_title: str
    match_percentage: float
    required_skills_count: int
    matched_skills_count: int
    skill_gaps: List[SkillGapItem]
    adjacent_careers: List[dict]

class CareerSwitchRequest(BaseModel):
    target_role_id: int

class CareerSwitchResponse(BaseModel):
    new_role_id: int
    new_role_title: str
    carry_over_percentage: float
    overlapping_skills: List[dict]
    new_required_skills: List[dict]
    explanation: str
