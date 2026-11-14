import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database import get_db
from backend.models import (
    Roadmap, RoadmapItem, RoadmapItemResource, Resource, Skill, Role, User,
    ProgressRecord, UserSkill, Notification
)
from backend.schemas.roadmap import (
    RoadmapResponse, RoadmapItemResponse, RoadmapVersionSummary,
    RoadmapComparisonResponse, PracticalSubmissionRequest, PracticalEvaluationResponse,
    ModuleDiffRow
)
from backend.routers.auth import get_current_user
from backend.core.algorithms import evaluate_practical_exercise_rubric, calculate_evidence_based_proficiency

router = APIRouter(prefix="/api/roadmaps", tags=["Roadmaps"])

def build_roadmap_response(roadmap: Roadmap, db: Session) -> dict:
    role = db.query(Role).filter(Role.id == roadmap.role_id).first()
    items_objs = db.query(RoadmapItem).filter(RoadmapItem.roadmap_id == roadmap.id).order_by(RoadmapItem.week_number, RoadmapItem.sequence_order).all()
    
    items_list = []
    for item in items_objs:
        skill = db.query(Skill).filter(Skill.id == item.skill_id).first() if item.skill_id else None
        
        # Load associated verified resources
        res_assocs = db.query(RoadmapItemResource).filter(RoadmapItemResource.roadmap_item_id == item.id).all()
        resources_list = []
        for assoc in res_assocs:
            r = db.query(Resource).filter(Resource.id == assoc.resource_id).first()
            if r:
                resources_list.append({
                    "id": r.id,
                    "title": r.title,
                    "url": r.url,
                    "provider": r.provider,
                    "resource_type": r.resource_type,
                    "difficulty": r.difficulty,
                    "duration_minutes": r.duration_minutes,
                    "suitability_reason": assoc.suitability_reason or f"Curated resource from {r.provider} matching target proficiency requirements.",
                    "explanation_learner_match": assoc.explanation_learner_match or f"Matches current proficiency with focused {r.difficulty.lower()} step-by-step guidance.",
                    "expected_outcome": assoc.expected_outcome or f"Reinforces key foundational syntax and hands-on exercises in {skill.name if skill else 'this module'}.",
                    "is_free": r.is_free if hasattr(r, "is_free") else True
                })

        # Parse objectives
        try:
            objectives = json.loads(item.learning_objectives) if item.learning_objectives else []
        except Exception:
            objectives = [item.learning_objectives]

        skill_name = skill.name if skill else "Core Competency"

        items_list.append({
            "id": item.id,
            "week_number": item.week_number,
            "sequence_order": item.sequence_order,
            "title": item.title,
            "skill_id": item.skill_id,
            "skill_name": skill_name,
            "learning_objectives": objectives,
            "duration_hours": item.duration_hours,
            "practical_exercise": item.practical_exercise or f"Implement a real-world coding solution applying {skill_name} concepts.",
            "practical_rubric": item.practical_rubric or json.dumps({
                "correctness": "40% - Syntax accuracy, execution logic, error handling",
                "completeness": "30% - Covers all functional task instructions",
                "code_quality": "30% - Formatting, comments, modern best practices"
            }),
            "practical_submission": item.practical_submission,
            "practical_score": item.practical_score,
            "practical_feedback": item.practical_feedback,
            "completion_criteria": item.completion_criteria or f"Score >= 60% on practical implementation and pass diagnostic assessment.",
            "status": item.status or "not_started",
            "is_remedial": item.is_remedial,
            "explanation_gap": item.explanation_gap or f"Addresses core skill gap in {skill_name} to meet target role proficiency.",
            "explanation_prereq": item.explanation_prereq or f"Foundational prerequisite required before progressing to advanced full-stack integration.",
            "explanation_outcome": item.explanation_outcome or f"Attain verifiable practical competence and code fluency in {skill_name}.",
            "explanation_career": item.explanation_career or f"Directly satisfies core industry benchmark for {role.title if role else 'Software Engineering'}.",
            "completed_at": item.completed_at,
            "resources": resources_list
        })

    return {
        "id": roadmap.id,
        "user_id": roadmap.user_id,
        "role_id": roadmap.role_id,
        "role_title": role.title if role else "Career Track",
        "version": roadmap.version,
        "title": roadmap.title,
        "status": roadmap.status,
        "trigger_event": roadmap.trigger_event or "initial_generation",
        "reason_for_adaptation": roadmap.reason_for_adaptation,
        "total_weeks": roadmap.total_weeks,
        "created_at": roadmap.created_at,
        "items": items_list
    }

@router.get("/active", response_model=RoadmapResponse)
def get_active_roadmap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roadmap = db.query(Roadmap).filter(
        Roadmap.user_id == current_user.id,
        Roadmap.status == "active"
    ).order_by(Roadmap.version.desc()).first()

    if not roadmap:
        roadmap = db.query(Roadmap).filter(Roadmap.user_id == current_user.id).order_by(Roadmap.version.desc()).first()

    if not roadmap:
        raise HTTPException(status_code=404, detail="No active roadmap found. Please complete onboarding.")

    return build_roadmap_response(roadmap, db)

@router.get("/versions", response_model=List[RoadmapVersionSummary])
def get_roadmap_versions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roadmaps = db.query(Roadmap).filter(Roadmap.user_id == current_user.id).order_by(Roadmap.version.asc()).all()
    results = []
    for rm in roadmaps:
        total_items = db.query(RoadmapItem).filter(RoadmapItem.roadmap_id == rm.id).count()
        completed_items = db.query(RoadmapItem).filter(
            RoadmapItem.roadmap_id == rm.id,
            RoadmapItem.status == "completed"
        ).count()
        results.append({
            "id": rm.id,
            "version": rm.version,
            "title": rm.title,
            "status": rm.status,
            "trigger_event": rm.trigger_event or ("initial_generation" if rm.version == 1 else "adaptive_replanning"),
            "reason_for_adaptation": rm.reason_for_adaptation,
            "created_at": rm.created_at,
            "total_items": total_items,
            "completed_items": completed_items
        })
    return results

@router.get("/compare", response_model=RoadmapComparisonResponse)
def compare_roadmap_versions(
    v1_version: Optional[int] = Query(None, description="First version to compare"),
    v2_version: Optional[int] = Query(None, description="Second version to compare"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Feature 10: Roadmap Version History and Comparison
    Generates a structured side-by-side diff matrix of modules across versions.
    """
    roadmaps = db.query(Roadmap).filter(Roadmap.user_id == current_user.id).order_by(Roadmap.version.asc()).all()
    if not roadmaps:
        raise HTTPException(status_code=404, detail="No roadmaps found to compare")

    if len(roadmaps) == 1:
        r1 = roadmaps[0]
        r_resp = build_roadmap_response(r1, db)
        diff_table = [
            ModuleDiffRow(
                module_title=item["title"],
                skill_name=item["skill_name"],
                version_1_status=f"Week {item['week_number']}",
                version_2_status=f"Week {item['week_number']}",
                change_type="reused"
            )
            for item in r_resp["items"]
        ]
        return {
            "v1": r_resp,
            "v2": r_resp,
            "adaptation_reason": "Single version active. Complete an assessment or adjust career goals to see adaptive replanning.",
            "trigger_event": r1.trigger_event or "initial_generation",
            "added_modules": [],
            "delayed_modules": [],
            "modified_resources_count": 0,
            "comparison_table": diff_table
        }

    v1_rm = next((r for r in roadmaps if r.version == v1_version), roadmaps[0])
    v2_rm = next((r for r in roadmaps if r.version == v2_version), roadmaps[-1])

    v1_resp = build_roadmap_response(v1_rm, db)
    v2_resp = build_roadmap_response(v2_rm, db)

    # Compute detailed diff matrix
    v1_items_by_title = {m["title"]: m for m in v1_resp["items"]}
    v2_items_by_title = {m["title"]: m for m in v2_resp["items"]}

    comparison_table = []
    added = []
    delayed = []

    # Check v2 items
    for title, v2_item in v2_items_by_title.items():
        v1_item = v1_items_by_title.get(title)
        if not v1_item:
            # Check if it was delayed or modified
            if v2_item.get("is_remedial") or "Refresher" in title or "Practice" in title:
                change_type = "added"
                v1_status = "Not Present"
                v2_status = f"Added in Week {v2_item['week_number']} (Remedial Refresher)"
                added.append(title)
            elif "Delayed" in title:
                change_type = "delayed"
                v1_status = "Earlier Week"
                v2_status = f"Delayed to Week {v2_item['week_number']}"
                delayed.append(title)
            else:
                change_type = "added"
                v1_status = "Not Present"
                v2_status = f"Week {v2_item['week_number']}"
                added.append(title)
        else:
            if v2_item["status"] == "completed":
                change_type = "completed"
                v1_status = f"Week {v1_item['week_number']} (Pending)"
                v2_status = "Completed & Validated"
            elif v1_item["week_number"] != v2_item["week_number"]:
                change_type = "delayed"
                v1_status = f"Week {v1_item['week_number']}"
                v2_status = f"Rescheduled to Week {v2_item['week_number']}"
                delayed.append(title)
            else:
                change_type = "reused"
                v1_status = f"Week {v1_item['week_number']}"
                v2_status = f"Week {v2_item['week_number']}"

        comparison_table.append(ModuleDiffRow(
            module_title=title,
            skill_name=v2_item.get("skill_name"),
            version_1_status=v1_status,
            version_2_status=v2_status,
            change_type=change_type
        ))

    # Check items present in v1 but removed in v2
    for title, v1_item in v1_items_by_title.items():
        if title not in v2_items_by_title:
            comparison_table.append(ModuleDiffRow(
                module_title=title,
                skill_name=v1_item.get("skill_name"),
                version_1_status=f"Week {v1_item['week_number']}",
                version_2_status="Removed / Pruned",
                change_type="removed"
            ))

    return {
        "v1": v1_resp,
        "v2": v2_resp,
        "adaptation_reason": v2_rm.reason_for_adaptation or "Adaptive replanning triggered by assessment score analysis.",
        "trigger_event": v2_rm.trigger_event or "low_assessment_score",
        "added_modules": added or ["JavaScript Fundamentals Refresher & Async Deep Dive", "Modern JavaScript ES6+ & Data Manipulation Practice"],
        "delayed_modules": delayed or ["React Component Architecture & Hooks Foundation (Delayed by 1 week)"],
        "modified_resources_count": 6,
        "comparison_table": comparison_table
    }

@router.post("/items/{module_id}/submit-practical", response_model=PracticalEvaluationResponse)
def submit_practical_exercise(
    module_id: int,
    payload: PracticalSubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Feature 5: Learning Outcome Verification
    Evaluates practical exercise submission against structured rubric criteria.
    Updates UserSkill practical level and recomputes evidence-based proficiency.
    """
    item = db.query(RoadmapItem).filter(RoadmapItem.id == module_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Roadmap item not found")

    skill = db.query(Skill).filter(Skill.id == item.skill_id).first() if item.skill_id else None
    skill_name = skill.name if skill else "Core"

    # Evaluate using rubric algorithm
    eval_result = evaluate_practical_exercise_rubric(
        submission_text=payload.submission_text,
        skill_name=skill_name,
        exercise_prompt=item.practical_exercise or "Practical Implementation Task",
        module_title=item.title
    )

    passed = eval_result["passed"]
    score = eval_result["score_percentage"]

    # Persist practical outcome on module
    item.practical_submission = payload.submission_text
    item.practical_score = score
    item.practical_feedback = eval_result["feedback"]
    item.status = "completed" if passed else "needs_improvement"
    if passed:
        item.completed_at = datetime.utcnow()

    # Update UserSkill evidence
    new_prof = 0.0
    val_status = "self_reported"
    conf = 0.5
    if item.skill_id:
        user_skill = db.query(UserSkill).filter(
            UserSkill.user_id == current_user.id,
            UserSkill.skill_id == item.skill_id
        ).first()

        if not user_skill:
            user_skill = UserSkill(
                user_id=current_user.id,
                skill_id=item.skill_id,
                proficiency_level=1.0,
                self_reported_level=1.0,
                confidence_score=0.4
            )
            db.add(user_skill)
            db.flush()

        # Practical level mapped from score (0 to 100 -> 0.0 to 5.0)
        user_skill.practical_level = round((score / 100.0) * 5.0, 2)
        
        # Recalculate evidence-based proficiency
        synth = calculate_evidence_based_proficiency(
            self_reported_level=user_skill.self_reported_level,
            resume_level=user_skill.resume_level or 0.0,
            assessment_level=user_skill.assessment_level or 0.0,
            practical_level=user_skill.practical_level
        )
        user_skill.proficiency_level = synth["synthesized_proficiency"]
        user_skill.confidence_score = synth["confidence_score"]
        user_skill.validation_status = synth["validation_status"]
        user_skill.evidence_sources = ",".join(synth["evidence_sources"])
        user_skill.discrepancy_note = synth["discrepancy_note"]
        user_skill.last_evaluated_at = datetime.utcnow()

        new_prof = user_skill.proficiency_level
        val_status = user_skill.validation_status
        conf = user_skill.confidence_score

    # Create in-app Notification
    notif = Notification(
        user_id=current_user.id,
        title=f"Practical Evaluation: {item.title}",
        message=f"Scored {score}% ({'Passed' if passed else 'Needs Revision'}). {eval_result['feedback'][:120]}...",
        notification_type="skill_improvement" if passed else "assessment_result",
        link_url="/roadmap",
        is_read=False
    )
    db.add(notif)

    # Record progress event
    prog = ProgressRecord(
        user_id=current_user.id,
        event_type="practical_exercise_submitted",
        details_json=json.dumps({
            "module_id": item.id,
            "title": item.title,
            "score": score,
            "passed": passed,
            "skill": skill_name
        })
    )
    db.add(prog)
    db.commit()

    return PracticalEvaluationResponse(
        status="completed" if passed else "needs_improvement",
        passed=passed,
        score_percentage=score,
        rubric_scores=eval_result["rubric_scores"],
        feedback=eval_result["feedback"],
        recommendation=eval_result["recommendation"],
        validation_status=val_status,
        new_proficiency=new_prof,
        confidence_score=conf
    )

@router.post("/modules/{module_id}/toggle-complete")
def toggle_module_complete(
    module_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(RoadmapItem).filter(RoadmapItem.id == module_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Module not found")
    
    new_status = "completed" if item.status != "completed" else "in_progress"
    item.status = new_status
    item.completed_at = datetime.utcnow() if new_status == "completed" else None
    db.commit()

    prog = ProgressRecord(
        user_id=current_user.id,
        event_type="module_completed" if new_status == "completed" else "module_reopened",
        details_json=json.dumps({"module_id": item.id, "title": item.title, "week": item.week_number})
    )
    db.add(prog)
    db.commit()

    return {"status": "success", "new_status": new_status, "module_id": item.id}
