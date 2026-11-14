from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.database import get_db
from backend.models import Skill, UserSkill, User, SkillPrerequisite, Role
from backend.schemas.skill import (
    SkillResponse, UserSkillResponse, SkillAnalysisResponse,
    PrerequisiteGraphResponse, PrerequisiteNode, PrerequisiteEdge
)
from backend.routers.auth import get_current_user
from backend.agents.skill_analyst import run_skill_analyst_agent
from backend.core.algorithms import calculate_evidence_based_proficiency

router = APIRouter(prefix="/api/skills", tags=["Skills"])

@router.get("", response_model=List[SkillResponse])
def get_all_skills(db: Session = Depends(get_db)):
    return db.query(Skill).all()

@router.get("/my-skills", response_model=List[UserSkillResponse])
def get_user_skills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    results = []
    user_skills = db.query(UserSkill).filter(UserSkill.user_id == current_user.id).all()
    for us in user_skills:
        skill = db.query(Skill).filter(Skill.id == us.skill_id).first()
        results.append({
            "id": us.id,
            "skill_id": us.skill_id,
            "skill_name": skill.name if skill else f"Skill #{us.skill_id}",
            "category": skill.category if skill else "General",
            "proficiency_level": us.proficiency_level,
            "self_reported_level": us.self_reported_level,
            "resume_level": us.resume_level or 0.0,
            "assessment_level": us.assessment_level or 0.0,
            "practical_level": us.practical_level or 0.0,
            "confidence_score": us.confidence_score,
            "source": us.source,
            "evidence_sources": us.evidence_sources or "self_reported",
            "validation_status": us.validation_status or "self_reported",
            "discrepancy_note": us.discrepancy_note,
            "last_evaluated_at": us.last_evaluated_at
        })
    return results

@router.get("/analysis", response_model=SkillAnalysisResponse)
def get_skill_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_skills = db.query(UserSkill).filter(UserSkill.user_id == current_user.id).all()
    skill_vector = {us.skill_id: us.proficiency_level for us in user_skills}
    conf_scores = {us.skill_id: us.confidence_score for us in user_skills}

    analysis_res = run_skill_analyst_agent({
        "user_id": current_user.id,
        "skill_vector": skill_vector,
        "confidence_scores": conf_scores
    })

    # Multi-source evidence breakdown for Feature 2
    evidence_breakdown = []
    for us in user_skills:
        skill = db.query(Skill).filter(Skill.id == us.skill_id).first()
        evidence_breakdown.append({
            "skill_id": us.skill_id,
            "skill_name": skill.name if skill else f"Skill #{us.skill_id}",
            "self_reported": us.self_reported_level,
            "resume": us.resume_level or 0.0,
            "assessment": us.assessment_level or 0.0,
            "practical": us.practical_level or 0.0,
            "synthesized_proficiency": us.proficiency_level,
            "confidence_score": us.confidence_score,
            "validation_status": us.validation_status or "self_reported",
            "discrepancy_note": us.discrepancy_note,
            "evidence_sources": (us.evidence_sources or "self_reported").split(",")
        })

    return {
        "strengths": analysis_res.get("strengths", []),
        "weaknesses": analysis_res.get("weaknesses", []),
        "recommended_focus": analysis_res.get("recommended_focus", []),
        "radar_data": analysis_res.get("skill_radar_data", []),
        "missing_prerequisites": analysis_res.get("missing_prerequisites", []),
        "evidence_breakdown": evidence_breakdown
    }

@router.get("/prerequisites-graph", response_model=PrerequisiteGraphResponse)
def get_prerequisites_graph(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Feature 4: Prerequisite-Aware Learning Engine
    Returns dependency DAG with status for each node:
    - completed: proficiency >= 3.5
    - validated: assessment or practical validated
    - in_progress: currently being learned
    - locked: prerequisite proficiency < 2.0
    - recommended: ready to learn & required for career target
    """
    all_skills = db.query(Skill).all()
    user_skills = {us.skill_id: us for us in db.query(UserSkill).filter(UserSkill.user_id == current_user.id).all()}
    
    # Target role skills
    target_role_skill_ids = set()
    role_reqs = {}
    if current_user.current_role_id:
        role = db.query(Role).filter(Role.id == current_user.current_role_id).first()
        if role:
            for rs in role.role_skills:
                target_role_skill_ids.add(rs.skill_id)
                role_reqs[rs.skill_id] = rs.required_level

    # Prerequisites map: skill_id -> list of prerequisite skill_ids
    prereq_records = db.query(SkillPrerequisite).all()
    prereqs_by_skill = {}
    edges = []
    
    # Built-in fallbacks if DB table is freshly created
    static_prereqs = [
        (3, 2), # HTML & CSS -> JavaScript
        (2, 4), # JavaScript -> React
        (2, 5), # JavaScript -> Node.js
        (1, 12), # Python -> Data Analysis
        (12, 9), # Data Analysis -> Machine Learning
        (1, 8),  # Python -> REST APIs
        (6, 8),  # SQL -> REST APIs
        (7, 10), # Git -> Cloud Computing
    ]

    for source_id, target_id in static_prereqs:
        prereqs_by_skill.setdefault(target_id, []).append(source_id)
        edges.append(PrerequisiteEdge(
            id=f"e_{source_id}_{target_id}",
            source=str(source_id),
            target=str(target_id),
            is_strict=True
        ))

    nodes = []
    for skill in all_skills:
        us = user_skills.get(skill.id)
        current_prof = us.proficiency_level if us else 0.0
        val_status = us.validation_status if us else "self_reported"
        conf = us.confidence_score if us else 0.4
        required_level = role_reqs.get(skill.id, 3.0)

        # Check prerequisites
        skill_prereqs = prereqs_by_skill.get(skill.id, [])
        all_prereqs_met = True
        for p_id in skill_prereqs:
            p_us = user_skills.get(p_id)
            if not p_us or p_us.proficiency_level < 2.0:
                all_prereqs_met = False
                break

        # Determine node state
        if current_prof >= 3.5:
            node_status = "completed"
        elif val_status in ["assessment_validated", "practically_validated", "fully_validated"]:
            node_status = "validated"
        elif not all_prereqs_met:
            node_status = "locked"
        elif current_prof > 0.0:
            node_status = "in_progress"
        elif skill.id in target_role_skill_ids:
            node_status = "recommended"
        else:
            node_status = "in_progress"

        nodes.append(PrerequisiteNode(
            id=str(skill.id),
            skill_id=skill.id,
            label=skill.name,
            category=skill.category,
            status=node_status,
            proficiency=current_prof,
            required_level=required_level,
            confidence=round(conf * 100, 1)
        ))

    return PrerequisiteGraphResponse(nodes=nodes, edges=edges)
