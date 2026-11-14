from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ResourceItem(BaseModel):
    id: int
    title: str
    url: str
    provider: str
    resource_type: str
    difficulty: str
    duration_minutes: int
    suitability_reason: Optional[str] = None
    explanation_learner_match: Optional[str] = None
    expected_outcome: Optional[str] = None
    is_free: bool = True

class RoadmapItemResponse(BaseModel):
    id: int
    week_number: int
    sequence_order: int
    title: str
    skill_id: Optional[int] = None
    skill_name: Optional[str] = None
    learning_objectives: List[str]
    duration_hours: float
    practical_exercise: Optional[str] = None
    practical_rubric: Optional[str] = None
    practical_submission: Optional[str] = None
    practical_score: Optional[float] = None
    practical_feedback: Optional[str] = None
    completion_criteria: Optional[str] = None
    status: str # not_started, in_progress, submitted_for_evaluation, completed, needs_improvement
    is_remedial: bool
    explanation_gap: Optional[str] = None
    explanation_prereq: Optional[str] = None
    explanation_outcome: Optional[str] = None
    explanation_career: Optional[str] = None
    completed_at: Optional[datetime] = None
    resources: List[ResourceItem] = []

    class Config:
        from_attributes = True

class RoadmapResponse(BaseModel):
    id: int
    user_id: int
    role_id: int
    role_title: str
    version: int
    title: str
    status: str
    trigger_event: Optional[str] = "initial_generation"
    reason_for_adaptation: Optional[str] = None
    total_weeks: int
    created_at: datetime
    items: List[RoadmapItemResponse] = []

    class Config:
        from_attributes = True

class RoadmapVersionSummary(BaseModel):
    id: int
    version: int
    title: str
    status: str
    trigger_event: Optional[str] = None
    reason_for_adaptation: Optional[str] = None
    created_at: datetime
    total_items: int
    completed_items: int

class PracticalSubmissionRequest(BaseModel):
    submission_text: str

class PracticalEvaluationResponse(BaseModel):
    status: str
    passed: bool
    score_percentage: float
    rubric_scores: Dict[str, float]
    feedback: str
    recommendation: str
    validation_status: str
    new_proficiency: float
    confidence_score: float

class ModuleDiffRow(BaseModel):
    module_title: str
    skill_name: Optional[str] = None
    version_1_status: str # e.g. "Week 1 (Current)", "Upcoming", "Not Present"
    version_2_status: str # e.g. "Completed", "Delayed to Week 3", "Added (Refresher)"
    change_type: str # added, delayed, reused, completed, removed

class RoadmapComparisonResponse(BaseModel):
    v1: RoadmapResponse
    v2: RoadmapResponse
    adaptation_reason: str
    trigger_event: str
    added_modules: List[str]
    delayed_modules: List[str]
    modified_resources_count: int
    comparison_table: List[ModuleDiffRow]
