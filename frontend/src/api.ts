import {
  User, Skill, UserSkill, SkillAnalysis, Role, CareerMatch,
  Roadmap, RoadmapComparison, QuestionDisplay, QuizResult, AgentLog,
  PrerequisiteGraphResponse, TransitionPlan, PracticalEvaluationResponse,
  Notification, AdminOverview, AdminSkillGaps, AdminLearnerItem, AdminDepartmentItem
} from './types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return (
    localStorage.getItem('kattr0li_token') ||
    sessionStorage.getItem('kattr0li_token') ||
    localStorage.getItem('skillpilot_token') ||
    sessionStorage.getItem('skillpilot_token')
  );
}

export function setAuthToken(token: string, remember: boolean = true) {
  if (remember) {
    localStorage.setItem('kattr0li_token', token);
    localStorage.setItem('skillpilot_token', token);
    sessionStorage.removeItem('kattr0li_token');
    sessionStorage.removeItem('skillpilot_token');
  } else {
    sessionStorage.setItem('kattr0li_token', token);
    sessionStorage.setItem('skillpilot_token', token);
    localStorage.removeItem('kattr0li_token');
    localStorage.removeItem('skillpilot_token');
  }
}

export function removeAuthToken() {
  localStorage.removeItem('kattr0li_token');
  sessionStorage.removeItem('kattr0li_token');
  localStorage.removeItem('skillpilot_token');
  sessionStorage.removeItem('skillpilot_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = `Request failed: ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData.detail) errorMsg = errData.detail;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

// Authentication & Roles
export const authApi = {
  login: async (email: string, password: string, remember_me: boolean = true) => {
    const res = await request<{ access_token: string; user_id: number; full_name: string; email: string; role: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember_me })
    });
    setAuthToken(res.access_token, remember_me);
    return res;
  },
  register: async (email: string, password: string, full_name: string, role?: string, department_name?: string) => {
    const res = await request<{ access_token: string; user_id: number; full_name: string; email: string; role: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, role: role || 'student', department_name })
    });
    setAuthToken(res.access_token, true);
    return res;
  },
  getMe: () => request<User>('/auth/me'),
  forgotPassword: (email: string) => request<{ message: string; reset_token?: string; reset_url?: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),
  resetPassword: (token: string, new_password: string) => request<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password })
  }),
  switchRole: (role: string) => request<User>('/auth/switch-role', {
    method: 'POST',
    body: JSON.stringify({ role })
  }),
  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (_) {}
    removeAuthToken();
  }
};

// Onboarding
export const onboardingApi = {
  submit: (data: any) => request<any>('/onboarding/submit', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

// Skills & Evidence Validation
export const skillsApi = {
  getAll: () => request<Skill[]>('/skills'),
  getMySkills: () => request<UserSkill[]>('/skills/my-skills'),
  getAnalysis: () => request<SkillAnalysis>('/skills/analysis'),
  getPrerequisitesGraph: () => request<PrerequisiteGraphResponse>('/skills/prerequisites-graph')
};

// Careers & Career Intelligence
export const careersApi = {
  getRoles: () => request<Role[]>('/careers/roles'),
  getMatch: () => request<CareerMatch>('/careers/match'),
  getTransitionPlan: (targetRoleId: number) => request<TransitionPlan>(`/careers/transition-plan?target_role_id=${targetRoleId}`),
  switchRole: (target_role_id: number) => request<{
    new_role_id: number;
    new_role_title: string;
    carry_over_percentage: number;
    overlapping_skills: any[];
    new_required_skills: any[];
    explanation: string;
  }>('/careers/switch', {
    method: 'POST',
    body: JSON.stringify({ target_role_id })
  })
};

// Roadmaps, Outcomes & Version Diff
export const roadmapsApi = {
  getActive: () => request<Roadmap>('/roadmaps/active'),
  getVersions: () => request<any[]>('/roadmaps/versions'),
  compareVersions: (v1?: number, v2?: number) => {
    const params = new URLSearchParams();
    if (v1) params.append('v1_version', v1.toString());
    if (v2) params.append('v2_version', v2.toString());
    const q = params.toString() ? `?${params.toString()}` : '';
    return request<RoadmapComparison>(`/roadmaps/compare${q}`);
  },
  toggleComplete: (moduleId: number) => request<{ status: string; new_status: string; module_id: number }>(`/roadmaps/modules/${moduleId}/toggle-complete`, {
    method: 'POST'
  }),
  submitPractical: (moduleId: number, submissionText: string) => request<PracticalEvaluationResponse>(`/roadmaps/items/${moduleId}/submit-practical`, {
    method: 'POST',
    body: JSON.stringify({ submission_text: submissionText })
  })
};

// Assessments
export const assessmentsApi = {
  getQuestions: (skillId: number) => request<QuestionDisplay[]>(`/assessments/questions/${skillId}`),
  submitQuiz: (skillId: number, answers: { question_id: number; user_answer: string }[], roadmapItemId?: number) =>
    request<QuizResult>('/assessments/submit', {
      method: 'POST',
      body: JSON.stringify({ skill_id: skillId, answers, roadmap_item_id: roadmapItemId })
    }),
  getHistory: () => request<any[]>('/assessments/history')
};

// Personalized AI Mentor
export const mentorApi = {
  chat: (message: string, current_module_id?: number) => request<{
    reply: string;
    response?: string;
    suggested_action?: string;
    suggested_actions?: string[];
    related_resources?: any[];
  }>('/mentor/chat', {
    method: 'POST',
    body: JSON.stringify({ message, current_module_id })
  }),
  getBriefing: () => request<{
    guidance: string;
    suggested_action: string;
    current_roadmap_version: number;
    target_role: string;
    next_module?: any;
  }>('/mentor/briefing')
};

// Agent Telemetry
export const agentsApi = {
  getLogs: (limit: number = 50) => request<AgentLog[]>(`/agents/logs?limit=${limit}`)
};

// Notifications
export const notificationsApi = {
  getAll: () => request<Notification[]>('/notifications/'),
  markRead: (id: number) => request<{ status: string }>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => request<{ status: string }>('/notifications/read-all', { method: 'POST' })
};

// University & Organization Admin Dashboard (RBAC & Multi-Tenancy)
export const adminApi = {
  getOverview: (preview: boolean = false) => request<AdminOverview>(`/admin/overview?preview=${preview}`),
  getSkillGaps: (preview: boolean = false) => request<AdminSkillGaps>(`/admin/skill-gaps?preview=${preview}`),
  getLearners: (preview: boolean = false) => request<{ learners: AdminLearnerItem[] }>(`/admin/learners?preview=${preview}`),
  getDepartments: (preview: boolean = false) => request<{ departments: AdminDepartmentItem[] }>(`/admin/departments?preview=${preview}`)
};

// Demo Scenario Controller
export const demoApi = {
  reset: () => request<any>('/demo/reset', { method: 'POST' }),
  runScenarioA: () => request<any>('/demo/run-scenario-a', { method: 'POST' }),
  runScenarioB: () => request<any>('/demo/run-scenario-b', { method: 'POST' }),
  runScenarioC: () => request<any>('/demo/run-scenario-c', { method: 'POST' }),
  runScenarioD: () => request<any>('/demo/run-scenario-d', { method: 'POST' }),
  runScenarioE: () => request<any>('/demo/run-scenario-e', { method: 'POST' }),
  runScenarioValidation: () => request<any>('/demo/run-scenario-validation', { method: 'POST' }),
  getStatus: () => request<any>('/demo/status')
};
