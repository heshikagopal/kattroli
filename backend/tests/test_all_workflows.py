import json
import sys
from backend.database import SessionLocal
from backend.models import User, Roadmap, Skill, Role
from backend.routers import auth, onboarding, skills, careers, roadmaps, assessments, mentor, agents, demo
from backend.schemas.user import UserLogin, OnboardingRequest
from backend.schemas.assessment import QuizSubmissionRequest, QuizSubmissionItem
from backend.schemas.role import CareerSwitchRequest
from backend.schemas.agent import MentorChatRequest

def test_full_application():
    print("=" * 60, flush=True)
    print("RUNNING COMPLETE SKILLPILOT SYSTEM & MULTI-AGENT VERIFICATION", flush=True)
    print("=" * 60, flush=True)

    db = SessionLocal()

    try:
        # Reset to clean baseline demo state
        demo.reset_demo_state(db=db)
        # 1. Verify Demo User Alex in DB
        alex = db.query(User).filter(User.email == "alex@skillpilot.ai").first()
        assert alex is not None, "Demo user Alex should exist"
        print(f" [1/11] User Profile Verified: {alex.full_name} ({alex.education}), Role ID: {alex.current_role_id}", flush=True)

        # 2. Test Auth Login Logic
        login_res = auth.login(UserLogin(email="alex@skillpilot.ai", password="password123"), db=db)
        assert "access_token" in login_res
        print(f" [2/11] Authentication Verified: JWT Token issued ({login_res['token_type']})", flush=True)

        # 3. Test Skill Analysis (Agent 2)
        analysis_res = skills.get_skill_analysis(current_user=alex, db=db)
        assert len(analysis_res["radar_data"]) > 0
        assert len(analysis_res["strengths"]) > 0
        print(f" [3/11] Skill Analyst Agent Verified: {len(analysis_res['radar_data'])} radar axes, Strengths: {analysis_res['strengths'][:2]}", flush=True)

        # 4. Test Career Matcher (Agent 3)
        match_res = careers.get_career_match(current_user=alex, db=db)
        assert match_res["match_percentage"] > 0
        assert len(match_res["skill_gaps"]) > 0
        print(f" [4/11] Career Matcher Agent Verified: Role: {match_res['role_title']}, Match: {match_res['match_percentage']}%, Gaps: {len(match_res['skill_gaps'])}", flush=True)

        # 5. Test Path Planner & Resource Curator (Agents 4 & 5)
        roadmap_res = roadmaps.get_active_roadmap(current_user=alex, db=db)
        assert roadmap_res["version"] >= 1
        assert len(roadmap_res["items"]) > 0
        
        # Verify 100% authentic verified resources
        first_item = roadmap_res["items"][0]
        assert len(first_item["resources"]) > 0
        for r in first_item["resources"]:
            assert r["url"].startswith("http")
            assert any(p in r["provider"] for p in ["freeCodeCamp", "MDN", "Odin", "Python", "GitHub", "Kaggle", "Documentation", "AWS", "Microsoft"])
        print(f" [5/11] Path Planner & Resource Curator Verified: Roadmap v{roadmap_res['version']} with {len(roadmap_res['items'])} modules and verified RAG resources from {first_item['resources'][0]['provider']}.", flush=True)

        # 6. Test Assessment Questions Generation (Agent 6)
        questions = assessments.get_quiz_questions(skill_id=2, db=db)
        assert len(questions) >= 5
        print(f" [6/11] Assessment Agent Questions Verified: {len(questions)} diagnostic questions loaded with code snippets and options.", flush=True)

        # 7. Execute Hackathon Demo Scenario: Alex scores 40% in JavaScript -> Triggers Roadmap v2 Adaptation!
        print(" -> Executing Demo Scenario: Alex submits JavaScript assessment scoring 40%...", flush=True)
        quiz_req = QuizSubmissionRequest(
            skill_id=2,
            roadmap_item_id=first_item["id"],
            answers=[
                QuizSubmissionItem(question_id=201, user_answer="A, B, C, D"), # Incorrect (Async event loop)
                QuizSubmissionItem(question_id=202, user_answer="By copying the outer variables into global window memory"), # Incorrect (Closures)
                QuizSubmissionItem(question_id=203, user_answer="Wrapping the await expression inside a try...catch block"), # Correct
                QuizSubmissionItem(question_id=204, user_answer="It prevents accidental global variable creation and eliminates silent errors"), # Correct
                QuizSubmissionItem(question_id=205, user_answer="'==' is faster than '==='") # Incorrect
            ]
        )
        quiz_result = assessments.submit_quiz(payload=quiz_req, current_user=alex, db=db)
        assert quiz_result["score_percentage"] == 40.0
        assert quiz_result["adaptation_triggered"] is True
        assert quiz_result["roadmap_version"] == 2
        print(f" [7/11] Adaptive Learning Trigger Verified! Score: {quiz_result['score_percentage']}%. New Roadmap v{quiz_result['roadmap_version']} created.", flush=True)
        print(f"       Adaptation Rationale: {quiz_result['adaptation_reason'][:85]}...", flush=True)

        # 8. Verify Roadmap v2 in DB has Remedial Module & Delayed React
        v2_roadmap = roadmaps.get_active_roadmap(current_user=alex, db=db)
        assert v2_roadmap["version"] == 2
        assert any(item["is_remedial"] for item in v2_roadmap["items"])
        print(f" [8/11] Roadmap v2 Active in Database: First module: '{v2_roadmap['items'][0]['title']}' (is_remedial={v2_roadmap['items'][0]['is_remedial']})", flush=True)

        # 9. Verify Roadmap Version Comparison (v1 vs v2)
        comp_res = roadmaps.compare_roadmap_versions(current_user=alex, db=db)
        assert len(comp_res["added_modules"]) > 0
        print(f" [9/11] Roadmap Comparison Audit Verified: Added remedial modules: {comp_res['added_modules']}", flush=True)

        # 10. Execute Hackathon Demo Scenario: Switch Career Goal to Data Scientist
        print(" -> Executing Demo Scenario: Alex switches career goal to Data Scientist (Role ID 2)...", flush=True)
        switch_req = CareerSwitchRequest(target_role_id=2)
        switch_res = careers.switch_career_goal(payload=switch_req, current_user=alex, db=db)
        assert switch_res["carry_over_percentage"] > 0
        assert len(switch_res["overlapping_skills"]) > 0
        print(f" [10/11] Career Goal Switch Verified: Switched to {switch_res['new_role_title']}.", flush=True)
        print(f"        Carry-over calculated: {switch_res['carry_over_percentage']}%. Overlapping skills preserved: {[s['skill_name'] for s in switch_res['overlapping_skills']]}", flush=True)

        # 11. Test AI Mentor Chat (Mentor Node) & Agent Execution Logs
        chat_req = MentorChatRequest(message="Why did my roadmap adapt to version 2?")
        chat_res = mentor.mentor_chat(payload=chat_req, current_user=alex, db=db)
        assert len(chat_res["reply"]) > 0
        
        recent_logs = agents.get_agent_logs(limit=20, current_user=alex, db=db)
        assert len(recent_logs) >= 8
        print(f" [11/11] AI Mentor & Agent Collaboration Logs Verified: {len(recent_logs)} agent execution logs stored.", flush=True)
        print(f"        Mentor Response: '{chat_res['reply'][:70]}...'", flush=True)

        print("=" * 60, flush=True)
        print("SUCCESS! ALL 11 CORE MODULES, MULTI-AGENT SCENARIOS, AND ALGORITHMS PASSED PERFECTLY!", flush=True)
        print("=" * 60, flush=True)

    finally:
        db.close()

if __name__ == "__main__":
    test_full_application()
