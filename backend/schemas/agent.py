from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class AgentLogResponse(BaseModel):
    id: int
    agent_name: str
    status: str
    task: str
    input_summary: Optional[str] = None
    output_summary: Optional[str] = None
    execution_time_ms: float
    next_agent: Optional[str] = None
    metadata_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AgentActivityStreamEvent(BaseModel):
    event_id: str
    agent_name: str
    status: str # running, completed, adapted
    task: str
    input_summary: str
    output_summary: str
    execution_time_ms: float
    next_agent: Optional[str] = None
    timestamp: str

class MentorChatRequest(BaseModel):
    message: str
    current_module_id: Optional[int] = None

class MentorChatResponse(BaseModel):
    reply: str
    response: Optional[str] = None
    suggested_action: Optional[str] = None
    suggested_actions: Optional[List[str]] = []
    related_resources: List[dict] = []
    adaptation_context: Optional[str] = None
