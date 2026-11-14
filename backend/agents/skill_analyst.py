import time
from typing import Dict, Any, List
from backend.agents.state import SkillPilotState
from backend.agents.event_bus import agent_event_bus

SKILL_ANALYST_SYSTEM_PROMPT = """
You are the Skill Analyst Agent for KATTR0LI (கற்றொளி), the adaptive learning platform.
Responsibilities:
- Analyze the learner's skill vector.
- Identify strengths and weaknesses.
- Combine self-reported proficiency with diagnostic assessment results.
- Calculate confidence in each skill.
- Identify missing prerequisites.
"""

SKILL_METADATA = {
    1: {"name": "Python", "category": "Backend", "prerequisites": []},
    2: {"name": "JavaScript", "category": "Frontend", "prerequisites": ["HTML & CSS"]},
    3: {"name": "HTML & CSS", "category": "Frontend", "prerequisites": []},
    4: {"name": "React", "category": "Frontend", "prerequisites": ["JavaScript", "HTML & CSS"]},
    5: {"name": "Node.js", "category": "Backend", "prerequisites": ["JavaScript"]},
    6: {"name": "SQL", "category": "Database", "prerequisites": []},
    7: {"name": "Git", "category": "DevOps", "prerequisites": []},
    8: {"name": "REST APIs", "category": "Backend", "prerequisites": ["Python", "JavaScript"]},
    9: {"name": "Machine Learning", "category": "Data Science", "prerequisites": ["Python", "SQL"]},
    10: {"name": "Cloud Computing", "category": "Cloud", "prerequisites": ["Git", "REST APIs"]},
}

def run_skill_analyst_agent(state: SkillPilotState) -> Dict[str, Any]:
    start_time = time.time()
    user_id = state.get("user_id", 1)
    skill_vector = state.get("skill_vector", {})
    confidence_scores = state.get("confidence_scores", {})

    strengths: List[str] = []
    weaknesses: List[str] = []
    radar_data: List[Dict[str, Any]] = []
    missing_prerequisites: List[str] = []
    recommended_focus: List[str] = []

    standard_skill_ids = [1, 2, 3, 4, 5, 6, 7, 8]
    
    for s_id in standard_skill_ids:
        meta = SKILL_METADATA.get(s_id, {"name": f"Skill {s_id}", "category": "General", "prerequisites": []})
        name = meta["name"]
        cat = meta["category"]
        curr_lvl = float(skill_vector.get(s_id, 0.0))
        conf = float(confidence_scores.get(s_id, 0.5))
        
        bench_required = 3.5 if s_id in [1, 2, 4, 6] else 3.0
        
        radar_data.append({
            "skill": name,
            "proficiency": curr_lvl,
            "required": bench_required,
            "confidence": round(conf * 100, 1),
            "category": cat
        })
        
        if curr_lvl >= 3.0:
            strengths.append(f"{name} (Level {curr_lvl}/5.0)")
        elif curr_lvl < 2.0:
            weaknesses.append(f"{name} (Level {curr_lvl}/5.0)")
            recommended_focus.append(name)
            
        for prereq in meta["prerequisites"]:
            prereq_id = next((k for k, v in SKILL_METADATA.items() if v["name"] == prereq), None)
            if prereq_id and float(skill_vector.get(prereq_id, 0.0)) < 2.0:
                missing_str = f"{prereq} needed before advancing in {name}"
                if missing_str not in missing_prerequisites:
                    missing_prerequisites.append(missing_str)

    execution_time = (time.time() - start_time) * 1000.0

    input_summary = f"Evaluated vector of {len(skill_vector)} skills against core tech stack radar benchmarks"
    output_summary = f"Identified {len(strengths)} strengths ({', '.join(strengths[:2])}), {len(weaknesses)} gaps ({', '.join(weaknesses[:2])}); computed radar profile."

    agent_event_bus.emit_sync(
        user_id=user_id,
        agent_name="Skill Analyst Agent",
        status="completed",
        task="Analyze proficiency gaps, identify strengths/weaknesses & radar distribution",
        input_summary=input_summary,
        output_summary=output_summary,
        execution_time_ms=execution_time,
        next_agent="Career Matcher Agent",
        metadata={"radar_points": len(radar_data)}
    )

    trace = {
        "agent_name": "Skill Analyst Agent",
        "status": "completed",
        "task": "Deep Skill Vector Analysis & Prerequisite Dependency Auditing",
        "input_summary": input_summary,
        "output_summary": output_summary,
        "execution_time_ms": execution_time,
        "next_agent": "Career Matcher Agent",
        "metadata": {
            "strengths_count": len(strengths),
            "weaknesses_count": len(weaknesses),
            "missing_prerequisites": missing_prerequisites
        }
    }

    logs = list(state.get("agent_logs", []))
    logs.append(trace)

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "skill_radar_data": radar_data,
        "missing_prerequisites": missing_prerequisites,
        "recommended_focus": recommended_focus,
        "agent_logs": logs,
        "current_agent": "Career Matcher Agent"
    }
