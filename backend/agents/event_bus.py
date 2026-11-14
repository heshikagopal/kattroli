import asyncio
import json
import time
from typing import Dict, List, Any, Optional
from datetime import datetime

class AgentEventBus:
    """
    Central event bus for visible multi-agent collaboration.
    Broadcasts real-time events to connected SSE clients and persists execution logs.
    """
    def __init__(self):
        # user_id -> list of asyncio.Queue
        self.subscribers: Dict[int, List[asyncio.Queue]] = {}
        # broadcast queues for global viewers
        self.global_subscribers: List[asyncio.Queue] = []
        # In-memory recent events buffer for instant replay
        self.recent_events: List[Dict[str, Any]] = []

    def subscribe(self, user_id: Optional[int] = None) -> asyncio.Queue:
        q = asyncio.Queue()
        if user_id is not None:
            if user_id not in self.subscribers:
                self.subscribers[user_id] = []
            self.subscribers[user_id].append(q)
        else:
            self.global_subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue, user_id: Optional[int] = None):
        if user_id is not None and user_id in self.subscribers:
            if q in self.subscribers[user_id]:
                self.subscribers[user_id].remove(q)
        if q in self.global_subscribers:
            self.global_subscribers.remove(q)

    def emit_sync(
        self,
        user_id: int,
        agent_name: str,
        status: str,
        task: str,
        input_summary: str,
        output_summary: str,
        execution_time_ms: float,
        next_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        event_payload = {
            "event_id": f"evt_{int(time.time() * 1000)}",
            "user_id": user_id,
            "agent_name": agent_name,
            "status": status,
            "task": task,
            "input_summary": input_summary,
            "output_summary": output_summary,
            "execution_time_ms": round(execution_time_ms, 2),
            "next_agent": next_agent,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Save to recent events buffer (keep last 100)
        self.recent_events.append(event_payload)
        if len(self.recent_events) > 100:
            self.recent_events.pop(0)

        # Dispatch to user-specific subscribers
        if user_id in self.subscribers:
            for q in list(self.subscribers[user_id]):
                try:
                    q.put_nowait(event_payload)
                except Exception:
                    pass

        # Dispatch to global subscribers
        for q in list(self.global_subscribers):
            try:
                q.put_nowait(event_payload)
            except Exception:
                pass

    async def emit(self, **kwargs):
        self.emit_sync(**kwargs)

agent_event_bus = AgentEventBus()
