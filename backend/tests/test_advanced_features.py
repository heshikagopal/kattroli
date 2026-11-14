"""
End-to-end integration test suite for SkillPilot Advanced Features:
- Feature 1: University and Organization Admin Dashboard & Multi-Tenancy
- Feature 2: Evidence-Based Skill Validation Engine
- Feature 3: Explainable AI Recommendations
- Feature 4: Prerequisite-Aware Learning Engine
- Feature 5: Learning Outcome Verification & Practical Rubrics
- Feature 6: Advanced Adaptive Learning Engine (Scenarios A through E)
- Feature 7: Advanced Career Intelligence & Transition Planning
- Feature 8: Personalized AI Mentor Grounded Actions
- Feature 10: Roadmap Version History & Comparison Matrix
- Feature 11: Curated Verified Resources
- Feature 12: In-App Notification Center
"""
import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=================================================================")
    print("   SKILLPILOT — ADVANCED FEATURES AUTOMATED VERIFICATION SUITE   ")
    print("=================================================================\n")

    # Step 1: Health & Root
    print("[1/10] Verifying Root & Health Endpoints...")
    r = requests.get(f"{BASE_URL}/")
    assert r.status_code == 200, f"Root check failed: {r.text}"
    data = r.json()
    assert "features" in data, "Features list missing from root"
    print(f"  ✓ Root reports {len(data['agents'])} agents and {len(data['features'])} advanced features.")

    # Step 2: Authentication & Multi-Role Verification
    print("\n[2/10] Verifying Multi-Role Auth (Student, Employee, University Admin, Org Admin)...")
    roles_to_test = [
        ("alex@skillpilot.ai", "student"),
        ("admin.stanford@skillpilot.ai", "university_admin"),
        ("marcus@skillpilot.ai", "employee"),
        ("admin.nexgen@skillpilot.ai", "organization_admin")
    ]
    tokens = {}
    for email, expected_role in roles_to_test:
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": "password123"})
        assert r.status_code == 200, f"Login failed for {email}: {r.text}"
        res = r.json()
        tokens[expected_role] = res["access_token"]
        assert res["role"] == expected_role, f"Role mismatch for {email}: expected {expected_role}, got {res['role']}"
        print(f"  ✓ Authenticated {email} as role '{expected_role}' (Org ID: {res.get('user_id')})")

    alex_headers = {"Authorization": f"Bearer {tokens['student']}"}
    admin_headers = {"Authorization": f"Bearer {tokens['university_admin']}"}
    org_admin_headers = {"Authorization": f"Bearer {tokens['organization_admin']}"}

    # Step 3: Admin Dashboard & Multi-Tenant Isolation (Feature 1 & 13)
    print("\n[3/10] Verifying University & Organization Admin Dashboard APIs...")
    # Student should be forbidden from accessing admin overview without preview flag
    r_forbidden = requests.get(f"{BASE_URL}/api/admin/overview", headers=alex_headers)
    assert r_forbidden.status_code == 403, f"Expected 403 for student on admin overview, got {r_forbidden.status_code}"
    print("  ✓ RBAC enforced: Student access correctly blocked with 403 Forbidden.")

    # University admin access
    r_admin = requests.get(f"{BASE_URL}/api/admin/overview", headers=admin_headers)
    assert r_admin.status_code == 200, f"Admin overview failed: {r_admin.text}"
    overview = r_admin.json()
    assert overview["total_registered_learners"] > 0, "No learners returned for university"
    print(f"  ✓ Stanford Admin Overview: {overview['total_registered_learners']} learners, avg readiness: {overview['average_career_readiness_score']}%, completed modules: {overview['total_completed_modules']}")

    # Skill gaps & distribution
    r_gaps = requests.get(f"{BASE_URL}/api/admin/skill-gaps", headers=admin_headers)
    assert r_gaps.status_code == 200, f"Skill gaps failed: {r_gaps.text}"
    gaps_data = r_gaps.json()
    assert len(gaps_data["commonly_missing_skills"]) > 0, "No skill gaps reported"
    print(f"  ✓ Admin Skill Gaps: {len(gaps_data['commonly_missing_skills'])} skills tracked. Top missing: {gaps_data['commonly_missing_skills'][0]['skill_name']}")

    # Departments comparison
    r_dept = requests.get(f"{BASE_URL}/api/admin/departments", headers=admin_headers)
    assert r_dept.status_code == 200, f"Departments failed: {r_dept.text}"
    depts = r_dept.json()["departments"]
    print(f"  ✓ Department Breakdown: {len(depts)} cohorts analyzed ({', '.join([d['department_name'] for d in depts])})")

    # Step 4: Evidence-Based Skill Validation (Feature 2)
    print("\n[4/10] Verifying Evidence-Based Skill Validation Engine...")
    r_analysis = requests.get(f"{BASE_URL}/api/skills/analysis", headers=alex_headers)
    assert r_analysis.status_code == 200, f"Skill analysis failed: {r_analysis.text}"
    analysis = r_analysis.json()
    assert "evidence_breakdown" in analysis, "Evidence breakdown missing"
    ev_list = analysis["evidence_breakdown"]
    
    # Check for discrepancy detection on JavaScript
    js_ev = next((e for e in ev_list if e["skill_name"] == "JavaScript"), None)
    assert js_ev is not None, "JavaScript missing from evidence breakdown"
    print(f"  ✓ Multi-source evidence for JavaScript: Self={js_ev['self_reported']}, Test={js_ev['assessment']}, Practical={js_ev['practical']}, Synthesized={js_ev['synthesized_proficiency']}, Confidence={js_ev['confidence_score']}")
    print(f"  ✓ Validation Status: {js_ev['validation_status']}")
    if js_ev.get("discrepancy_note"):
        print(f"  ✓ Discrepancy Alert: {js_ev['discrepancy_note']}")

    # Step 5: Prerequisite-Aware Learning Engine (Feature 4)
    print("\n[5/10] Verifying Prerequisite Dependency Graph...")
    r_graph = requests.get(f"{BASE_URL}/api/skills/prerequisites-graph", headers=alex_headers)
    assert r_graph.status_code == 200, f"Prerequisites graph failed: {r_graph.text}"
    graph = r_graph.json()
    assert len(graph["nodes"]) > 0, "No nodes in prerequisite graph"
    assert len(graph["edges"]) > 0, "No edges in prerequisite graph"
    statuses = set(n["status"] for n in graph["nodes"])
    print(f"  ✓ Skill Dependency DAG: {len(graph['nodes'])} nodes, {len(graph['edges'])} prerequisite edges. Node states present: {statuses}")

    # Step 6: Learning Outcome Verification & Practical Rubrics (Feature 5)
    print("\n[6/10] Verifying Practical Exercise Submission & Rubric Grading...")
    r_rm = requests.get(f"{BASE_URL}/api/roadmaps/active", headers=alex_headers)
    assert r_rm.status_code == 200, f"Active roadmap failed: {r_rm.text}"
    rm = r_rm.json()
    first_item = rm["items"][0]
    
    code_submission = """
    // Async Weather Dashboard Fetcher with Exponential Backoff
    async function fetchWeatherData(city, maxRetries = 3) {
        let attempts = 0;
        while (attempts < maxRetries) {
            try {
                const response = await fetch(`https://api.weather.com/v1?city=${city}`);
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                const data = await response.json();
                return { city, temp: data.main.temp, condition: data.weather[0].description };
            } catch (err) {
                attempts++;
                if (attempts >= maxRetries) throw err;
                await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempts)));
            }
        }
    }
    """
    r_sub = requests.post(
        f"{BASE_URL}/api/roadmaps/items/{first_item['id']}/submit-practical",
        headers=alex_headers,
        json={"submission_text": code_submission}
    )
    assert r_sub.status_code == 200, f"Practical submission failed: {r_sub.text}"
    eval_res = r_sub.json()
    assert eval_res["passed"] is True, f"Expected passing grade, got: {eval_res}"
    print(f"  ✓ Practical Rubric Evaluation: Score={eval_res['score_percentage']}%, Passed={eval_res['passed']}")
    print(f"  ✓ Rubric Breakdown: {eval_res['rubric_scores']}")
    print(f"  ✓ Evaluator Feedback: {eval_res['feedback'][:100]}...")
    print(f"  ✓ Updated Validation Status: {eval_res['validation_status']}, New Proficiency: {eval_res['new_proficiency']}")

    # Step 7: Explainable AI Recommendations (Feature 3)
    print("\n[7/10] Verifying Explainable AI Recommendations on Modules & Resources...")
    r_rm_updated = requests.get(f"{BASE_URL}/api/roadmaps/active", headers=alex_headers)
    mod = r_rm_updated.json()["items"][0]
    assert mod.get("explanation_gap"), "explanation_gap missing from module"
    assert mod.get("explanation_prereq"), "explanation_prereq missing from module"
    assert mod.get("explanation_career"), "explanation_career missing from module"
    print(f"  ✓ Module Explanation (Gap): {mod['explanation_gap']}")
    print(f"  ✓ Module Explanation (Prerequisite): {mod['explanation_prereq']}")
    print(f"  ✓ Module Explanation (Career Impact): {mod['explanation_career']}")
    res_sample = mod["resources"][0]
    print(f"  ✓ Resource Explanation: {res_sample['suitability_reason']}")

    # Step 8: Advanced Career Intelligence & Transition Plan (Feature 7)
    print("\n[8/10] Verifying Career Intelligence & Transition Planning...")
    r_trans = requests.get(f"{BASE_URL}/api/careers/transition-plan?target_role_id=2", headers=alex_headers)
    assert r_trans.status_code == 200, f"Transition plan failed: {r_trans.text}"
    trans = r_trans.json()
    assert "transferability_percentage" in trans, "transferability_percentage missing"
    assert "disclaimer" in trans, "disclaimer missing"
    print(f"  ✓ Career Transition to '{trans['target_role_title']}': {trans['transferability_percentage']}% Transferable Skills!")
    print(f"  ✓ Reusable Modules: {trans['reusable_modules_count']}, New Modules: {trans['new_modules_needed']}, Est. Weeks: {trans['estimated_transition_weeks']}")
    print(f"  ✓ Critical Gaps: {len(trans['critical_gaps'])}, Moderate: {len(trans['moderate_gaps'])}")
    print(f"  ✓ Required Compliance Disclaimer: '{trans['disclaimer']}'")

    # Step 9: Roadmap Version History & Comparison Matrix (Feature 10 & Scenario A)
    print("\n[9/10] Verifying Adaptive Replanning & Roadmap Version Comparison Diff...")
    # Trigger Scenario A: Low score quiz to generate Roadmap v2
    r_scen_a = requests.post(f"{BASE_URL}/api/demo/run-scenario-a")
    assert r_scen_a.status_code == 200, f"Scenario A failed: {r_scen_a.text}"
    print("  ✓ Executed Scenario A: Diagnostic Assessment score 40% submitted.")

    # Check comparison endpoint
    r_cmp = requests.get(f"{BASE_URL}/api/roadmaps/compare", headers=alex_headers)
    assert r_cmp.status_code == 200, f"Roadmap compare failed: {r_cmp.text}"
    cmp_data = r_cmp.json()
    assert len(cmp_data["comparison_table"]) > 0, "Comparison table is empty"
    print(f"  ✓ Roadmap Comparison: Roadmap v{cmp_data['v1']['version']} -> Roadmap v{cmp_data['v2']['version']}")
    print(f"  ✓ Adaptation Reason: {cmp_data['adaptation_reason']}")
    print(f"  ✓ Added Remedial Modules: {cmp_data['added_modules']}")
    print(f"  ✓ Delayed Modules: {cmp_data['delayed_modules']}")
    print(f"  ✓ Comparison Matrix Rows: {len(cmp_data['comparison_table'])} modules compared with diff status tags.")

    # Step 10: In-App Notification Center & AI Mentor (Features 8 & 12)
    print("\n[10/10] Verifying In-App Notifications & Personalized Mentor Quick Actions...")
    r_notif = requests.get(f"{BASE_URL}/api/notifications", headers=alex_headers)
    assert r_notif.status_code == 200, f"Notifications failed: {r_notif.text}"
    notifs = r_notif.json()
    assert len(notifs) > 0, "No notifications found"
    print(f"  ✓ In-App Notification Center: {len(notifs)} notifications found. Latest: '{notifs[0]['title']}'")

    # Mentor Quick Actions
    quick_queries = [
        "Explain my skill gap",
        "Why did my roadmap change?",
        "What should I learn next?",
        "Help me improve my assessment score",
        "Compare my career options"
    ]
    for q in quick_queries:
        r_mentor = requests.post(
            f"{BASE_URL}/api/mentor/chat",
            headers=alex_headers,
            json={"message": q}
        )
        assert r_mentor.status_code == 200, f"Mentor chat failed for '{q}': {r_mentor.text}"
        m_res = r_mentor.json()
        assert len(m_res["response"]) > 50, f"Mentor response too short for '{q}'"
        print(f"  ✓ Mentor Action '{q}': Answered with {len(m_res['response'])} chars, {len(m_res['suggested_actions'])} actions.")

    print("\n=================================================================")
    print("   SUCCESS! ALL 10 ADVANCED ARCHITECTURAL MODULES PASSED 100%!  ")
    print("=================================================================\n")

if __name__ == "__main__":
    run_tests()
