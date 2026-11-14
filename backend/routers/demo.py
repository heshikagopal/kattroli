from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, Roadmap, RoadmapItem, UserSkill, Assessment, Notification, ProgressRecord, AgentLog
from backend.data.seed import seed_database
from backend.routers.assessments import submit_quiz
from backend.routers.careers import switch_career_goal
from backend.schemas.assessment import QuizSubmissionRequest, QuizSubmissionItem
from backend.schemas.role import CareerSwitchRequest
from backend.core.algorithms import calculate_evidence_based_proficiency
from backend.agents.event_bus import agent_event_bus

router = APIRouter(prefix="/api/demo", tags=["Demo Management"])

@router.post("/reset")
def reset_demo_state(db: Session = Depends(get_db)):
    """Resets Alex's account back to initial clean state with Roadmap v1."""
    alex = db.query(User).filter(User.email == "alex@skillpilot.ai").first()
    if alex:
        db.delete(alex)
        db.commit()
    
    seed_database()
    return {"status": "success", "message": "Demo scenario reset to initial baseline state (Roadmap v1 active)."}

@router.post("/run-scenario-a")
def run_scenario_a_low_score(db: Session = Depends(get_db)):
    """
    Scenario A: Poor Assessment Performance (< 60%)
    Alex scores 40% on JavaScript.
    Generates Roadmap v2 with Remedial Refresher, splits difficult topics, delays React by 1 week.
    """
    alex = db.query(User).filter(User.email == "alex@skillpilot.ai").first()
    if not alex:
        seed_database()
        alex = db.query(User).filter(User.email == "alex@skillpilot.ai").first()

    quiz_submission = QuizSubmissionRequest(
        skill_id=2, # JavaScript
        answers=[
            QuizSubmissionItem(question_id=201, user_answer="A, B, C, D"),
            QuizSubmissionItem(question_id=202, user_answer="By copying the outer variables into global window memory"),
            QuizSubmissionItem(question_id=203, user_answer="Wrapping the await expression inside a try...catch block"),
            QuizSubmissionItem(question_id=204, user_answer="It prevents accidental global variable creation and eliminates silent errors"),
            QuizSubmissionItem(question_id=205, user_answer="'==' is faster than '==='")
        ]
    )

    result = submit_quiz(payload=quiz_submission, current_user=alex, db=db)
    return {
        "scenario": "Scenario A: Low Score Adaptation (<60%)",
        "result": result
    }

@router.post("/run-scenario-b")
def run_scenario_b_high_score_streak(db: Session = Depends(get_db)):
    """
    Scenario B: Excellent Assessment Performance (> 90% twice)
    Fast-tracks learner, compresses roadmap, marks foundational modules as mastered.
    """
    alex = db.query(User).filter(User.email == "alex@skillpilot.ai").first()
    if not alex:
        seed_database()
        alex = db.query(User).filter(User.email == "alex@skillpilot.ai").first()

    # Perfect Python submission (100%)
    python_sub = QuizSubmissionRequest(
        skill_id=1, # Python
        answers=[
            QuizSubmissionItem(question_id=101, user_answer="List is mutable; tuple is immutable"),
            QuizSubmissionItem(question_id=102, user_answer="KeyError"),
            QuizSubmissionItem(question_id=103, user_answer="It pauses execution and yields a value, returning a generator"),
            QuizSubmissionItem(question_id=104, user_answer="O(1)"),
            QuizSubmissionItem(question_id=105, user_answer="A callable that takes a function and extends its behavior")
        ]
    )
    result = submit_quiz(payload=python_sub, current_user=alex, db=db)

    # Add notification about fast-track
    notif = Notification(
        user_id=alex.id,
        title="🌟 Fast-Track Mastery Detected!",
        message="Consecutive >90% scores achieved in Python. Prerequisites verified! Compressed upcoming modules by 2 weeks.",
        notification_type="milestone",
        link_url="/roadmap",
        is_read=False
    )
    db.add(notif)
    db.commit()

    agent_event_bus.emit_sync(
        user_id=alex.id,
        agent_name="Path Planner Agent",
        status="completed",
        task="Fast-Track & Compress Learning Roadmap for Python Mastery",
        input_summary="Verified consecutive 100% mastery checks on Python core concepts",
        output_summary="Compressed curriculum schedule by 2 weeks; fast-tracked to advanced modules.",
        execution_time_ms=45.0,
        next_agent="Mentor Agent",
        metadata={"fast_tracked_weeks": 2}
    )

    return {
        "scenario": "Scenario B: Consecutive High Scores (>90%)",
        "message": "Curriculum compressed; Python mastery validated!",
        "quiz_result": result
    }

@router.post("/run-scenario-c")
def run_scenario_c_repeated_difficulty(db: Session = Depends(get_db)):
    """
    Scenario C: Repeated Difficulty on a Topic
    Detects repeated struggle with asynchronous JavaScript; decomposes into bite-sized micro-modules.
    """
    alex = db.query(User).filter(User.email == "alex@skillpilot.ai").first()
    if not alex:
        seed_database()
        alex = db.query(User).filter(User.email == "alex@skillpilot.ai").first()

    # Emit agent alert
    agent_event_bus.emit_sync(
        user_id=alex.id,
        agent_name="Progress Evaluator Agent",
        status="adapted",
        task="Detect repeated struggle pattern on asynchronous concepts",
        input_summary="Detected 2 consecutive scores < 50% on Asynchronous Promises & Callbacks",
        output_summary="Decomposed JavaScript Async topic into 3 micro-modules; scheduled visual flowchart guides.",
        execution_time_ms=52.0,
        next_agent="Mentor Agent",
        metadata={"repeated_difficulty": True, "micro_modules_added": 3}
    )

    notif = Notification(
        user_id=alex.id,
        title="💡 Personalized Learning Support",
        message="We noticed repeated difficulty with Asynchronous JavaScript. We've decomposed this into 3 interactive micro-modules!",
        notification_type="mentor_alert",
        link_url="/roadmap",
        is_read=False
    )
    db.add(notif)
    db.commit()

    return {
        "scenario": "Scenario C: Repeated Difficulty",
        "message": "Pattern detected: topic decomposed into micro-modules with alternative visual resources and mentor alert."
    }

@router.post("/run-scenario-d")
def run_scenario_d_career_switch(db: Session = Depends(get_db)):
    """
    Scenario D: Career Goal Switching
    Alex switches to Data Scientist (Role ID 2).
    Calculates carryover %, reuses Python and SQL modules.
    """
    alex = db.query(User).filter(User.email == "alex@skillpilot.ai").first()
    if not alex:
        seed_database()
        alex = db.query(User).filter(User.email == "alex@skillpilot.ai").first()

    switch_req = CareerSwitchRequest(target_role_id=2)
    result = switch_career_goal(payload=switch_req, current_user=alex, db=db)
    return {
        "scenario": "Scenario D: Career Goal Change",
        "result": result
    }

@router.post("/run-scenario-e")
def run_scenario_e_inactivity(db: Session = Depends(get_db)):
    """
    Scenario E: 7-Day Inactivity Simulation
    Simulates learner inactive for 7 days; generates empathetic mentor notification and manageable 5-hr study schedule.
    """
    alex = db.query(User).filter(User.email == "alex@skillpilot.ai").first()
    if not alex:
        seed_database()
        alex = db.query(User).filter(User.email == "alex@skillpilot.ai").first()

    # Set last_active_at to 8 days ago
    alex.last_active_at = datetime.utcnow() - timedelta(days=8)

    notif = Notification(
        user_id=alex.id,
        title="👋 We miss you, Alex! Let's get back on track",
        message="It's been 7 days since your last learning session. We've balanced your roadmap with a gentle 5-hour weekly study schedule to keep your momentum going!",
        notification_type="inactivity_reminder",
        link_url="/roadmap",
        is_read=False
    )
    db.add(notif)
    db.commit()

    agent_event_bus.emit_sync(
        user_id=alex.id,
        agent_name="Mentor Agent",
        status="completed",
        task="Detect 7-day inactivity and generate re-engagement study schedule",
        input_summary="Learner inactive for 8.0 days; weekly target is 10 hours",
        output_summary="Generated low-friction 5-hour/week catch-up schedule; rebalanced upcoming milestones.",
        execution_time_ms=38.0,
        next_agent="Learner UI",
        metadata={"days_inactive": 8, "adjusted_weekly_hours": 5.0}
    )

    return {
        "scenario": "Scenario E: 7-Day Inactivity Rebalancing",
        "message": "Inactivity detected: schedule rebalanced, friendly reminder and manageable study goals dispatched."
    }

@router.post("/run-scenario-validation")
def run_scenario_validation_discrepancy(db: Session = Depends(get_db)):
    """
    Feature 2: Evidence-Based Skill Validation Engine Demo
    Sets self-rating to 4.0/5.0 while assessment demonstrates 2.0/5.0.
    Triggers overestimation calibration alert!
    """
    alex = db.query(User).filter(User.email == "alex@skillpilot.ai").first()
    if not alex:
        seed_database()
        alex = db.query(User).filter(User.email == "alex@skillpilot.ai").first()

    js_skill = db.query(UserSkill).filter(UserSkill.user_id == alex.id, UserSkill.skill_id == 2).first()
    if js_skill:
        js_skill.self_reported_level = 4.0
        js_skill.assessment_level = 2.0
        js_skill.practical_level = 2.5
        
        synth = calculate_evidence_based_proficiency(
            self_reported_level=4.0,
            resume_level=1.0,
            assessment_level=2.0,
            practical_level=2.5
        )
        js_skill.proficiency_level = synth["synthesized_proficiency"]
        js_skill.confidence_score = synth["confidence_score"]
        js_skill.validation_status = synth["validation_status"]
        js_skill.evidence_sources = ",".join(synth["evidence_sources"])
        js_skill.discrepancy_note = synth["discrepancy_note"]
        db.commit()

    return {
        "scenario": "Evidence-Based Skill Validation",
        "message": "Simulated skill calibration: Self-rating 4.0 vs Assessment 2.0. Status flagged as 'needs_calibration' with discrepancy explanation."
    }

@router.get("/status")
def get_demo_status(db: Session = Depends(get_db)):
    alex = db.query(User).filter(User.email == "alex@skillpilot.ai").first()
    if not alex:
        return {"initialized": False}

    active_roadmap = db.query(Roadmap).filter(
        Roadmap.user_id == alex.id,
        Roadmap.status == "active"
    ).order_by(Roadmap.version.desc()).first()

    assessments_count = db.query(Assessment).filter(Assessment.user_id == alex.id).count()

    return {
        "initialized": True,
        "user_name": alex.full_name,
        "email": alex.email,
        "role": alex.role,
        "role_id": alex.current_role_id,
        "role_title": alex.target_role.title if alex.target_role else "Full Stack Developer",
        "current_roadmap_version": active_roadmap.version if active_roadmap else 1,
        "assessments_count": assessments_count
    }
