import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, UserSkill, Role, Resource, Roadmap, RoadmapItem, RoadmapItemResource, AgentLog, ProgressRecord
from backend.schemas.user import OnboardingRequest
from backend.routers.auth import get_current_user
from backend.agents.orchestrator import execute_onboarding_pipeline

router = APIRouter(prefix="/api/onboarding", tags=["Onboarding"])

@router.post("/submit")
def submit_onboarding(
    payload: OnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # 1. Update user profile fields
        current_user.full_name = payload.full_name
        current_user.education = payload.education
        current_user.academic_year_or_experience = payload.academic_year_or_experience
        current_user.weekly_hours = payload.weekly_hours
        current_user.target_date = payload.target_date
        current_user.current_role_id = payload.preferred_career_role_id
        current_user.resume_text = payload.resume_text
        db.commit()

        # 2. Upsert user skills
        for s in payload.skills:
            s_id = s.get("skill_id")
            prof = float(s.get("proficiency", 1.0))
            if s_id:
                existing_us = db.query(UserSkill).filter(
                    UserSkill.user_id == current_user.id,
                    UserSkill.skill_id == s_id
                ).first()
                if existing_us:
                    existing_us.proficiency_level = prof
                    existing_us.self_reported_level = prof
                else:
                    new_us = UserSkill(
                        user_id=current_user.id,
                        skill_id=s_id,
                        proficiency_level=prof,
                        self_reported_level=prof,
                        confidence_score=0.85 if prof >= 3.0 else 0.70,
                        source="onboarding"
                    )
                    db.add(new_us)
        db.commit()

        # 3. Execute LangGraph Multi-Agent Onboarding Pipeline
        target_role = db.query(Role).filter(Role.id == payload.preferred_career_role_id).first()
        pipeline_input = {
            "user_id": current_user.id,
            "user_name": current_user.full_name,
            "education": current_user.education or "Student",
            "weekly_hours": current_user.weekly_hours,
            "target_date": current_user.target_date or "10 weeks",
            "preferred_career_role_id": current_user.current_role_id,
            "preferred_career_role_title": target_role.title if target_role else "Full Stack Developer",
            "raw_skills": payload.skills,
            "resume_text": payload.resume_text
        }

        agent_result = execute_onboarding_pipeline(pipeline_input)

        # 4. Supersede older roadmaps if any
        db.query(Roadmap).filter(Roadmap.user_id == current_user.id).update({"status": "superseded"})

        # 5. Create new Roadmap v1
        new_roadmap = Roadmap(
            user_id=current_user.id,
            role_id=current_user.current_role_id,
            version=1,
            title=f"{target_role.title if target_role else 'Career'} Mastery Roadmap (v1)",
            status="active",
            reason_for_adaptation="Initial personalized roadmap generated from multi-agent skill gap analysis.",
            total_weeks=agent_result.get("total_weeks", 10)
        )
        db.add(new_roadmap)
        db.flush()

        # 6. Save Modules and attach verified curated resources
        module_resources = agent_result.get("module_resources", {})
        for mod in agent_result.get("roadmap_modules", []):
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

            # Attach resources
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

        # 7. Persist Agent Logs into database
        for log in agent_result.get("agent_logs", []):
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

        # 8. Record Progress
        prog = ProgressRecord(
            user_id=current_user.id,
            event_type="onboarding_completed",
            details_json=json.dumps({
                "target_role": target_role.title if target_role else "Role",
                "career_match": agent_result.get("career_match_percentage")
            })
        )
        db.add(prog)
        db.commit()

        return {
            "status": "success",
            "message": "Onboarding completed and personalized roadmap v1 generated.",
            "career_match_percentage": agent_result.get("career_match_percentage"),
            "roadmap_id": new_roadmap.id,
            "modules_count": len(agent_result.get("roadmap_modules", [])),
            "agent_logs_count": len(agent_result.get("agent_logs", []))
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Onboarding failed: {str(e)}")
