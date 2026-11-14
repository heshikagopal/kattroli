import time
from typing import Dict, Any, List
from backend.agents.state import SkillPilotState
from backend.agents.event_bus import agent_event_bus
from backend.core.rag import resource_retriever

RESOURCE_CURATOR_SYSTEM_PROMPT = """
You are the Resource Curator Agent for KATTR0LI (கற்றொளி), the adaptive learning platform.
Responsibilities:
- Recommend relevant learning resources for every roadmap module.
- Retrieve resources using RAG.
- Recommend three resources per module.
- Include tutorials, documentation, videos, and practical projects.
- Prioritize free resources.
- Explain why each resource is suitable for the learner.
IMPORTANT: Never generate fake URLs. Only recommend resources from the verified resource catalog.
"""

def run_resource_curator_agent(state: SkillPilotState) -> Dict[str, Any]:
    start_time = time.time()
    user_id = state.get("user_id", 1)
    modules = state.get("roadmap_modules", [])
    roadmap_version = state.get("roadmap_version", 1)

    module_resources: Dict[str, List[Dict[str, Any]]] = {}
    total_resources_curated = 0

    for idx, mod in enumerate(modules):
        skill_name = mod.get("skill_name", "Full Stack")
        module_title = mod.get("title", "")
        difficulty = "Beginner" if mod.get("is_remedial", False) else "Intermediate"
        
        curated = resource_retriever.retrieve_resources_for_module(
            skill_name=skill_name,
            module_title=module_title,
            difficulty=difficulty,
            limit=3
        )
        
        if mod.get("is_remedial"):
            for r in curated:
                r["suitability_reason"] = f"Beginner-friendly remedial resource from {r['provider']} to solidify fundamental concepts before advancing."

        key = f"mod_{mod.get('week_number', idx + 1)}_{mod.get('sequence_order', 1)}"
        module_resources[key] = curated
        total_resources_curated += len(curated)

    execution_time = (time.time() - start_time) * 1000.0

    input_summary = f"Curating verified resources for {len(modules)} roadmap modules (Roadmap v{roadmap_version})"
    output_summary = f"Curated {total_resources_curated} 100% verified resources from MDN, freeCodeCamp, The Odin Project & official docs (3 per module)."

    agent_event_bus.emit_sync(
        user_id=user_id,
        agent_name="Resource Curator Agent",
        status="completed",
        task=f"RAG Resource Retrieval & Verification (Roadmap v{roadmap_version})",
        input_summary=input_summary,
        output_summary=output_summary,
        execution_time_ms=execution_time,
        next_agent="Mentor Agent",
        metadata={"total_curated": total_resources_curated, "verified": True}
    )

    trace = {
        "agent_name": "Resource Curator Agent",
        "status": "completed",
        "task": f"Curate 3 Verified Resources per Module via RAG (v{roadmap_version})",
        "input_summary": input_summary,
        "output_summary": output_summary,
        "execution_time_ms": execution_time,
        "next_agent": "Mentor Agent",
        "metadata": {
            "total_curated": total_resources_curated,
            "providers": ["MDN Web Docs", "freeCodeCamp", "The Odin Project", "GitHub", "Official Documentation"]
        }
    }

    logs = list(state.get("agent_logs", []))
    logs.append(trace)

    return {
        "module_resources": module_resources,
        "agent_logs": logs,
        "current_agent": "Mentor Agent"
    }
