import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database import get_db
from backend.models import (
    Role, RoleSkill, Skill, UserSkill, User, Roadmap, RoadmapItem,
    RoadmapItemResource, Resource, AgentLog, ProgressRecord, Notification
)
from backend.schemas.role import (
    RoleResponse, CareerMatchResponse, CareerSwitchRequest, CareerSwitchResponse
)
from backend.routers.auth import get_current_user
from backend.agents.career_matcher import run_career_matcher_agent, PREDEFINED_ROLES
from backend.agents.orchestrator import execute_onboarding_pipeline
from backend.core.algorithms import calculate_career_switch_carryover, calculate_career_transition_intelligence

router = APIRouter(prefix="/api/careers", tags=["Careers"])

@router.get("/roles", response_model=List[RoleResponse])
def get_roles(db: Session = Depends(get_db)):
    roles = db.query(Role).all()
    results = []
    for r in roles:
        role_skills_objs = db.query(RoleSkill).filter(RoleSkill.role_id == r.id).all()
        skills_items = []
        for rs in role_skills_objs:
            skill = db.query(Skill).filter(Skill.id == rs.skill_id).first()
            skills_items.append({
                "skill_id": rs.skill_id,
                "skill_name": skill.name if skill else f"Skill #{rs.skill_id}",
                "category": skill.category if skill else "General",
                "required_level": rs.required_level,
                "weight": rs.weight,
                "is_core": rs.is_core,
                "dependency_depth": rs.dependency_depth
            })
        results.append({
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "category": r.category,
            "icon": r.icon,
            "skills": skills_items
        })
    return results

@router.get("/match", response_model=CareerMatchResponse)
def get_career_match(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_skills = db.query(UserSkill).filter(UserSkill.user_id == current_user.id).all()
    skill_vector = {us.skill_id: us.proficiency_level for us in user_skills}
    role_id = current_user.current_role_id or 1

    matcher_res = run_career_matcher_agent({
        "user_id": current_user.id,
        "skill_vector": skill_vector,
        "preferred_career_role_id": role_id
    })

    role = db.query(Role).filter(Role.id == role_id).first()

    return {
        "role_id": role_id,
        "role_title": role.title if role else "Career Role",
        "match_percentage": matcher_res.get("career_match_percentage", 0.0),
        "required_skills_count": matcher_res.get("required_skills_count", 0),
        "matched_skills_count": matcher_res.get("matched_skills_count", 0),
        "skill_gaps": matcher_res.get("ranked_skill_gaps", []),
        "adjacent_careers": matcher_res.get("adjacent_careers", [])
    }

@router.get("/transition-plan")
def get_transition_plan(
    target_role_id: int = Query(..., description="Target role ID for transition intelligence"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Feature 7: Advanced Career Intelligence & Transition Planning
    Analyzes transferable skills, gap severity, reusable learning modules, and time to transition.
    Includes explicit disclaimer that this is a skills-based match.
    """
    target_role = db.query(Role).filter(Role.id == target_role_id).first()
    if not target_role:
        raise HTTPException(status_code=404, detail="Target role not found")

    current_role_id = current_user.current_role_id or 1
    current_role = db.query(Role).filter(Role.id == current_role_id).first()

    user_skills = db.query(UserSkill).filter(UserSkill.user_id == current_user.id).all()
    current_skills_dict = {us.skill_id: us.proficiency_level for us in user_skills}

    target_role_skills_objs = db.query(RoleSkill).filter(RoleSkill.role_id == target_role_id).all()
    target_role_skills_list = []
    for rs in target_role_skills_objs:
        sk = db.query(Skill).filter(Skill.id == rs.skill_id).first()
        target_role_skills_list.append({
            "skill_id": rs.skill_id,
            "skill_name": sk.name if sk else f"Skill #{rs.skill_id}",
            "required_level": rs.required_level,
            "weight": rs.weight,
            "dependency_depth": rs.dependency_depth
        })

    plan = calculate_career_transition_intelligence(
        current_role={"id": current_role.id if current_role else 1, "title": current_role.title if current_role else "Current Role"},
        target_role={"id": target_role.id, "title": target_role.title},
        current_skills=current_skills_dict,
        target_role_skills=target_role_skills_list
    )
    return plan

@router.post("/switch", response_model=CareerSwitchResponse)
def switch_career_goal(
    payload: CareerSwitchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_role_id = payload.target_role_id
    new_role = db.query(Role).filter(Role.id == new_role_id).first()
    if not new_role:
        raise HTTPException(status_code=404, detail="Target role not found")

    old_role_id = current_user.current_role_id or 1
    old_role = db.query(Role).filter(Role.id == old_role_id).first()

    # 1. Fetch user skills
    user_skills = db.query(UserSkill).filter(UserSkill.user_id == current_user.id).all()
    user_skills_dict = {us.skill_id: us.proficiency_level for us in user_skills}

    # 2. Fetch new role requirements
    new_role_skills_objs = db.query(RoleSkill).filter(RoleSkill.role_id == new_role_id).all()
    new_role_skills_list = []
    for rs in new_role_skills_objs:
        sk = db.query(Skill).filter(Skill.id == rs.skill_id).first()
        new_role_skills_list.append({
            "skill_id": rs.skill_id,
            "skill_name": sk.name if sk else f"Skill #{rs.skill_id}",
            "required_level": rs.required_level,
            "weight": rs.weight,
            "dependency_depth": rs.dependency_depth
        })

    # 3. Calculate Carry-over percentage using formula
    carryover_pct, overlapping, missing = calculate_career_switch_carryover(
        user_skills_dict,
        new_role_skills_list
    )

    # 4. Update user's current role
    current_user.current_role_id = new_role_id
    db.commit()

    # 5. Archive / supersede older roadmaps
    db.query(Roadmap).filter(Roadmap.user_id == current_user.id).update({"status": "superseded"})

    # 6. Run LangGraph Multi-Agent Pipeline for new role
    skills_for_pipeline = [{"skill_id": us.skill_id, "proficiency": us.proficiency_level} for us in user_skills]
    pipeline_res = execute_onboarding_pipeline({
        "user_id": current_user.id,
        "user_name": current_user.full_name,
        "education": current_user.education or "Student",
        "weekly_hours": current_user.weekly_hours,
        "target_date": current_user.target_date or "10 weeks",
        "preferred_career_role_id": new_role_id,
        "preferred_career_role_title": new_role.title,
        "raw_skills": skills_for_pipeline
    })

    # 7. Create new active Roadmap
    new_roadmap = Roadmap(
        user_id=current_user.id,
        role_id=new_role_id,
        version=1,
        title=f"{new_role.title} Career Roadmap",
        status="active",
        trigger_event="career_goal_change",
        reason_for_adaptation=f"Goal changed from {old_role.title if old_role else 'Previous'} to {new_role.title}. {carryover_pct}% of prior skill progress retained.",
        total_weeks=pipeline_res.get("total_weeks", 10)
    )
    db.add(new_roadmap)
    db.flush()

    # Save new items and resources
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
            status=mod.get("status", "not_started"),
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

    # Add in-app Notification
    notif = Notification(
        user_id=current_user.id,
        title=f"Career Goal Updated: {new_role.title}",
        message=f"Successfully transitioned to {new_role.title}. Retained {carryover_pct}% of previous learning progress.",
        notification_type="roadmap_update",
        link_url="/roadmap",
        is_read=False
    )
    db.add(notif)

    # Progress record
    prog = ProgressRecord(
        user_id=current_user.id,
        event_type="role_changed",
        details_json=json.dumps({
            "from_role": old_role.title if old_role else "Old",
            "to_role": new_role.title,
            "carryover_percentage": carryover_pct
        })
    )
    db.add(prog)
    db.commit()

    explanation = f"{carryover_pct}% of your existing learning progress has been carried over from {old_role.title if old_role else 'previous role'}. Your mastered foundations in {', '.join([o['skill_name'] for o in overlapping]) or 'core concepts'} are directly applied to {new_role.title}!"

    return {
        "new_role_id": new_role_id,
        "new_role_title": new_role.title,
        "carry_over_percentage": carryover_pct,
        "overlapping_skills": overlapping,
        "new_required_skills": missing,
        "explanation": explanation
    }
