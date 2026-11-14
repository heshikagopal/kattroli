import asyncio
import json
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database import get_db
from backend.models import AgentLog, User
from backend.schemas.agent import AgentLogResponse
from backend.routers.auth import get_current_user
from backend.agents.event_bus import agent_event_bus

router = APIRouter(prefix="/api/agents", tags=["Agent Activity"])

@router.get("/logs", response_model=List[AgentLogResponse])
def get_agent_logs(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = db.query(AgentLog).filter(
        AgentLog.user_id == current_user.id
    ).order_by(AgentLog.created_at.desc()).limit(limit).all()
    return logs

@router.get("/stream")
async def stream_agent_activity(request: Request, user_id: Optional[int] = None):
    """
    SSE (Server-Sent Events) live streaming endpoint.
    Transmits real-time agent execution events to the Agent Activity Center.
    """
    queue = agent_event_bus.subscribe(user_id=user_id)

    async def event_generator():
        # First send any buffered recent events
        try:
            for past_evt in list(agent_event_bus.recent_events[-15:]):
                if user_id is None or past_evt.get("user_id") == user_id:
                    yield f"data: {json.dumps(past_evt)}\n\n"
        except Exception:
            pass

        # Then stream live incoming events
        try:
            while True:
                # Check for client disconnect
                if await request.is_disconnected():
                    break
                try:
                    event_data = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {json.dumps(event_data)}\n\n"
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat ping
                    yield ": ping\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            agent_event_bus.unsubscribe(queue, user_id=user_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
