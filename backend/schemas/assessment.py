from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class QuestionOption(BaseModel):
    id: str
    text: str

class QuestionDisplay(BaseModel):
    id: int
    skill_id: int
    skill_name: str
    difficulty_level: int
    question_text: str
    question_type: str
    code_snippet: Optional[str] = None
    options: List[str]
    subtopic: str

class QuizSubmissionItem(BaseModel):
    question_id: int
    user_answer: str

class QuizSubmissionRequest(BaseModel):
    skill_id: int
    roadmap_item_id: Optional[int] = None
    answers: List[QuizSubmissionItem]

class QuestionResultItem(BaseModel):
    question_id: int
    question_text: str
    user_answer: str
    correct_answer: str
    is_correct: bool
    explanation: Optional[str] = None
    subtopic: str

class QuizResultResponse(BaseModel):
    assessment_id: int
    skill_id: int
    skill_name: str
    score_percentage: float
    passed: bool
    old_proficiency: float
    new_proficiency: float
    feedback: str
    weak_subtopics: List[str]
    question_results: List[QuestionResultItem]
    adaptation_triggered: bool
    adaptation_reason: Optional[str] = None
    roadmap_version: int

class AssessmentHistoryItem(BaseModel):
    id: int
    skill_name: str
    score_percentage: float
    passed: bool
    created_at: datetime
    weak_subtopics: List[str]

    class Config:
        from_attributes = True
