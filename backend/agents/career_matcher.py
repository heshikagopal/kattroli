import time
from typing import Dict, Any, List
from backend.agents.state import SkillPilotState
from backend.agents.event_bus import agent_event_bus
from backend.core.algorithms import calculate_career_match_score, calculate_skill_gap_priority

CAREER_MATCHER_SYSTEM_PROMPT = """
You are the Career Matcher Agent for KATTR0LI (கற்றொளி), the adaptive learning platform.
Responsibilities:
- Compare learner skills against career-role requirements.
- Calculate career compatibility percentages.
- Identify missing skills.
- Rank skill gaps based on importance and dependencies.
- Recommend adjacent career opportunities.
"""

PREDEFINED_ROLES = {
    1: {
        "title": "Full Stack Developer",
        "category": "Engineering",
        "skills": [
            {"skill_id": 2, "skill_name": "JavaScript", "required_level": 4.0, "weight": 5.0, "dependency_depth": 1, "is_core": True},
            {"skill_id": 4, "skill_name": "React", "required_level": 3.5, "weight": 4.0, "dependency_depth": 2, "is_core": True},
            {"skill_id": 5, "skill_name": "Node.js", "required_level": 3.5, "weight": 4.0, "dependency_depth": 2, "is_core": True},
            {"skill_id": 3, "skill_name": "HTML & CSS", "required_level": 3.0, "weight": 3.0, "dependency_depth": 1, "is_core": True},
            {"skill_id": 6, "skill_name": "SQL", "required_level": 3.0, "weight": 3.0, "dependency_depth": 1, "is_core": True},
            {"skill_id": 7, "skill_name": "Git", "required_level": 3.0, "weight": 2.5, "dependency_depth": 1, "is_core": True},
            {"skill_id": 8, "skill_name": "REST APIs", "required_level": 3.5, "weight": 3.5, "dependency_depth": 2, "is_core": True},
        ]
    },
    2: {
        "title": "Data Scientist",
        "category": "Data",
        "skills": [
            {"skill_id": 1, "skill_name": "Python", "required_level": 4.0, "weight": 5.0, "dependency_depth": 1, "is_core": True},
            {"skill_id": 6, "skill_name": "SQL", "required_level": 3.5, "weight": 4.0, "dependency_depth": 1, "is_core": True},
            {"skill_id": 9, "skill_name": "Machine Learning", "required_level": 4.0, "weight": 5.0, "dependency_depth": 3, "is_core": True},
            {"skill_id": 7, "skill_name": "Git", "required_level": 2.5, "weight": 2.0, "dependency_depth": 1, "is_core": False},
        ]
    },
    3: {
        "title": "AI/ML Engineer",
        "category": "Data",
        "skills": [
            {"skill_id": 1, "skill_name": "Python", "required_level": 4.5, "weight": 5.0, "dependency_depth": 1, "is_core": True},
            {"skill_id": 9, "skill_name": "Machine Learning", "required_level": 4.5, "weight": 5.0, "dependency_depth": 3, "is_core": True},
            {"skill_id": 8, "skill_name": "REST APIs", "required_level": 3.5, "weight": 3.5, "dependency_depth": 2, "is_core": True},
            {"skill_id": 10, "skill_name": "Cloud Computing", "required_level": 3.0, "weight": 3.0, "dependency_depth": 2, "is_core": False},
        ]
    },
    4: {
        "title": "Frontend Developer",
        "category": "Engineering",
        "skills": [
            {"skill_id": 2, "skill_name": "JavaScript", "required_level": 4.5, "weight": 5.0, "dependency_depth": 1, "is_core": True},
            {"skill_id": 4, "skill_name": "React", "required_level": 4.0, "weight": 5.0, "dependency_depth": 2, "is_core": True},
            {"skill_id": 3, "skill_name": "HTML & CSS", "required_level": 4.0, "weight": 4.0, "dependency_depth": 1, "is_core": True},
            {"skill_id": 7, "skill_name": "Git", "required_level": 3.0, "weight": 2.5, "dependency_depth": 1, "is_core": True},
        ]
    },
    5: {
        "title": "Backend Developer",
        "category": "Engineering",
        "skills": [
            {"skill_id": 1, "skill_name": "Python", "required_level": 4.0, "weight": 4.5, "dependency_depth": 1, "is_core": True},
            {"skill_id": 5, "skill_name": "Node.js", "required_level": 4.0, "weight": 4.5, "dependency_depth": 2, "is_core": True},
            {"skill_id": 6, "skill_name": "SQL", "required_level": 4.0, "weight": 4.0, "dependency_depth": 1, "is_core": True},
            {"skill_id": 8, "skill_name": "REST APIs", "required_level": 4.0, "weight": 4.5, "dependency_depth": 2, "is_core": True},
            {"skill_id": 7, "skill_name": "Git", "required_level": 3.0, "weight": 2.5, "dependency_depth": 1, "is_core": True},
        ]
    },
    6: {
        "title": "Cybersecurity Analyst",
        "category": "Security",
        "skills": [
            {"skill_id": 1, "skill_name": "Python", "required_level": 3.5, "weight": 4.0, "dependency_depth": 1, "is_core": True},
            {"skill_id": 8, "skill_name": "REST APIs", "required_level": 3.0, "weight": 3.5, "dependency_depth": 2, "is_core": True},
            {"skill_id": 10, "skill_name": "Cloud Computing", "required_level": 3.5, "weight": 4.0, "dependency_depth": 2, "is_core": True},
            {"skill_id": 7, "skill_name": "Git", "required_level": 2.5, "weight": 2.0, "dependency_depth": 1, "is_core": False},
        ]
    },
    7: {
        "title": "Cloud Engineer",
        "category": "Cloud",
        "skills": [
            {"skill_id": 10, "skill_name": "Cloud Computing", "required_level": 4.5, "weight": 5.0, "dependency_depth": 2, "is_core": True},
            {"skill_id": 1, "skill_name": "Python", "required_level": 3.5, "weight": 3.5, "dependency_depth": 1, "is_core": True},
            {"skill_id": 7, "skill_name": "Git", "required_level": 3.5, "weight": 3.0, "dependency_depth": 1, "is_core": True},
            {"skill_id": 8, "skill_name": "REST APIs", "required_level": 3.5, "weight": 3.5, "dependency_depth": 2, "is_core": True},
        ]
    },
    8: {
        "title": "Data Analyst",
        "category": "Data",
        "skills": [
            {"skill_id": 6, "skill_name": "SQL", "required_level": 4.0, "weight": 5.0, "dependency_depth": 1, "is_core": True},
            {"skill_id": 1, "skill_name": "Python", "required_level": 3.5, "weight": 4.5, "dependency_depth": 1, "is_core": True},
            {"skill_id": 7, "skill_name": "Git", "required_level": 2.0, "weight": 1.5, "dependency_depth": 1, "is_core": False},
        ]
    }
}

def run_career_matcher_agent(state: SkillPilotState) -> Dict[str, Any]:
    start_time = time.time()
    user_id = state.get("user_id", 1)
    skill_vector = state.get("skill_vector", {})
    preferred_role_id = state.get("preferred_career_role_id", 1)

    role_info = PREDEFINED_ROLES.get(preferred_role_id, PREDEFINED_ROLES[1])
    role_title = role_info["title"]
    role_skills = role_info["skills"]

    match_pct = calculate_career_match_score(role_skills, skill_vector)

    ranked_gaps = []
    matched_count = 0
    
    for rs in role_skills:
        s_id = rs["skill_id"]
        req = rs["required_level"]
        weight = rs["weight"]
        curr = float(skill_vector.get(s_id, 0.0))
        depth = rs.get("dependency_depth", 1)
        
        priority = calculate_skill_gap_priority(req, curr, weight, depth)
        gap = max(0.0, req - curr)
        
        if curr >= req:
            status = "Mastered"
            matched_count += 1
        elif curr > 0.0:
            status = "Needs Improvement"
        else:
            status = "Missing Prerequisite"

        ranked_gaps.append({
            "skill_id": s_id,
            "skill_name": rs["skill_name"],
            "current_level": curr,
            "required_level": req,
            "gap": round(gap, 1),
            "weight": weight,
            "priority_score": priority,
            "is_core": rs["is_core"],
            "status": status
        })

    ranked_gaps.sort(key=lambda x: x["priority_score"], reverse=True)

    adjacent_careers = []
    for r_id, other_role in PREDEFINED_ROLES.items():
        if r_id != preferred_role_id:
            other_score = calculate_career_match_score(other_role["skills"], skill_vector)
            adjacent_careers.append({
                "role_id": r_id,
                "title": other_role["title"],
                "category": other_role["category"],
                "match_percentage": other_score
            })
    adjacent_careers.sort(key=lambda x: x["match_percentage"], reverse=True)

    execution_time = (time.time() - start_time) * 1000.0

    input_summary = f"Matching profile against target role '{role_title}' and 7 benchmark career roles"
    output_summary = f"Compatibility: {match_pct}%. Matched {matched_count}/{len(role_skills)} skills. Top priority gap: {ranked_gaps[0]['skill_name'] if ranked_gaps else 'None'}."

    agent_event_bus.emit_sync(
        user_id=user_id,
        agent_name="Career Matcher Agent",
        status="completed",
        task=f"Calculate role compatibility for '{role_title}' & prioritize skill gaps",
        input_summary=input_summary,
        output_summary=output_summary,
        execution_time_ms=execution_time,
        next_agent="Path Planner Agent",
        metadata={"match_percentage": match_pct, "top_gap": ranked_gaps[0]["skill_name"] if ranked_gaps else None}
    )

    trace = {
        "agent_name": "Career Matcher Agent",
        "status": "completed",
        "task": f"Role Compatibility Matrix & Gap Priority Ranking for {role_title}",
        "input_summary": input_summary,
        "output_summary": output_summary,
        "execution_time_ms": execution_time,
        "next_agent": "Path Planner Agent",
        "metadata": {
            "match_percentage": match_pct,
            "target_role": role_title,
            "ranked_gaps_count": len(ranked_gaps)
        }
    }

    logs = list(state.get("agent_logs", []))
    logs.append(trace)

    return {
        "preferred_career_role_title": role_title,
        "career_match_percentage": match_pct,
        "ranked_skill_gaps": ranked_gaps,
        "adjacent_careers": adjacent_careers[:4],
        "matched_skills_count": matched_count,
        "required_skills_count": len(role_skills),
        "agent_logs": logs,
        "current_agent": "Path Planner Agent"
    }
