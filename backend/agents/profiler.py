import time
from typing import Dict, Any
from backend.agents.state import SkillPilotState
from backend.agents.event_bus import agent_event_bus

PROFILER_SYSTEM_PROMPT = """
You are the Profiler Agent for KATTR0LI (கற்றொளி), the adaptive learning platform (The Light of Learning).
Responsibilities:
- Analyze learner onboarding information.
- Parse uploaded resumes when provided.
- Extract skills from projects, education, certifications, and experience.
- Normalize skills into the common skill taxonomy.
- Assign proficiency levels from 0 to 5.
- Calculate confidence scores (0.0 to 1.0).
- Identify skills requiring validation.
"""

def run_profiler_agent(state: SkillPilotState) -> Dict[str, Any]:
    start_time = time.time()
    user_name = state.get("user_name", "Learner")
    raw_skills = state.get("raw_skills", [])
    resume_text = state.get("resume_text", "")
    education = state.get("education", "Student")
    user_id = state.get("user_id", 1)

    skill_vector: Dict[int, float] = {}
    confidence_scores: Dict[int, float] = {}
    skills_needing_validation = []

    # Process raw skills from onboarding
    for s in raw_skills:
        skill_id = s.get("skill_id") or s.get("id")
        if skill_id is not None:
            skill_id = int(skill_id)
            prof = float(s.get("proficiency", s.get("level", 1.0)))
            skill_vector[skill_id] = round(min(5.0, max(0.0, prof)), 1)
            
            # Confidence calculation
            conf = 0.85 if prof >= 3.0 else 0.70
            confidence_scores[skill_id] = conf
            
            if prof >= 3.0:
                skills_needing_validation.append(s.get("name", f"Skill #{skill_id}"))

    # Resume parsing fallback / extraction
    resume_extracted_count = 0
    if resume_text:
        text_lower = resume_text.lower()
        keyword_map = {
            "python": (1, 3.0),
            "javascript": (2, 2.0),
            "react": (3, 2.0),
            "sql": (4, 3.0),
            "node": (5, 2.0),
            "git": (6, 2.5),
            "machine learning": (8, 2.0)
        }
        for kw, (s_id, boost_lvl) in keyword_map.items():
            if kw in text_lower and s_id not in skill_vector:
                skill_vector[s_id] = boost_lvl
                confidence_scores[s_id] = 0.65
                resume_extracted_count += 1

    execution_time = (time.time() - start_time) * 1000.0

    input_summary = f"Onboarding profile for {user_name} ({education}), {len(raw_skills)} reported skills" + (f", parsed resume ({len(resume_text)} chars)" if resume_text else "")
    output_summary = f"Synthesized profile vector with {len(skill_vector)} normalized skills; flagged {len(skills_needing_validation)} skills for diagnostic validation."

    agent_event_bus.emit_sync(
        user_id=user_id,
        agent_name="Profiler Agent",
        status="completed",
        task="Normalize learner profile & construct initial skill vector",
        input_summary=input_summary,
        output_summary=output_summary,
        execution_time_ms=execution_time,
        next_agent="Skill Analyst Agent",
        metadata={"skills_count": len(skill_vector)}
    )

    trace = {
        "agent_name": "Profiler Agent",
        "status": "completed",
        "task": "Learner Profile Analysis & Skill Taxonomy Normalization",
        "input_summary": input_summary,
        "output_summary": output_summary,
        "execution_time_ms": execution_time,
        "next_agent": "Skill Analyst Agent",
        "metadata": {
            "skills_vector_size": len(skill_vector),
            "validated_skills": skills_needing_validation
        }
    }

    logs = list(state.get("agent_logs", []))
    logs.append(trace)

    return {
        "skill_vector": skill_vector,
        "confidence_scores": confidence_scores,
        "skills_needing_validation": skills_needing_validation,
        "normalized_profile": {
            "user_name": user_name,
            "education": education,
            "skills_count": len(skill_vector),
            "resume_extracted": resume_extracted_count
        },
        "agent_logs": logs,
        "current_agent": "Skill Analyst Agent"
    }
