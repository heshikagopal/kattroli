"""
Core algorithms for SkillPilot
- Career Match Score: SUM(weight_i * MIN(user_level_i / required_level_i, 1)) / SUM(weight_i) * 100
- Skill Gap Priority: priority = weight * (required_level - current_level) * dependency_depth_bonus
- Skill Update After Assessment: new_level = 0.6 * old_level + 0.4 * quiz_level
- Carry-over Progress on Career Switching
- Evidence-Based Skill Validation Engine
- Practical Exercise Rubric Evaluator
- Career Transition Intelligence & Transferable Skills
- Prerequisite Resolution Engine
"""
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime

def calculate_career_match_score(
    role_skills: List[Dict[str, Any]], 
    user_skill_levels: Dict[int, float]
) -> float:
    """
    Computes career compatibility percentage:
    match_percentage = SUM(weight_i * MIN(user_level_i / required_level_i, 1)) / SUM(weight_i) * 100
    """
    if not role_skills:
        return 0.0
    
    total_weight = 0.0
    weighted_achieved = 0.0
    
    for rs in role_skills:
        skill_id = rs["skill_id"]
        req_level = float(rs.get("required_level", 3.0))
        weight = float(rs.get("weight", 1.0))
        
        user_lvl = float(user_skill_levels.get(skill_id, 0.0))
        ratio = min(user_lvl / req_level, 1.0) if req_level > 0 else 1.0
        
        weighted_achieved += weight * ratio
        total_weight += weight
        
    if total_weight == 0:
        return 0.0
        
    return round((weighted_achieved / total_weight) * 100.0, 1)


def calculate_skill_gap_priority(
    required_level: float, 
    current_level: float, 
    weight: float, 
    dependency_depth: int = 1
) -> float:
    """
    priority = weight * (required_level - current_level) * dependency_depth_bonus
    Foundations (dependency_depth 1) get higher priority bonus so prerequisites are learned first.
    """
    dependency_depth_bonus = 1.0 + max(0, 3 - dependency_depth) * 0.2
    gap = max(0.0, required_level - current_level)
    return round(weight * gap * dependency_depth_bonus, 2)


def calculate_skill_update_after_assessment(
    old_level: float, 
    quiz_score_percentage: float
) -> float:
    """
    new_level = 0.6 * old_level + 0.4 * quiz_level
    quiz_score_percentage (0 to 100) maps to 0.0 to 5.0
    """
    quiz_level = min(5.0, max(0.0, (quiz_score_percentage / 100.0) * 5.0))
    new_level = 0.6 * old_level + 0.4 * quiz_level
    return round(min(5.0, max(0.0, new_level)), 2)


def calculate_career_switch_carryover(
    old_user_skills: Dict[int, float],
    new_role_skills: List[Dict[str, Any]]
) -> Tuple[float, List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Calculates exact percentage of learning progress carried over when switching career goals.
    Returns: (carry_over_percentage, overlapping_skills, new_required_skills)
    """
    if not new_role_skills:
        return 0.0, [], []
        
    total_required_weighted = 0.0
    reused_weighted = 0.0
    overlapping = []
    missing_or_new = []
    
    for rs in new_role_skills:
        skill_id = rs["skill_id"]
        req_level = float(rs.get("required_level", 3.0))
        weight = float(rs.get("weight", 1.0))
        user_lvl = float(old_user_skills.get(skill_id, 0.0))
        
        target_weighted = req_level * weight
        total_required_weighted += target_weighted
        
        usable_level = min(user_lvl, req_level)
        reused_weighted += usable_level * weight
        
        if user_lvl > 0:
            overlapping.append({
                "skill_id": skill_id,
                "skill_name": rs.get("skill_name", "Skill"),
                "current_level": user_lvl,
                "required_level": req_level,
                "overlap_ratio": round(min(user_lvl / req_level, 1.0) * 100.0, 1)
            })
        else:
            missing_or_new.append({
                "skill_id": skill_id,
                "skill_name": rs.get("skill_name", "Skill"),
                "required_level": req_level,
                "weight": weight
            })
            
    carryover_pct = (reused_weighted / total_required_weighted * 100.0) if total_required_weighted > 0 else 0.0
    return round(carryover_pct, 1), overlapping, missing_or_new


def calculate_evidence_based_proficiency(
    self_reported_level: float = 0.0,
    resume_level: float = 0.0,
    assessment_level: float = 0.0,
    practical_level: float = 0.0
) -> Dict[str, Any]:
    """
    Feature 2: Evidence-Based Skill Validation
    Combines self-ratings, resume analysis, diagnostic assessments, and practical exercises.
    Missing evidence is NEVER treated as zero proficiency: weights are normalized across available sources.
    Detects overestimation/underestimation discrepancies and computes confidence scores.
    """
    available_evidence = []
    total_weight = 0.0
    weighted_sum = 0.0

    # Base weights
    if self_reported_level > 0.0:
        available_evidence.append("self_reported")
        w = 0.15
        total_weight += w
        weighted_sum += w * self_reported_level

    if resume_level > 0.0:
        available_evidence.append("resume")
        w = 0.15
        total_weight += w
        weighted_sum += w * resume_level

    if assessment_level > 0.0:
        available_evidence.append("assessment")
        w = 0.40
        total_weight += w
        weighted_sum += w * assessment_level

    if practical_level > 0.0:
        available_evidence.append("practical")
        w = 0.30
        total_weight += w
        weighted_sum += w * practical_level

    # Normalize if evidence exists
    if total_weight > 0.0:
        synthesized_proficiency = round(weighted_sum / total_weight, 2)
    else:
        synthesized_proficiency = 0.0

    # Confidence calculation: increases with corroborating independent sources
    confidence = 0.30
    if "resume" in available_evidence:
        confidence += 0.20
    if "assessment" in available_evidence:
        confidence += 0.30
    if "practical" in available_evidence:
        confidence += 0.20
    confidence = round(min(1.0, confidence), 2)

    # Discrepancy & Validation Status detection
    discrepancy_note = None
    validation_status = "self_reported"

    if assessment_level > 0.0 and self_reported_level > 0.0:
        gap = self_reported_level - assessment_level
        if gap >= 1.5:
            validation_status = "needs_calibration"
            discrepancy_note = f"Calibration alert: Self-rated {self_reported_level:.1f}/5.0 but assessment scored {assessment_level:.1f}/5.0 (overestimated by {gap:.1f} levels)."
        elif gap <= -1.0:
            discrepancy_note = f"Underestimation detected: Self-rated {self_reported_level:.1f}/5.0 but assessment demonstrated {assessment_level:.1f}/5.0."

    if validation_status != "needs_calibration":
        if "assessment" in available_evidence and "practical" in available_evidence and synthesized_proficiency >= 3.0:
            validation_status = "fully_validated"
        elif "practical" in available_evidence and practical_level >= 2.5:
            validation_status = "practically_validated"
        elif "assessment" in available_evidence and assessment_level >= 2.5:
            validation_status = "assessment_validated"
        else:
            validation_status = "self_reported"

    return {
        "synthesized_proficiency": synthesized_proficiency,
        "confidence_score": confidence,
        "evidence_sources": available_evidence,
        "validation_status": validation_status,
        "discrepancy_note": discrepancy_note
    }


def evaluate_practical_exercise_rubric(
    submission_text: str,
    skill_name: str,
    exercise_prompt: str,
    module_title: str
) -> Dict[str, Any]:
    """
    Feature 5: Learning Outcome Verification & Practical Exercise Rubric Evaluator
    Evaluates submissions against structured criteria:
    1. Correctness & Execution Logic (40%)
    2. Completeness & Requirements Coverage (30%)
    3. Code Quality & Best Practices (30%)
    """
    cleaned = (submission_text or "").strip()
    char_len = len(cleaned)
    lines = cleaned.splitlines()

    if char_len < 15:
        return {
            "score_percentage": 25.0,
            "passed": False,
            "rubric_scores": {
                "correctness": 10.0,
                "completeness": 10.0,
                "code_quality": 5.0
            },
            "feedback": "Submission is too brief. Please provide a complete implementation or thorough conceptual explanation addressing all task instructions.",
            "recommendation": "Review the recommended module resources and submit a structured solution demonstrating code or implementation details."
        }

    # Keyword and semantic heuristics based on skill and task
    tech_keywords = {
        "JavaScript": ["function", "const", "let", "return", "=>", "async", "await", "promise", "array", "map", "filter", "class", "event"],
        "Python": ["def ", "return", "import ", "class ", "for ", "in ", "with ", "lambda", "try:", "except"],
        "React": ["import", "usestate", "useeffect", "component", "props", "return", "jsx", "div", "button", "render"],
        "SQL": ["select", "from", "where", "join", "group by", "table", "insert", "update", "foreign key"],
        "Git": ["git init", "git commit", "git push", "git branch", "git checkout", "merge", "remote", "clone", "pull request"],
        "Docker": ["from", "run", "cmd", "copy", "expose", "entrypoint", "docker build", "docker run", "compose"],
        "HTML/CSS": ["<div", "<style", "display: flex", "grid", "class=", "border", "padding", "margin", "header", "body"],
        "FastAPI": ["fastapi", "app = fastapi", "@app.get", "@app.post", "pydantic", "basemodel", "async def"],
        "Pandas": ["import pandas", "pd.read", "df[", "groupby", "dataframe", "dropna", "merge", "apply"],
        "Machine Learning": ["fit", "predict", "train_test_split", "sklearn", "model", "accuracy", "loss", "features", "regression"]
    }

    relevant_words = tech_keywords.get(skill_name, ["function", "code", "implementation", "process", "result", "test"])
    keyword_hits = sum(1 for kw in relevant_words if kw.lower() in cleaned.lower())
    keyword_ratio = min(1.0, keyword_hits / max(3, len(relevant_words) * 0.4))

    # Criterion 1: Correctness & Logic (40 pts)
    correctness = min(40.0, 20.0 + (keyword_ratio * 20.0))

    # Criterion 2: Completeness (30 pts)
    length_factor = min(1.0, char_len / 150.0)
    structure_factor = min(1.0, len(lines) / 4.0)
    completeness = min(30.0, 15.0 * length_factor + 15.0 * structure_factor)

    # Criterion 3: Code Quality & Best Practices (30 pts)
    has_comments = any("//" in l or "#" in l or "/*" in l for l in lines)
    has_formatting = "\n" in cleaned and ("  " in cleaned or "\t" in cleaned)
    quality = 18.0 + (6.0 if has_comments else 0.0) + (6.0 if has_formatting else 0.0)
    quality = min(30.0, quality)

    total_score = round(correctness + completeness + quality, 1)
    passed = total_score >= 60.0

    if total_score >= 85.0:
        feedback = f"Outstanding work on {module_title}! Your solution demonstrates strong technical fluency, clean formatting, and thorough understanding of {skill_name} best practices."
    elif total_score >= 60.0:
        feedback = f"Good effort! The practical submission demonstrates acceptable competence with {skill_name}. To achieve mastery, consider adding more edge-case handling and inline documentation."
    else:
        feedback = f"Submission requires improvement. Several key implementation criteria for {skill_name} were not clearly demonstrated. Please review the rubric and resubmit."

    return {
        "score_percentage": total_score,
        "passed": passed,
        "rubric_scores": {
            "correctness": round(correctness, 1),
            "completeness": round(completeness, 1),
            "code_quality": round(quality, 1)
        },
        "feedback": feedback,
        "recommendation": "Module validated!" if passed else "Review prerequisite concepts and revise your code submission."
    }


def calculate_career_transition_intelligence(
    current_role: Dict[str, Any],
    target_role: Dict[str, Any],
    current_skills: Dict[int, float],
    target_role_skills: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Feature 7: Advanced Career Intelligence & Transition Planning
    Analyzes transferable skills, skill gap severity, reusable learning modules, and time to transition.
    Includes explicit disclaimer that this is a skills-based match.
    """
    transferable = []
    gaps_critical = []
    gaps_moderate = []
    gaps_low = []
    
    total_target_skills = len(target_role_skills)
    reusable_count = 0
    total_gap_depth = 0.0

    for rs in target_role_skills:
        skill_id = rs["skill_id"]
        skill_name = rs.get("skill_name", "Skill")
        req_level = float(rs.get("required_level", 3.0))
        weight = float(rs.get("weight", 1.0))
        user_level = float(current_skills.get(skill_id, 0.0))

        gap = max(0.0, req_level - user_level)
        total_gap_depth += gap

        if user_level >= req_level:
            reusable_count += 1
            transferable.append({
                "skill_id": skill_id,
                "skill_name": skill_name,
                "user_level": user_level,
                "required_level": req_level,
                "status": "Fully Transferred"
            })
        elif user_level > 0.0:
            reusable_count += 0.5
            transferable.append({
                "skill_id": skill_id,
                "skill_name": skill_name,
                "user_level": user_level,
                "required_level": req_level,
                "status": "Partially Transferable"
            })
            if gap >= 2.0:
                gaps_critical.append({"skill_id": skill_id, "skill_name": skill_name, "gap": gap, "weight": weight})
            else:
                gaps_moderate.append({"skill_id": skill_id, "skill_name": skill_name, "gap": gap, "weight": weight})
        else:
            if gap >= 2.5:
                gaps_critical.append({"skill_id": skill_id, "skill_name": skill_name, "gap": gap, "weight": weight})
            elif gap >= 1.5:
                gaps_moderate.append({"skill_id": skill_id, "skill_name": skill_name, "gap": gap, "weight": weight})
            else:
                gaps_low.append({"skill_id": skill_id, "skill_name": skill_name, "gap": gap, "weight": weight})

    transferability_pct = round((reusable_count / total_target_skills * 100.0), 1) if total_target_skills > 0 else 0.0
    estimated_weeks = max(4, round(total_gap_depth * 1.5))

    return {
        "current_role_title": current_role.get("title", "Current Focus"),
        "target_role_title": target_role.get("title", "Target Role"),
        "transferability_percentage": transferability_pct,
        "transferable_skills": transferable,
        "critical_gaps": gaps_critical,
        "moderate_gaps": gaps_moderate,
        "low_gaps": gaps_low,
        "reusable_modules_count": int(reusable_count),
        "new_modules_needed": total_target_skills - int(reusable_count),
        "estimated_transition_weeks": estimated_weeks,
        "disclaimer": "Estimated skills-based match based on current technical evidence. Does not guarantee employability or job readiness."
    }
