import json
import os
from datetime import datetime, timedelta
from backend.database import SessionLocal, engine, Base
from backend.models import (
    User, Skill, UserSkill, Role, RoleSkill, Resource, Roadmap, RoadmapItem,
    RoadmapItemResource, AssessmentQuestion, AgentLog, ProgressRecord,
    Organization, SkillPrerequisite, Notification
)
from backend.core.security import get_password_hash
from backend.core.rag import load_verified_catalog
from backend.core.algorithms import calculate_evidence_based_proficiency
from backend.agents.career_matcher import PREDEFINED_ROLES

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Organizations
        orgs_data = [
            {"id": 1, "name": "Stanford School of Engineering", "org_type": "university", "domain": "stanford.edu", "description": "Top-tier collegiate computer science and engineering department."},
            {"id": 2, "name": "NexGen Cloud Enterprises", "org_type": "enterprise", "domain": "nexgen.io", "description": "Global enterprise cloud software and AI technology consultancy."}
        ]
        for od in orgs_data:
            existing = db.query(Organization).filter(Organization.id == od["id"]).first()
            if not existing:
                org_obj = Organization(
                    id=od["id"],
                    name=od["name"],
                    org_type=od["org_type"],
                    domain=od["domain"],
                    description=od["description"]
                )
                db.add(org_obj)
        db.commit()

        # 2. Seed Skills
        skills_data = [
            {"id": 1, "name": "Python", "category": "Backend", "description": "High-level, versatile programming language for web, data, and scripting."},
            {"id": 2, "name": "JavaScript", "category": "Frontend", "description": "The language of the web: event loops, closures, DOM, and async/await."},
            {"id": 3, "name": "HTML & CSS", "category": "Frontend", "description": "Core layout, semantic markup, Flexbox, Grid, and responsive web design."},
            {"id": 4, "name": "React", "category": "Frontend", "description": "Component-based declarative UI library with hooks and state management."},
            {"id": 5, "name": "Node.js", "category": "Backend", "description": "V8 asynchronous JavaScript runtime and Express web server development."},
            {"id": 6, "name": "SQL", "category": "Database", "description": "Relational database querying, joins, transactions, indexes, and schema design."},
            {"id": 7, "name": "Git", "category": "DevOps", "description": "Distributed version control, branching strategies, rebasing, and pull requests."},
            {"id": 8, "name": "REST APIs", "category": "Backend", "description": "HTTP semantics, status codes, JWT authentication, and OpenAPI specifications."},
            {"id": 9, "name": "Machine Learning", "category": "Data Science", "description": "Supervised/unsupervised algorithms, scikit-learn, and model evaluation."},
            {"id": 10, "name": "Cloud Computing", "category": "Cloud", "description": "AWS/GCP/Azure cloud primitives, compute, storage, networking, and CI/CD."},
            {"id": 11, "name": "Cybersecurity", "category": "Security", "description": "OWASP top 10 vulnerabilities, auth security, and defensive web practices."},
            {"id": 12, "name": "Data Analysis", "category": "Data", "description": "Exploratory data analysis, Pandas DataFrames, and statistical data visualization."}
        ]

        for s in skills_data:
            existing = db.query(Skill).filter(Skill.name == s["name"]).first()
            if not existing:
                skill_obj = Skill(id=s["id"], name=s["name"], category=s["category"], description=s["description"])
                db.add(skill_obj)
        db.commit()

        # 3. Seed Skill Prerequisites
        prereqs = [
            (3, 2, 2.0), # HTML & CSS -> JavaScript
            (2, 4, 3.0), # JavaScript -> React
            (2, 5, 3.0), # JavaScript -> Node.js
            (1, 12, 2.5), # Python -> Data Analysis
            (12, 9, 3.0), # Data Analysis -> Machine Learning
            (1, 8, 2.5),  # Python -> REST APIs
            (6, 8, 2.5),  # SQL -> REST APIs
            (7, 10, 2.0), # Git -> Cloud Computing
        ]
        for prereq_id, skill_id, req_level in prereqs:
            existing = db.query(SkillPrerequisite).filter(
                SkillPrerequisite.skill_id == skill_id,
                SkillPrerequisite.prerequisite_id == prereq_id
            ).first()
            if not existing:
                sp = SkillPrerequisite(
                    skill_id=skill_id,
                    prerequisite_id=prereq_id,
                    required_proficiency=req_level,
                    is_strict=True
                )
                db.add(sp)
        db.commit()

        # 4. Seed Roles and RoleSkills
        role_categories = {
            1: "Engineering", 2: "Data", 3: "Data", 4: "Engineering",
            5: "Engineering", 6: "Security", 7: "Cloud", 8: "Data"
        }
        role_icons = {
            1: "Layers", 2: "Database", 3: "Cpu", 4: "Layout",
            5: "Server", 6: "Shield", 7: "Cloud", 8: "BarChart3"
        }

        for r_id, r_info in PREDEFINED_ROLES.items():
            existing_role = db.query(Role).filter(Role.id == r_id).first()
            if not existing_role:
                new_role = Role(
                    id=r_id,
                    title=r_info["title"],
                    description=f"Specialized career path focusing on high-impact competencies in {r_info['category']}.",
                    category=role_categories.get(r_id, "Engineering"),
                    icon=role_icons.get(r_id, "Briefcase")
                )
                db.add(new_role)
                db.flush()

                for rs in r_info["skills"]:
                    role_skill = RoleSkill(
                        role_id=r_id,
                        skill_id=rs["skill_id"],
                        required_level=rs["required_level"],
                        weight=rs["weight"],
                        dependency_depth=rs["dependency_depth"],
                        is_core=rs["is_core"]
                    )
                    db.add(role_skill)
        db.commit()

        # 5. Seed Verified Resources
        catalog = load_verified_catalog()
        for item in catalog:
            skill = db.query(Skill).filter(Skill.name == item["skill_name"]).first()
            if skill:
                existing_res = db.query(Resource).filter(Resource.url == item["url"]).first()
                if not existing_res:
                    res = Resource(
                        title=item["title"],
                        url=item["url"],
                        provider=item["provider"],
                        resource_type=item["resource_type"],
                        difficulty=item["difficulty"],
                        duration_minutes=item["duration_minutes"],
                        skill_id=skill.id,
                        description=item.get("description", ""),
                        is_verified=True,
                        is_free=item.get("is_free", True)
                    )
                    db.add(res)
        db.commit()

        # 6. Seed Diagnostic Questions
        from backend.agents.assessment_agent import SKILL_DIAGNOSTIC_QUESTIONS
        for s_id, questions in SKILL_DIAGNOSTIC_QUESTIONS.items():
            for q in questions:
                existing_q = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == q["id"]).first()
                if not existing_q:
                    q_obj = AssessmentQuestion(
                        id=q["id"],
                        skill_id=s_id,
                        difficulty_level=q.get("difficulty_level", 2),
                        question_text=q["question_text"],
                        question_type=q.get("question_type", "mcq"),
                        code_snippet=q.get("code_snippet"),
                        options_json=json.dumps(q["options"]),
                        correct_answer=q["correct_answer"],
                        explanation=q.get("explanation"),
                        subtopic=q["subtopic"]
                    )
                    db.add(q_obj)
        db.commit()

        # 7. Seed Demo Users across all 4 roles
        users_seed = [
            {
                "email": "alex@skillpilot.ai",
                "full_name": "Alex Rivera",
                "role": "student",
                "organization_id": 1, # Stanford
                "department_name": "Computer Science",
                "education": "Computer Science Junior",
                "experience": "Junior (3rd Year)",
                "weekly_hours": 10.0,
                "current_role_id": 1,
                "resume_text": "CS junior with coursework in Python, relational databases, data structures. Built simple HTML/CSS pages and Git collaboration."
            },
            {
                "email": "admin.stanford@skillpilot.ai",
                "full_name": "Dr. Sarah Jenkins",
                "role": "university_admin",
                "organization_id": 1, # Stanford
                "department_name": "Academic Administration",
                "education": "Ph.D. in Computer Science",
                "experience": "Dean of Undergraduate Studies",
                "weekly_hours": 40.0,
                "current_role_id": 1,
                "resume_text": "University administrator tracking engineering student readiness and curriculum alignment."
            },
            {
                "email": "marcus@skillpilot.ai",
                "full_name": "Marcus Chen",
                "role": "employee",
                "organization_id": 2, # NexGen Enterprises
                "department_name": "Cloud Platform Team",
                "education": "B.S. in Software Engineering",
                "experience": "Associate Cloud Engineer (1.5 years)",
                "weekly_hours": 8.0,
                "current_role_id": 7, # Cloud Engineer
                "resume_text": "DevOps practitioner working with Docker, Linux systems, Git workflows, and AWS primitives."
            },
            {
                "email": "admin.nexgen@skillpilot.ai",
                "full_name": "Elena Rostova",
                "role": "organization_admin",
                "organization_id": 2, # NexGen Enterprises
                "department_name": "Talent & Engineering Operations",
                "education": "M.S. in Organizational Leadership",
                "experience": "VP of Engineering Enablement",
                "weekly_hours": 40.0,
                "current_role_id": 1,
                "resume_text": "Enterprise administrator supervising technical talent development and upskilling programs."
            },
            # Cohort members for Stanford
            {
                "email": "priya.sharma@stanford.edu",
                "full_name": "Priya Sharma",
                "role": "student",
                "organization_id": 1,
                "department_name": "Computer Science",
                "education": "CS Sophomore",
                "experience": "Sophomore (2nd Year)",
                "weekly_hours": 12.0,
                "current_role_id": 2, # Data Scientist
                "resume_text": "Mathematics and Python student focusing on data analysis and statistics."
            },
            {
                "email": "david.kim@stanford.edu",
                "full_name": "David Kim",
                "role": "student",
                "organization_id": 1,
                "department_name": "Electrical Engineering",
                "education": "EE Senior",
                "experience": "Senior (4th Year)",
                "weekly_hours": 10.0,
                "current_role_id": 3, # AI/ML Engineer
                "resume_text": "Signal processing, embedded systems, and deep learning algorithms."
            },
            # Cohort members for NexGen
            {
                "email": "jordan.taylor@nexgen.io",
                "full_name": "Jordan Taylor",
                "role": "employee",
                "organization_id": 2,
                "department_name": "Cloud Platform Team",
                "education": "B.S. Computer Systems",
                "experience": "Senior Infrastructure Developer",
                "weekly_hours": 6.0,
                "current_role_id": 7, # Cloud Engineer
                "resume_text": "Kubernetes, Terraform, AWS solutions architect certified."
            },
            {
                "email": "maya.patel@nexgen.io",
                "full_name": "Maya Patel",
                "role": "employee",
                "organization_id": 2,
                "department_name": "Data Intelligence Team",
                "education": "M.S. Data Analytics",
                "experience": "Data Engineer (2 years)",
                "weekly_hours": 8.0,
                "current_role_id": 8, # Data Analyst
                "resume_text": "PostgreSQL, BigQuery, ETL pipelines, and Tableau reporting."
            }
        ]

        seeded_users = {}
        for ud in users_seed:
            u_obj = db.query(User).filter(User.email == ud["email"]).first()
            if not u_obj:
                u_obj = User(
                    email=ud["email"],
                    hashed_password=get_password_hash("password123"),
                    full_name=ud["full_name"],
                    role=ud["role"],
                    organization_id=ud["organization_id"],
                    department_name=ud["department_name"],
                    education=ud["education"],
                    academic_year_or_experience=ud["experience"],
                    weekly_hours=ud["weekly_hours"],
                    target_date="10 weeks",
                    current_role_id=ud["current_role_id"],
                    resume_text=ud["resume_text"],
                    last_active_at=datetime.utcnow()
                )
                db.add(u_obj)
                db.flush()
            seeded_users[ud["email"]] = u_obj
        db.commit()

        # 8. Setup Alex Rivera's Initial State (Student baseline)
        alex = seeded_users["alex@skillpilot.ai"]
        alex_skills = [
            {"skill_id": 1, "self": 3.0, "resume": 3.0, "assessment": 3.5, "practical": 3.0}, # Python (Fully validated)
            {"skill_id": 6, "self": 3.0, "resume": 2.5, "assessment": 3.0, "practical": 0.0}, # SQL (Assessment validated)
            {"skill_id": 3, "self": 2.0, "resume": 2.0, "assessment": 2.5, "practical": 0.0}, # HTML & CSS
            {"skill_id": 2, "self": 3.0, "resume": 1.0, "assessment": 1.0, "practical": 1.5}, # JavaScript (Calibration alert: self 3.0 vs test 1.0)
            {"skill_id": 4, "self": 1.0, "resume": 0.0, "assessment": 0.0, "practical": 0.0}, # React
            {"skill_id": 5, "self": 0.0, "resume": 0.0, "assessment": 0.0, "practical": 0.0}, # Node.js
            {"skill_id": 7, "self": 2.0, "resume": 2.0, "assessment": 2.0, "practical": 2.0}, # Git
            {"skill_id": 8, "self": 1.0, "resume": 0.0, "assessment": 0.0, "practical": 0.0}, # REST APIs
        ]

        for ask in alex_skills:
            existing = db.query(UserSkill).filter(UserSkill.user_id == alex.id, UserSkill.skill_id == ask["skill_id"]).first()
            synth = calculate_evidence_based_proficiency(
                self_reported_level=ask["self"],
                resume_level=ask["resume"],
                assessment_level=ask["assessment"],
                practical_level=ask["practical"]
            )
            if not existing:
                us = UserSkill(
                    user_id=alex.id,
                    skill_id=ask["skill_id"],
                    proficiency_level=synth["synthesized_proficiency"],
                    self_reported_level=ask["self"],
                    resume_level=ask["resume"],
                    assessment_level=ask["assessment"],
                    practical_level=ask["practical"],
                    confidence_score=synth["confidence_score"],
                    evidence_sources=",".join(synth["evidence_sources"]),
                    validation_status=synth["validation_status"],
                    discrepancy_note=synth["discrepancy_note"],
                    source="onboarding"
                )
                db.add(us)
        db.commit()

        # Seed other learners' skills for rich aggregate reporting
        other_learners = [
            seeded_users["priya.sharma@stanford.edu"],
            seeded_users["david.kim@stanford.edu"],
            seeded_users["marcus@skillpilot.ai"],
            seeded_users["jordan.taylor@nexgen.io"],
            seeded_users["maya.patel@nexgen.io"]
        ]
        for ol in other_learners:
            existing_count = db.query(UserSkill).filter(UserSkill.user_id == ol.id).count()
            if existing_count == 0:
                for sid in [1, 2, 6, 7, 8, 9, 10, 12]:
                    base_val = 3.5 if sid in [1, 6, 7] else (1.5 if sid in [2, 4] else 2.5)
                    synth = calculate_evidence_based_proficiency(self_reported_level=base_val, assessment_level=base_val)
                    db.add(UserSkill(
                        user_id=ol.id,
                        skill_id=sid,
                        proficiency_level=synth["synthesized_proficiency"],
                        self_reported_level=base_val,
                        assessment_level=base_val,
                        confidence_score=0.75,
                        validation_status="assessment_validated",
                        evidence_sources="self_reported,assessment"
                    ))
        db.commit()

        # Seed Roadmap v1 for Alex Rivera
        alex_existing_rm = db.query(Roadmap).filter(Roadmap.user_id == alex.id).first()
        if not alex_existing_rm:
            from backend.agents.orchestrator import execute_onboarding_pipeline
            raw_skills_input = [{"skill_id": ask["skill_id"], "proficiency": ask["self"]} for ask in alex_skills]
            pipeline_res = execute_onboarding_pipeline({
                "user_id": alex.id,
                "user_name": alex.full_name,
                "education": alex.education,
                "weekly_hours": alex.weekly_hours,
                "target_date": alex.target_date,
                "preferred_career_role_id": alex.current_role_id,
                "raw_skills": raw_skills_input
            })

            roadmap_v1 = Roadmap(
                user_id=alex.id,
                role_id=1,
                version=1,
                title="Full Stack Developer Mastery (v1)",
                status="active",
                trigger_event="initial_generation",
                reason_for_adaptation="Initial personalized roadmap generated from onboarding profile and skill taxonomy.",
                total_weeks=pipeline_res.get("total_weeks", 10)
            )
            db.add(roadmap_v1)
            db.flush()

            module_resources = pipeline_res.get("module_resources", {})
            for m in pipeline_res.get("roadmap_modules", []):
                item = RoadmapItem(
                    roadmap_id=roadmap_v1.id,
                    week_number=m["week_number"],
                    sequence_order=m["sequence_order"],
                    title=m["title"],
                    skill_id=m.get("skill_id"),
                    learning_objectives=json.dumps(m["learning_objectives"]),
                    duration_hours=m["duration_hours"],
                    practical_exercise=m.get("practical_exercise"),
                    practical_rubric=json.dumps({
                        "correctness": "40% - Syntax correctness and execution logic",
                        "completeness": "30% - Full coverage of task requirements",
                        "code_quality": "30% - Proper code structure, comments, and modern patterns"
                    }),
                    completion_criteria=m.get("completion_criteria"),
                    status="in_progress" if m["week_number"] == 1 else "not_started",
                    is_remedial=m.get("is_remedial", False),
                    explanation_gap=f"Addresses key competencies required for Full Stack Developer role.",
                    explanation_prereq=f"Foundational requirement before advancing to modern framework engineering.",
                    explanation_outcome=f"Attain verifiable coding proficiency and complete the practical milestone.",
                    explanation_career=f"Essential core qualification for Full Stack Developer career track."
                )
                db.add(item)
                db.flush()

                key = f"mod_{m['week_number']}_{m['sequence_order']}"
                for r_info in module_resources.get(key, []):
                    res_match = db.query(Resource).filter(Resource.url == r_info["url"]).first()
                    if res_match:
                        r_assoc = RoadmapItemResource(
                            roadmap_item_id=item.id,
                            resource_id=res_match.id,
                            suitability_reason=r_info.get("suitability_reason"),
                            explanation_learner_match=f"Beginner-friendly curated tutorial aligned with your current proficiency level.",
                            expected_outcome=f"Learn and apply core syntax patterns through interactive coding exercises."
                        )
                        db.add(r_assoc)

            # Persist initial agent logs
            for log in pipeline_res.get("agent_logs", []):
                db_log = AgentLog(
                    user_id=alex.id,
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

            # Seed Initial Notifications for Alex
            notifications_seed = [
                {
                    "title": "🗺️ Roadmap v1 Generated",
                    "message": "Welcome to SkillPilot! Your 10-week Full Stack Developer roadmap is ready. Start with Week 1!",
                    "notification_type": "roadmap_update",
                    "link_url": "/roadmap",
                    "is_read": False
                },
                {
                    "title": "⚠️ Skill Calibration Notice",
                    "message": "Evidence discrepancy detected in JavaScript: Self-rated 3.0/5.0 vs Diagnostic assessment. Take a refresher exercise to calibrate.",
                    "notification_type": "mentor_alert",
                    "link_url": "/skills",
                    "is_read": False
                },
                {
                    "title": "💡 AI Mentor Tip",
                    "message": "Focus on the Event Loop and Asynchronous Promises this week. They are essential prerequisites for React!",
                    "notification_type": "info",
                    "link_url": "/mentor",
                    "is_read": True
                }
            ]
            for nd in notifications_seed:
                db.add(Notification(
                    user_id=alex.id,
                    title=nd["title"],
                    message=nd["message"],
                    notification_type=nd["notification_type"],
                    link_url=nd["link_url"],
                    is_read=nd["is_read"]
                ))

            # Initial Progress Record
            prog = ProgressRecord(
                user_id=alex.id,
                event_type="onboarding_completed",
                details_json=json.dumps({"role": "Full Stack Developer", "version": 1})
            )
            db.add(prog)
            db.commit()

        print("SkillPilot database fully seeded with Organizations, Roles, Prerequisites, Evidence-Based Skills & Multi-Tenant Users!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
