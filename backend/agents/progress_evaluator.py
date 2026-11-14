import time
from typing import Dict, Any, List
from backend.agents.state import SkillPilotState
from backend.agents.event_bus import agent_event_bus
from backend.core.algorithms import calculate_skill_update_after_assessment

PROGRESS_EVALUATOR_SYSTEM_PROMPT = """
You are the Progress Evaluator Agent for KATTR0LI (கற்றொளி), the adaptive learning platform.
Responsibilities:
- Track learner progress.
- Evaluate assessment scores.
- Update skill proficiency using: new_level = 0.6 * old_level + 0.4 * quiz_level
- Identify learning difficulties.
- Detect when a learner needs additional practice.
- Trigger roadmap modifications when score < 60%.
- Communicate with Path Planner and Resource Curator.
"""

def evaluate_progress_and_adaptation(
    user_id: int,
    skill_id: int,
    skill_name: str,
    old_proficiency: float,
    score_percentage: float,
    weak_subtopics: List[str],
    consecutive_high_scores: int = 0
) -> Dict[str, Any]:
    start_time = time.time()

    # 1. Update skill proficiency according to algorithm
    new_proficiency = calculate_skill_update_after_assessment(old_proficiency, score_percentage)

    # 2. Evaluate adaptive learning rules:
    # Rule 1: Assessment below 60% -> trigger remedial learning module & replanning
    # Rule 2: Assessment above 90% twice consecutively -> fast-track
    adaptation_triggered = False
    adaptation_reason = None
    next_agent = "Mentor Agent"

    if score_percentage < 60.0:
        adaptation_triggered = True
        subtopics_str = ", ".join(weak_subtopics) if weak_subtopics else "fundamental syntax"
        adaptation_reason = (
            f"The learner scored {score_percentage}% in {skill_name}, exhibiting difficulties in {subtopics_str}. "
            f"Added JavaScript Fundamentals Refresher, added additional practice exercises, delayed React by 1 week, "
            f"and replaced advanced resources with beginner-friendly tutorials."
        )
        next_agent = "Path Planner Agent"
    elif score_percentage >= 90.0 and consecutive_high_scores >= 1:
        adaptation_triggered = True
        adaptation_reason = (
            f"Consecutive high scores (>90%) achieved in {skill_name}. Fast-tracking curriculum by compressing prerequisite modules."
        )
        next_agent = "Path Planner Agent"

    execution_time = (time.time() - start_time) * 1000.0

    input_summary = f"Assessing quiz score ({score_percentage}%) for {skill_name}; prior proficiency: {old_proficiency}/5.0"
    output_summary = f"Proficiency updated to {new_proficiency}/5.0. Adaptation: {'TRIGGERED' if adaptation_triggered else 'NOT NEEDED'}." + (f" Reason: {adaptation_reason}" if adaptation_reason else "")

    agent_event_bus.emit_sync(
        user_id=user_id,
        agent_name="Progress Evaluator Agent",
        status="adapted" if adaptation_triggered else "completed",
        task=f"Evaluate proficiency update & adaptive trigger for {skill_name}",
        input_summary=input_summary,
        output_summary=output_summary,
        execution_time_ms=execution_time,
        next_agent=next_agent,
        metadata={
            "old_proficiency": old_proficiency,
            "new_proficiency": new_proficiency,
            "adaptation_triggered": adaptation_triggered
        }
    )

    return {
        "old_proficiency": old_proficiency,
        "new_proficiency": new_proficiency,
        "adaptation_triggered": adaptation_triggered,
        "adaptation_reason": adaptation_reason,
        "next_agent": next_agent,
        "execution_time_ms": execution_time
    }
