import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { onboardingApi, careersApi } from '../api';
import { Role } from '../types';
import {
  ArrowRight,
  CheckCircle2,
  Briefcase,
  Sparkles
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { user, refreshUser, setActiveTab, showNotification } = useAuth();
  const [step, setStep] = useState(1);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [agentOrchestrating, setAgentOrchestrating] = useState(false);
  const [currentExecutingAgent, setCurrentExecutingAgent] = useState('Profiler Agent');

  // Form State
  const [fullName, setFullName] = useState(user?.full_name || 'Alex Rivera');
  const [education, setEducation] = useState('Computer Science Student');
  const [academicYear, setAcademicYear] = useState('Junior (3rd Year)');
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [targetDate, setTargetDate] = useState('10 weeks');
  const [selectedRoleId, setSelectedRoleId] = useState(1);
  const [resumeText, setResumeText] = useState('CS student with coursework in Python, data structures, relational databases, and git collaboration.');

  // Skills initial slider levels
  const [skills, setSkills] = useState([
    { skill_id: 1, name: 'Python', level: 3 },
    { skill_id: 6, name: 'SQL', level: 3 },
    { skill_id: 3, name: 'HTML & CSS', level: 2 },
    { skill_id: 2, name: 'JavaScript', level: 1 },
    { skill_id: 4, name: 'React', level: 0 },
    { skill_id: 5, name: 'Node.js', level: 0 },
    { skill_id: 7, name: 'Git', level: 2 },
    { skill_id: 8, name: 'REST APIs', level: 1 },
  ]);

  useEffect(() => {
    careersApi.getRoles().then((r) => setRoles(r)).catch(() => {});
  }, []);

  const handleSkillChange = (id: number, val: number) => {
    setSkills((prev) => prev.map((s) => (s.skill_id === id ? { ...s, level: val } : s)));
  };

  const handleFinishOnboarding = async () => {
    setAgentOrchestrating(true);
    setLoading(true);

    const agentSequence = [
      'Profiler Agent: Normalizing skills and generating profile vector...',
      'Skill Analyst Agent: Auditing strengths and missing prerequisites...',
      'Career Matcher Agent: Calculating role compatibility and ranking gaps...',
      'Path Planner Agent: Generating personalized weekly learning modules...',
      'Resource Curator Agent: Retrieving verified materials from curated catalog...',
      'Mentor Agent: Formulating initial pedagogical briefing...'
    ];

    let seqIdx = 0;
    const interval = setInterval(() => {
      seqIdx++;
      if (seqIdx < agentSequence.length) {
        setCurrentExecutingAgent(agentSequence[seqIdx]);
      }
    }, 700);

    try {
      await onboardingApi.submit({
        full_name: fullName,
        education,
        academic_year_or_experience: academicYear,
        preferred_career_role_id: selectedRoleId,
        weekly_hours: weeklyHours,
        target_date: targetDate,
        skills: skills.map((s) => ({ skill_id: s.skill_id, proficiency: s.level, name: s.name })),
        resume_text: resumeText
      });

      clearInterval(interval);
      await refreshUser();
      showNotification('success', 'Personalized Roadmap v1 successfully synthesized by LangGraph agents!');
      setActiveTab('dashboard');
    } catch (err: any) {
      clearInterval(interval);
      setAgentOrchestrating(false);
      setLoading(false);
      showNotification('error', `Onboarding failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      {/* Steps Indicator */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#DDE1E7]">
        {[
          { num: 1, label: 'Background & Target' },
          { num: 2, label: 'Skill Self-Audit' },
          { num: 3, label: 'Resume & Multi-Agent Synthesis' },
        ].map((s) => (
          <div key={s.num} className="flex items-center space-x-2.5">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                step === s.num
                  ? 'bg-[#0F766E] text-white ring-4 ring-[#CCFBF1]'
                  : step > s.num
                  ? 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]'
                  : 'bg-[#EEF1F5] text-[#5B6573]'
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                step === s.num ? 'text-[#17202A] font-semibold' : 'text-[#5B6573]'
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Background & Target Role */}
      {step === 1 && (
        <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-[#17202A]">Tailor Your Learning Experience</h2>
            <p className="text-xs text-[#5B6573] mt-1">Specify your background and target career goal.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#17202A] mb-1">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-[6px] border border-[#DDE1E7] bg-white py-2 px-3 text-xs text-[#17202A] focus:border-[#0F766E] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#17202A] mb-1">Education background</label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full rounded-[6px] border border-[#DDE1E7] bg-white py-2 px-3 text-xs text-[#17202A] focus:border-[#0F766E] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#17202A] mb-1">Academic year or experience</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full rounded-[6px] border border-[#DDE1E7] bg-white py-2 px-3 text-xs text-[#17202A] focus:border-[#0F766E] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#17202A] mb-1">Weekly study hours commitment</label>
              <div className="flex items-center space-x-3 pt-1">
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value))}
                  className="w-full accent-[#0F766E]"
                />
                <span className="font-mono text-xs font-semibold text-[#17202A] w-16 tabular-nums">
                  {weeklyHours} hrs/wk
                </span>
              </div>
            </div>
          </div>

          {/* Career Role Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5B6573] mb-3">
              Select Your Target Career Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {roles.map((r) => {
                const isSelected = selectedRoleId === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`p-3.5 rounded-[8px] border cursor-pointer transition select-none ${
                      isSelected
                        ? 'border-2 border-[#0F766E] bg-[#F0FDFA]'
                        : 'border-[#DDE1E7] bg-white hover:border-[#0F766E]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-[#5B6573] uppercase tracking-wider">
                        {r.category}
                      </span>
                      <Briefcase className="w-3.5 h-3.5 text-[#5B6573]" />
                    </div>
                    <h4 className="text-xs font-semibold text-[#17202A]">{r.title}</h4>
                    <p className="text-[11px] text-[#5B6573] mt-1 line-clamp-2 leading-relaxed">
                      {r.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-xs shadow-sm transition flex items-center space-x-2"
            >
              <span>Continue to skill audit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Skill Self-Audit */}
      {step === 2 && (
        <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-[#17202A]">Rate Your Current Competency (0 to 5)</h2>
            <p className="text-xs text-[#5B6573] mt-1">
              Be candid! The Path Planner avoids repeating what you already know and focuses study on genuine gaps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {skills.map((s) => (
              <div key={s.skill_id} className="p-4 rounded-[8px] border border-[#DDE1E7] bg-[#F6F7F9]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#17202A]">{s.name}</span>
                  <span
                    className={`text-xs font-mono font-medium px-2 py-0.5 rounded-[4px] ${
                      s.level >= 3
                        ? 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]'
                        : s.level > 0
                        ? 'bg-white text-[#17202A] border border-[#DDE1E7]'
                        : 'bg-[#EEF1F5] text-[#5B6573]'
                    }`}
                  >
                    Level {s.level} / 5
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={s.level}
                  onChange={(e) => handleSkillChange(s.skill_id, Number(e.target.value))}
                  className="w-full accent-[#0F766E]"
                />
                <div className="flex justify-between text-[10px] text-[#5B6573] mt-1">
                  <span>Novice (0)</span>
                  <span>Intermediate (3)</span>
                  <span>Master (5)</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-[6px] border border-[#DDE1E7] text-[#5B6573] hover:text-[#17202A] text-xs font-medium hover:bg-[#F6F7F9] transition"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-xs shadow-sm transition flex items-center space-x-2"
            >
              <span>Continue to resume & synthesis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Resume & Multi-Agent Execution */}
      {step === 3 && (
        <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-[#17202A]">Resume Highlights & Agent Synthesis</h2>
            <p className="text-xs text-[#5B6573] mt-1">
              Profiler Agent extracts skills from your project experiences and coursework.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#17202A] mb-1">
              Paste resume summary, coursework, or project highlights:
            </label>
            <textarea
              rows={4}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="e.g. Coursework in algorithms, databases, Python scripting, git collaboration..."
              className="w-full rounded-[6px] border border-[#DDE1E7] bg-white p-3 text-xs text-[#17202A] placeholder-[#5B6573] focus:border-[#0F766E] focus:outline-none"
            />
          </div>

          {agentOrchestrating && (
            <div className="p-4 rounded-[8px] border border-[#CCFBF1] bg-[#F0FDFA]">
              <div className="flex items-center space-x-2.5 mb-2">
                <div className="w-3.5 h-3.5 border-2 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
                <h4 className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
                  LangGraph multi-agent pipeline executing
                </h4>
              </div>
              <p className="text-xs font-medium text-[#17202A] font-mono">{currentExecutingAgent}</p>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              disabled={loading}
              className="px-4 py-2 rounded-[6px] border border-[#DDE1E7] text-[#5B6573] hover:text-[#17202A] text-xs font-medium hover:bg-[#F6F7F9] transition disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleFinishOnboarding}
              disabled={loading}
              className="px-6 py-2.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-xs shadow-sm transition flex items-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Synthesizing...' : 'Run multi-agent synthesis'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
