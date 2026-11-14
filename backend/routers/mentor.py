from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import json

from backend.database import get_db
from backend.models import User, Roadmap, RoadmapItem, Assessment, UserSkill
from backend.schemas.agent import MentorChatRequest, MentorChatResponse
from backend.routers.auth import get_current_user
from backend.agents.mentor import answer_mentor_query

router = APIRouter(prefix="/api/mentor", tags=["AI Mentor"])

@router.post("/chat", response_model=MentorChatResponse)
def mentor_chat(
    payload: MentorChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_role_title = current_user.target_role.title if current_user.target_role else "Full Stack Developer"
    
    # Active roadmap info
    roadmap = db.query(Roadmap).filter(
        Roadmap.user_id == current_user.id,
        Roadmap.status == "active"
    ).order_by(Roadmap.version.desc()).first()

    module_title = None
    if payload.current_module_id:
        item = db.query(RoadmapItem).filter(RoadmapItem.id == payload.current_module_id).first()
        if item:
            module_title = item.title
    elif roadmap:
        first_item = db.query(RoadmapItem).filter(
            RoadmapItem.roadmap_id == roadmap.id,
            RoadmapItem.status.in_(["pending", "in_progress", "not_started"])
        ).first()
        if first_item:
            module_title = first_item.title

    # Recent assessment info
    recent_assessment = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id)
        .order_by(Assessment.created_at.desc())
        .first()
    )

    weak_topics = []
    recent_score = 40.0
    if recent_assessment:
        recent_score = recent_assessment.score_percentage
        try:
            weak_topics = json.loads(recent_assessment.weak_subtopics) if recent_assessment.weak_subtopics else []
        except Exception:
            weak_topics = [recent_assessment.weak_subtopics] if recent_assessment.weak_subtopics else []

    # User skills
    user_skills = {us.skill_id: us.proficiency_level for us in current_user.user_skills}

    context = {
        "roadmap_version": roadmap.version if roadmap else 1,
        "adaptation_reason": roadmap.reason_for_adaptation if roadmap else None,
        "recent_score": recent_score,
        "weak_subtopics": weak_topics,
        "user_skills": user_skills
    }

    result = answer_mentor_query(
        user_name=current_user.full_name,
        target_role=target_role_title,
        user_query=payload.message,
        current_module_title=module_title,
        context=context
    )

    resp_text = result.get("response") or result.get("reply", "I am here to guide your learning path.")
    actions = result.get("suggested_actions") or []
    first_action = actions[0] if actions else result.get("suggested_action")

    return {
        "reply": resp_text,
        "response": resp_text,
        "suggested_action": first_action,
        "suggested_actions": actions,
        "related_resources": result.get("related_resources", []),
        "adaptation_context": roadmap.reason_for_adaptation if roadmap else None
    }

@router.get("/briefing")
def get_mentor_briefing(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_role = current_user.target_role.title if current_user.target_role else "Full Stack Developer"
    roadmap = db.query(Roadmap).filter(
        Roadmap.user_id == current_user.id,
        Roadmap.status == "active"
    ).order_by(Roadmap.version.desc()).first()

    first_pending_item = None
    if roadmap:
        first_pending_item = db.query(RoadmapItem).filter(
            RoadmapItem.roadmap_id == roadmap.id,
            RoadmapItem.status.in_(["pending", "in_progress", "not_started"])
        ).order_by(RoadmapItem.week_number.asc()).first()

    if roadmap and roadmap.version > 1:
        guidance = (
            f"Hi {current_user.full_name}! We adapted your roadmap to v{roadmap.version} to help you solidify core fundamentals "
            f"before taking on advanced framework architectures. You're building steady, real mastery!"
        )
        action = f"Work through {first_pending_item.title if first_pending_item else 'Week 1 Refresher'}."
    else:
        guidance = (
            f"Hello {current_user.full_name}! Your personalized curriculum for {target_role} is active. "
            f"Your prior background in Python and SQL gave you a great head start."
        )
        action = f"Start with {first_pending_item.title if first_pending_item else 'Week 1 Module'}."

    return {
        "guidance": guidance,
        "suggested_action": action,
        "current_roadmap_version": roadmap.version if roadmap else 1,
        "target_role": target_role,
        "next_module": {
            "id": first_pending_item.id if first_pending_item else None,
            "title": first_pending_item.title if first_pending_item else "Module 1",
            "week": first_pending_item.week_number if first_pending_item else 1
        } if first_pending_item else None
    }
