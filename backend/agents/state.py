from typing import TypedDict, List, Dict, Any, Optional

class AgentExecutionTrace(TypedDict, total=False):
    agent_name: str
    status: str
    task: str
    input_summary: str
    output_summary: str
    execution_time_ms: float
    next_agent: Optional[str]
    metadata: Dict[str, Any]

class SkillPilotState(TypedDict, total=False):
    # Learner Context
    user_id: int
    user_name: str
    education: str
    academic_year: str
    weekly_hours: float
    target_date: str
    preferred_career_role_id: int
    preferred_career_role_title: str
    resume_text: Optional[str]
    raw_skills: List[Dict[str, Any]]
    
    # Agent 1 Outputs (Profiler)
    normalized_profile: Dict[str, Any]
    skill_vector: Dict[int, float] # skill_id -> proficiency level (0-5)
    confidence_scores: Dict[int, float] # skill_id -> confidence (0-1)
    skills_needing_validation: List[str]
    
    # Agent 2 Outputs (Skill Analyst)
    strengths: List[str]
    weaknesses: List[str]
    skill_radar_data: List[Dict[str, Any]]
    missing_prerequisites: List[str]
    recommended_focus: List[str]
    
    # Agent 3 Outputs (Career Matcher)
    career_match_percentage: float
    ranked_skill_gaps: List[Dict[str, Any]]
    adjacent_careers: List[Dict[str, Any]]
    matched_skills_count: int
    required_skills_count: int
    
    # Agent 4 Outputs (Path Planner)
    roadmap_modules: List[Dict[str, Any]]
    total_weeks: int
    milestones: List[Dict[str, Any]]
    roadmap_version: int
    
    # Agent 5 Outputs (Resource Curator)
    module_resources: Dict[str, List[Dict[str, Any]]] # module identifier -> 3 verified resources
    
    # Agent 6 Outputs (Assessment Agent)
    quiz_data: Optional[Dict[str, Any]]
    quiz_score_percentage: Optional[float]
    quiz_passed: Optional[bool]
    weak_subtopics: Optional[List[str]]
    
    # Agent 7 Outputs (Progress Evaluator)
    adaptation_triggered: bool
    adaptation_reason: Optional[str]
    updated_skill_vector: Optional[Dict[int, float]]
    progress_insights: Optional[Dict[str, Any]]
    
    # Mentor Agent Outputs
    mentor_guidance: str
    mentor_explanation: Optional[str]
    suggested_next_action: str
    
    # Operational & Execution Logs
    agent_logs: List[AgentExecutionTrace]
    current_agent: str
    execution_mode: str # "claude_llm" or "local_deterministic_engine"

# KATTR0LI Brand Type Alias
Kattr0liState = SkillPilotState
