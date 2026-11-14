export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'student' | 'employee' | 'university_admin' | 'organization_admin';
  organization_id?: number;
  department_name?: string;
  education?: string;
  academic_year_or_experience?: string;
  weekly_hours: number;
  target_date?: string;
  current_role_id?: number;
  created_at: string;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
  description?: string;
}

export interface EvidenceItem {
  skill_id: number;
  skill_name: string;
  self_reported: number;
  resume: number;
  assessment: number;
  practical: number;
  synthesized_proficiency: number;
  confidence_score: number;
  validation_status: 'self_reported' | 'assessment_validated' | 'practically_validated' | 'fully_validated' | 'needs_calibration';
  discrepancy_note?: string;
  evidence_sources: string[];
}

export interface UserSkill {
  id: number;
  skill_id: number;
  skill_name: string;
  category: string;
  proficiency_level: number;
  self_reported_level: number;
  resume_level?: number;
  assessment_level?: number;
  practical_level?: number;
  confidence_score: number;
  source: string;
  evidence_sources?: string;
  validation_status?: string;
  discrepancy_note?: string;
  last_evaluated_at: string;
}

export interface SkillRadarItem {
  skill: string;
  proficiency: number;
  required: number;
  confidence: number;
  category: string;
}

export interface SkillAnalysis {
  strengths: string[];
  weaknesses: string[];
  recommended_focus: string[];
  radar_data: SkillRadarItem[];
  missing_prerequisites: string[];
  evidence_breakdown?: EvidenceItem[];
}

export interface PrerequisiteNode {
  id: string;
  skill_id: number;
  label: string;
  category: string;
  status: 'completed' | 'validated' | 'in_progress' | 'locked' | 'recommended';
  proficiency: number;
  required_level: number;
  confidence: number;
}

export interface PrerequisiteEdge {
  id: string;
  source: string;
  target: string;
  is_strict: boolean;
}

export interface PrerequisiteGraphResponse {
  nodes: PrerequisiteNode[];
  edges: PrerequisiteEdge[];
}

export interface RoleSkill {
  skill_id: number;
  skill_name: string;
  category: string;
  required_level: number;
  weight: number;
  is_core: boolean;
  dependency_depth: number;
}

export interface Role {
  id: number;
  title: string;
  description: string;
  category: string;
  icon: string;
  skills: RoleSkill[];
}

export interface SkillGapItem {
  skill_id: number;
  skill_name: string;
  current_level: number;
  required_level: number;
  gap: number;
  weight: number;
  priority_score: number;
  is_core: boolean;
  status: 'Mastered' | 'Needs Improvement' | 'Missing Prerequisite';
}

export interface CareerMatch {
  role_id: number;
  role_title: string;
  match_percentage: number;
  required_skills_count: number;
  matched_skills_count: number;
  skill_gaps: SkillGapItem[];
  adjacent_careers: {
    role_id: number;
    title: string;
    category: string;
    match_percentage: number;
  }[];
}

export interface TransitionPlan {
  current_role_title: string;
  target_role_title: string;
  transferability_percentage: number;
  transferable_skills: {
    skill_id: number;
    skill_name: string;
    user_level: number;
    required_level: number;
    status: string;
  }[];
  critical_gaps: { skill_id: number; skill_name: string; gap: number; weight: number }[];
  moderate_gaps: { skill_id: number; skill_name: string; gap: number; weight: number }[];
  low_gaps: { skill_id: number; skill_name: string; gap: number; weight: number }[];
  reusable_modules_count: number;
  new_modules_needed: number;
  estimated_transition_weeks: number;
  disclaimer: string;
}

export interface VerifiedResource {
  id: number;
  title: string;
  url: string;
  provider: string;
  resource_type: string;
  difficulty: string;
  duration_minutes: number;
  suitability_reason?: string;
  explanation_learner_match?: string;
  expected_outcome?: string;
  is_free?: boolean;
}

export interface RoadmapItem {
  id: number;
  week_number: number;
  sequence_order: number;
  title: string;
  skill_id?: number;
  skill_name?: string;
  learning_objectives: string[];
  duration_hours: number;
  practical_exercise?: string;
  practical_rubric?: string;
  practical_submission?: string;
  practical_score?: number;
  practical_feedback?: string;
  completion_criteria?: string;
  status: 'not_started' | 'in_progress' | 'submitted_for_evaluation' | 'completed' | 'needs_improvement' | 'pending';
  is_remedial: boolean;
  explanation_gap?: string;
  explanation_prereq?: string;
  explanation_outcome?: string;
  explanation_career?: string;
  completed_at?: string;
  resources: VerifiedResource[];
}

export interface Roadmap {
  id: number;
  user_id: number;
  role_id: number;
  role_title: string;
  version: number;
  title: string;
  status: string;
  trigger_event?: string;
  reason_for_adaptation?: string;
  total_weeks: number;
  created_at: string;
  items: RoadmapItem[];
}

export interface ModuleDiffRow {
  module_title: string;
  skill_name?: string;
  version_1_status: string;
  version_2_status: string;
  change_type: 'added' | 'delayed' | 'reused' | 'completed' | 'removed';
}

export interface RoadmapComparison {
  v1: Roadmap;
  v2: Roadmap;
  adaptation_reason: string;
  trigger_event?: string;
  added_modules: string[];
  delayed_modules: string[];
  modified_resources_count: number;
  comparison_table?: ModuleDiffRow[];
}

export interface QuestionDisplay {
  id: number;
  skill_id: number;
  skill_name: string;
  difficulty_level: number;
  question_text: string;
  question_type: string;
  code_snippet?: string;
  options: string[];
  subtopic: string;
}

export interface QuestionResultItem {
  question_id: number;
  question_text: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation?: string;
  subtopic: string;
}

export interface QuizResult {
  assessment_id: number;
  skill_id: number;
  skill_name: string;
  score_percentage: number;
  passed: boolean;
  old_proficiency: number;
  new_proficiency: number;
  feedback: string;
  weak_subtopics: string[];
  question_results: QuestionResultItem[];
  adaptation_triggered: boolean;
  adaptation_reason?: string;
  roadmap_version: number;
}

export interface PracticalEvaluationResponse {
  status: string;
  passed: boolean;
  score_percentage: number;
  rubric_scores: Record<string, number>;
  feedback: string;
  recommendation: string;
  validation_status: string;
  new_proficiency: number;
  confidence_score: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface AdminOverview {
  organization: {
    id: number;
    name: string;
    type: string;
    domain: string;
  };
  total_registered_learners: number;
  active_learners: number;
  average_skill_proficiency: number;
  average_career_readiness_score: number;
  total_completed_modules: number;
  average_assessment_score: number;
  learners_requiring_support: number;
  support_rate_percentage: number;
}

export interface AdminSkillGapItem {
  skill_id: number;
  skill_name: string;
  category: string;
  average_proficiency: number;
  learners_with_gap: number;
  gap_percentage: number;
  recommended_training: boolean;
}

export interface AdminSkillGaps {
  commonly_missing_skills: AdminSkillGapItem[];
  proficiency_distribution: { range: string; count: number }[];
  training_recommendations: AdminSkillGapItem[];
}

export interface AdminLearnerItem {
  id: number;
  full_name: string;
  email: string;
  role: string;
  department_name: string;
  education?: string;
  target_role: string;
  average_proficiency: number;
  career_readiness_score: number;
  roadmap_version: number;
  completed_modules: number;
  total_modules: number;
  roadmap_completion_pct: number;
  last_assessment_score?: number;
  is_inactive: boolean;
  needs_support: boolean;
}

export interface AdminDepartmentItem {
  department_name: string;
  member_count: number;
  average_proficiency: number;
  average_readiness: number;
  readiness_status: string;
}

export interface AgentLog {
  id: number;
  agent_name: string;
  status: string;
  task: string;
  input_summary?: string;
  output_summary?: string;
  execution_time_ms: number;
  next_agent?: string;
  metadata_json?: string;
  created_at: string;
}

export interface AgentStreamEvent {
  event_id: string;
  user_id: number;
  agent_name: string;
  status: 'running' | 'completed' | 'adapted' | 'failed';
  task: string;
  input_summary: string;
  output_summary: string;
  execution_time_ms: number;
  next_agent?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}
