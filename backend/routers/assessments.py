import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from backend.models import (
    Assessment, AssessmentAnswer, AssessmentQuestion, UserSkill, Skill, User,
    Roadmap, RoadmapItem, RoadmapItemResource, Resource, AgentLog, ProgressRecord
)
from backend.schemas.assessment import (
    QuestionDisplay, QuizSubmissionRequest, QuizResultResponse, AssessmentHistoryItem
)
from backend.routers.auth import get_current_user
from backend.agents.assessment_agent import evaluate_quiz_submission, get_questions_for_skill
from backend.agents.progress_evaluator import evaluate_progress_and_adaptation
from backend.agents.orchestrator import execute_adaptive_pipeline

router = APIRouter(prefix="/api/assessments", tags=["Assessments"])

@router.get("/questions/{skill_id}", response_model=List[QuestionDisplay])
def get_quiz_questions(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    skill_name = skill.name if skill else f"Skill #{skill_id}"

    # First check database for questions
    db_questions = db.query(AssessmentQuestion).filter(AssessmentQuestion.skill_id == skill_id).all()
    results = []
    
    if db_questions:
        for q in db_questions:
            try:
                opts = json.loads(q.options_json)
            except Exception:
                opts = [q.options_json]
            results.append({
                "id": q.id,
                "skill_id": q.skill_id,
                "skill_name": skill_name,
                "difficulty_level": q.difficulty_level,
                "question_text": q.question_text,
                "question_type": q.question_type,
                "code_snippet": q.code_snippet,
                "options": opts,
                "subtopic": q.subtopic
            })
    else:
        # Fallback to pre-authored diagnostic questions
        questions = get_questions_for_skill(skill_id)
        for q in questions:
            results.append({
                "id": q["id"],
                "skill_id": skill_id,
                "skill_name": skill_name,
                "difficulty_level": q.get("difficulty_level", 2),
                "question_text": q["question_text"],
                "question_type": q.get("question_type", "mcq"),
                "code_snippet": q.get("code_snippet"),
                "options": q["options"],
                "subtopic": q["subtopic"]
            })

    return results

@router.post("/submit", response_model=QuizResultResponse)
def submit_quiz(
    payload: QuizSubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    skill = db.query(Skill).filter(Skill.id == payload.skill_id).first()
    skill_name = skill.name if skill else f"Skill #{payload.skill_id}"

    # 1. Assessment Agent: Grade the answers
    eval_res = evaluate_quiz_submission(
        user_id=current_user.id,
        skill_id=payload.skill_id,
        answers_submission=[{"question_id": a.question_id, "user_answer": a.user_answer} for a in payload.answers]
    )

    score_pct = eval_res["score_percentage"]
    passed = eval_res["passed"]
    weak_subtopics = eval_res["weak_subtopics"]
    feedback = eval_res["feedback"]
    question_results = eval_res["question_results"]

    # 2. Get current user skill level
    user_skill = db.query(UserSkill).filter(
        UserSkill.user_id == current_user.id,
        UserSkill.skill_id == payload.skill_id
    ).first()
    old_proficiency = user_skill.proficiency_level if user_skill else 1.0

    # 3. Progress Evaluator Agent: Update skill & check adaptation
    prog_eval = evaluate_progress_and_adaptation(
        user_id=current_user.id,
        skill_id=payload.skill_id,
        skill_name=skill_name,
        old_proficiency=old_proficiency,
        score_percentage=score_pct,
        weak_subtopics=weak_subtopics
    )

    new_proficiency = prog_eval["new_proficiency"]
    adaptation_triggered = prog_eval["adaptation_triggered"]
    adaptation_reason = prog_eval["adaptation_reason"]

    # Update database UserSkill
    if user_skill:
        user_skill.proficiency_level = new_proficiency
        user_skill.source = "assessment"
    else:
        user_skill = UserSkill(
            user_id=current_user.id,
            skill_id=payload.skill_id,
            proficiency_level=new_proficiency,
            self_reported_level=old_proficiency,
            confidence_score=0.90,
            source="assessment"
        )
        db.add(user_skill)
    db.commit()

    # 4. Save Assessment Record
    assessment_record = Assessment(
        user_id=current_user.id,
        skill_id=payload.skill_id,
        roadmap_item_id=payload.roadmap_item_id,
        score_percentage=score_pct,
        passed=passed,
        feedback=feedback,
        weak_subtopics=json.dumps(weak_subtopics)
    )
    db.add(assessment_record)
    db.flush()

    for qr in question_results:
        ans_obj = AssessmentAnswer(
            assessment_id=assessment_record.id,
            question_id=qr["question_id"],
            user_answer=qr["user_answer"],
            is_correct=qr["is_correct"],
            points_earned=1.0 if qr["is_correct"] else 0.0
        )
        db.add(ans_obj)
    db.commit()

    # Determine current roadmap version
    current_roadmap = db.query(Roadmap).filter(
        Roadmap.user_id == current_user.id,
        Roadmap.status == "active"
    ).order_by(Roadmap.version.desc()).first()

    current_version = current_roadmap.version if current_roadmap else 1
    new_version = current_version

    # 5. If Adaptive replanning is triggered (e.g. score < 60%):
    if adaptation_triggered:
        new_version = current_version + 1
        
        # Mark previous roadmap as superseded
        if current_roadmap:
            current_roadmap.status = "superseded"
            db.commit()

        # Execute LangGraph Adaptive Replanning Pipeline:
        # Path Planner -> Resource Curator -> Mentor
        adaptive_input = {
            "user_id": current_user.id,
            "user_name": current_user.full_name,
            "preferred_career_role_title": current_user.target_role.title if current_user.target_role else "Full Stack Developer",
            "weekly_hours": current_user.weekly_hours,
            "adaptation_triggered": True,
            "adaptation_reason": adaptation_reason,
            "roadmap_version": current_version,
            "weak_subtopics": weak_subtopics
        }

        pipeline_res = execute_adaptive_pipeline(adaptive_input)

        # Save Roadmap v2 into database
        new_roadmap = Roadmap(
            user_id=current_user.id,
            role_id=current_user.current_role_id or 1,
            version=new_version,
            title=f"Full Stack Developer Mastery (v{new_version} - Adapted)",
            status="active",
            reason_for_adaptation=adaptation_reason,
            total_weeks=pipeline_res.get("total_weeks", 10)
        )
        db.add(new_roadmap)
        db.flush()

        module_resources = pipeline_res.get("module_resources", {})
        for mod in pipeline_res.get("roadmap_modules", []):
            item = RoadmapItem(
                roadmap_id=new_roadmap.id,
                week_number=mod["week_number"],
                sequence_order=mod["sequence_order"],
                title=mod["title"],
                skill_id=mod.get("skill_id"),
                learning_objectives=json.dumps(mod["learning_objectives"]),
                duration_hours=mod["duration_hours"],
                practical_exercise=mod.get("practical_exercise"),
                completion_criteria=mod.get("completion_criteria"),
                status=mod.get("status", "pending"),
                is_remedial=mod.get("is_remedial", False)
            )
            db.add(item)
            db.flush()

            key = f"mod_{mod['week_number']}_{mod['sequence_order']}"
            for r_info in module_resources.get(key, []):
                res_match = db.query(Resource).filter(Resource.url == r_info["url"]).first()
                if res_match:
                    r_assoc = RoadmapItemResource(
                        roadmap_item_id=item.id,
                        resource_id=res_match.id,
                        suitability_reason=r_info.get("suitability_reason")
                    )
                    db.add(r_assoc)

        # Persist Agent Logs
        for log in pipeline_res.get("agent_logs", []):
            db_log = AgentLog(
                user_id=current_user.id,
                agent_name=log["agent_name"],
                status=log["status"],
                task=log["task"],
                input_summary=log.get("input_summary"),
                output_summary=log.get("output_summary"),
                execution_time_ms=log.get("execution_time_ms", 0.0),
                next_agent=log.get("next_agent"),
                metadata_json=json.dumps(log.get("metadata", {}))
            )
            db.add(db_log)

        prog_entry = ProgressRecord(
            user_id=current_user.id,
            event_type="roadmap_adapted",
            details_json=json.dumps({
                "reason": adaptation_reason,
                "new_version": new_version,
                "score": score_pct
            })
        )
        db.add(prog_entry)
        db.commit()

    return {
        "assessment_id": assessment_record.id,
        "skill_id": payload.skill_id,
        "skill_name": skill_name,
        "score_percentage": score_pct,
        "passed": passed,
        "old_proficiency": old_proficiency,
        "new_proficiency": new_proficiency,
        "feedback": feedback,
        "weak_subtopics": weak_subtopics,
        "question_results": question_results,
        "adaptation_triggered": adaptation_triggered,
        "adaptation_reason": adaptation_reason,
        "roadmap_version": new_version
    }

@router.get("/history", response_model=List[AssessmentHistoryItem])
def get_assessment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(Assessment).filter(Assessment.user_id == current_user.id).order_by(Assessment.created_at.desc()).all()
    results = []
    for r in records:
        skill = db.query(Skill).filter(Skill.id == r.skill_id).first()
        try:
            subtopics = json.loads(r.weak_subtopics) if r.weak_subtopics else []
        except Exception:
            subtopics = []
        results.append({
            "id": r.id,
            "skill_name": skill.name if skill else "Skill",
            "score_percentage": r.score_percentage,
            "passed": r.passed,
            "created_at": r.created_at,
            "weak_subtopics": subtopics
        })
    return results
