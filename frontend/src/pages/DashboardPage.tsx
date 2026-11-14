import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { roadmapsApi, skillsApi, careersApi, mentorApi, assessmentsApi } from '../api';
import { Roadmap, SkillAnalysis, CareerMatch, RoadmapItem } from '../types';
import {
  Compass,
  Bot,
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowRightLeft,
  ChevronRight,
  BookOpen,
  Award,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface DashboardPageProps {
  onSelectModule: (module: RoadmapItem) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectModule }) => {
  const { user, setActiveTab, runDemoQuizScenario, runDemoCareerSwitchScenario } = useAuth();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [skillAnalysis, setSkillAnalysis] = useState<SkillAnalysis | null>(null);
  const [careerMatch, setCareerMatch] = useState<CareerMatch | null>(null);
  const [mentorBriefing, setMentorBriefing] = useState<any>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningDemo, setRunningDemo] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [rm, sk, cm, mb, ah] = await Promise.all([
        roadmapsApi.getActive().catch(() => null),
        skillsApi.getAnalysis().catch(() => null),
        careersApi.getMatch().catch(() => null),
        mentorApi.getBriefing().catch(() => null),
        assessmentsApi.getHistory().catch(() => [])
      ]);
      setRoadmap(rm);
      setSkillAnalysis(sk);
      setCareerMatch(cm);
      setMentorBriefing(mb);
      setAssessmentHistory(ah);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const completedModulesCount = roadmap?.items.filter((i) => i.status === 'completed').length || 0;
  const totalModulesCount = roadmap?.items.length || 1;
  const progressPercent = Math.round((completedModulesCount / totalModulesCount) * 100);

  // Find the next module to learn (first module that is in_progress, not_started, or pending)
  const currentModule =
    roadmap?.items.find((i) => i.status === 'in_progress') ||
    roadmap?.items.find((i) => i.status === 'not_started' || i.status === 'pending') ||
    roadmap?.items[0];

  const currentWeekNumber = currentModule?.week_number || 1;
  const totalWeeks = roadmap?.total_weeks || 10;

  const handleDemoQuiz = async () => {
    setRunningDemo(true);
    try {
      await runDemoQuizScenario();
      await loadDashboardData();
    } finally {
      setRunningDemo(false);
    }
  };

  const handleDemoSwitch = async () => {
    setRunningDemo(true);
    try {
      await runDemoCareerSwitchScenario();
      await loadDashboardData();
    } finally {
      setRunningDemo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center space-x-3 text-[#5B6573]">
          <div className="w-5 h-5 border-2 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading your personalized learning space...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* 1. Header: Greeting, Career Target, and Quick Evaluator Triggers */}
      <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#17202A] tracking-tight">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Alex'}
          </h1>
          <p className="text-sm text-[#5B6573] mt-1 leading-relaxed">
            You are on <span className="font-medium text-[#17202A]">week {currentWeekNumber} of {totalWeeks}</span>.
            Building skills for{' '}
            <span className="font-medium text-[#17202A]">{careerMatch?.role_title || 'Full Stack Developer'}</span>.
            Target: <span className="font-medium text-[#17202A]">{user?.weekly_hours || 10} hours / week</span>.
          </p>
        </div>

        {/* Evaluator Scenario Shortcuts (Clean & minimal) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDemoQuiz}
            disabled={runningDemo}
            className="px-3 py-1.5 rounded-[6px] border border-[#DDE1E7] hover:border-[#B45309] hover:bg-[#FFFBEB] text-[#5B6573] hover:text-[#92400E] text-xs font-medium transition flex items-center space-x-1.5 disabled:opacity-50"
            title="Simulate low score on JS quiz to trigger adaptive plan update"
          >
            <span>Simulate JS Quiz (40% → Adapt)</span>
          </button>
          <button
            onClick={handleDemoSwitch}
            disabled={runningDemo}
            className="px-3 py-1.5 rounded-[6px] border border-[#DDE1E7] hover:border-[#0F766E] hover:bg-[#F0FDFA] text-[#5B6573] hover:text-[#0F766E] text-xs font-medium transition flex items-center space-x-1.5 disabled:opacity-50"
            title="Switch target role to Data Scientist"
          >
            <span>Switch Role (Data Science)</span>
          </button>
        </div>
      </div>

      {/* 2. Adaptation Notification Banner (Displayed when plan was dynamically adapted) */}
      {roadmap && roadmap.version > 1 && (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[10px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-[#92400E]">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-[#B45309] shrink-0" />
            <div>
              <p className="font-semibold text-[#92400E]">
                Learning plan updated (v{roadmap.version})
              </p>
              <p className="text-xs text-[#B45309] mt-0.5">
                {roadmap.reason_for_adaptation ||
                  'Your roadmap was adapted based on your diagnostic assessment to reinforce prerequisites.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('roadmap')}
            className="text-xs font-semibold px-3 py-1.5 rounded-[6px] bg-[#B45309] text-white hover:bg-[#92400E] transition shrink-0"
          >
            View plan changes
          </button>
        </div>
      )}

      {/* 3. Hero Centerpiece: Visual Learning Roadmap (Horizontal Connected Journey) */}
      <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#17202A] uppercase tracking-wider">
              Learning Roadmap
            </h2>
            <p className="text-xs text-[#5B6573] mt-0.5">
              Click any module to inspect curated materials, learning objectives, and practical exercises.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('roadmap')}
            className="text-xs font-medium text-[#0F766E] hover:underline flex items-center space-x-1"
          >
            <span>Explore full interactive graph</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal Scrollable Timeline of Modules */}
        <div className="overflow-x-auto pb-2 pt-2 -mx-2 px-2">
          <div className="flex items-stretch min-w-max space-x-3">
            {roadmap?.items.map((item, idx) => {
              const isCompleted = item.status === 'completed';
              const isCurrent = item.id === currentModule?.id;
              const isRemedial = item.is_remedial;

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectModule(item)}
                  className={`w-64 p-4 rounded-[8px] border transition cursor-pointer flex flex-col justify-between select-none ${
                    isCurrent
                      ? 'border-[#0F766E] ring-1 ring-[#0F766E] bg-[#F0FDFA]/30'
                      : isRemedial
                      ? 'border-[#FDE68A] bg-[#FFFBEB]/40 hover:border-[#B45309]'
                      : isCompleted
                      ? 'border-[#DDE1E7] bg-[#F6F7F9] hover:border-[#5B6573]'
                      : 'border-[#DDE1E7] bg-white hover:border-[#0F766E]'
                  }`}
                >
                  <div>
                    {/* Header: Week number + Status Badge */}
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-mono text-[11px] text-[#5B6573]">
                        Week {item.week_number}
                      </span>
                      {isRemedial ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                          Adapted
                        </span>
                      ) : isCompleted ? (
                        <span className="flex items-center space-x-1 text-[11px] text-[#0F766E] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </span>
                      ) : isCurrent ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#CCFBF1] text-[#0F766E]">
                          Current
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#5B6573]">Planned</span>
                      )}
                    </div>

                    {/* Module Title */}
                    <h3 className="text-xs font-semibold text-[#17202A] line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  {/* Footer: Skill + Resources count */}
                  <div className="mt-3 pt-2.5 border-t border-[#DDE1E7] flex items-center justify-between text-[11px] text-[#5B6573]">
                    <span className="truncate max-w-[130px] font-medium text-[#17202A]">
                      {item.skill_name || 'Core Skill'}
                    </span>
                    <span>{item.resources?.length || 0} resources</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. "Your next step" Hero Card */}
      {currentModule && (
        <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#0F766E] bg-[#F0FDFA] px-2 py-0.5 rounded border border-[#CCFBF1]">
                  Your next step
                </span>
                <span className="text-xs text-[#5B6573]">Week {currentModule.week_number} • Est. {currentModule.duration_hours || 4} hours</span>
              </div>
              <h2 className="text-base font-semibold text-[#17202A]">
                {currentModule.title}
              </h2>
              <p className="text-xs text-[#5B6573] leading-relaxed">
                {currentModule.explanation_gap ||
                  currentModule.learning_objectives?.join(' • ') ||
                  `Deepen your mastery of ${currentModule.skill_name || 'core stack'}. Complete the interactive readings and submit the practical exercise to validate your proficiency.`}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onSelectModule(currentModule)}
                className="px-5 py-2.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-medium transition shadow-sm flex items-center space-x-2"
              >
                <span>Start module</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Summary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Career Readiness */}
        <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#5B6573]">
            <span className="font-medium">Career readiness</span>
            <Award className="w-4 h-4 text-[#0F766E]" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-semibold text-[#17202A] tabular-nums">
              {careerMatch?.match_percentage || 0}%
            </span>
            <span className="text-xs text-[#5B6573]">
              for {careerMatch?.role_title || 'Full Stack Developer'}
            </span>
          </div>
          <div className="w-full bg-[#EEF1F5] rounded-full h-1.5 mt-3">
            <div
              className="bg-[#0F766E] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${careerMatch?.match_percentage || 0}%` }}
            />
          </div>
        </div>

        {/* Roadmap Progress */}
        <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#5B6573]">
            <span className="font-medium">Curriculum progress</span>
            <Compass className="w-4 h-4 text-[#0F766E]" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-semibold text-[#17202A] tabular-nums">
              {progressPercent}%
            </span>
            <span className="text-xs text-[#5B6573]">
              ({completedModulesCount} of {totalModulesCount} modules)
            </span>
          </div>
          <div className="w-full bg-[#EEF1F5] rounded-full h-1.5 mt-3">
            <div
              className="bg-[#0F766E] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Weekly Commitment */}
        <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#5B6573]">
            <span className="font-medium">Weekly study pace</span>
            <Clock className="w-4 h-4 text-[#0F766E]" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-semibold text-[#17202A] tabular-nums">
              {user?.weekly_hours || 10} hrs / wk
            </span>
            <span className="text-xs text-[#0F766E] font-medium">On track</span>
          </div>
          <p className="text-[11px] text-[#5B6573] mt-3">
            Target completion in {roadmap?.total_weeks || 10} weeks
          </p>
        </div>
      </div>

      {/* 6. Two-Column Layout: Skill Profile & Diagnostic Assessment / AI Mentor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Skill Competency Radar (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#DDE1E7] rounded-[10px] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-[#17202A]">
                Skill profile & benchmarks
              </h2>
              <p className="text-xs text-[#5B6573] mt-0.5">
                Current validated proficiency vs. target career benchmark
              </p>
            </div>
            <button
              onClick={() => setActiveTab('skills')}
              className="text-xs text-[#0F766E] font-medium hover:underline flex items-center space-x-1"
            >
              <span>View full audit</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-[280px] w-full flex items-center justify-center my-2">
            {skillAnalysis?.radar_data && skillAnalysis.radar_data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillAnalysis.radar_data} margin={{ top: 15, right: 30, bottom: 15, left: 30 }}>
                  <PolarGrid stroke="#DDE1E7" />
                  <PolarAngleAxis dataKey="skill" stroke="#5B6573" tick={{ fill: '#17202A', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#DDE1E7" />
                  <Radar
                    name="Current proficiency"
                    dataKey="proficiency"
                    stroke="#0F766E"
                    fill="#0F766E"
                    fillOpacity={0.15}
                  />
                  <Radar
                    name="Target requirement"
                    dataKey="required"
                    stroke="#5B6573"
                    strokeDasharray="3 3"
                    fill="#5B6573"
                    fillOpacity={0.05}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#DDE1E7',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#17202A',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-[#5B6573]">Loading skill competencies...</p>
            )}
          </div>

          {/* Strengths & Growth Areas */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#DDE1E7] text-xs">
            <div>
              <span className="text-[11px] font-medium text-[#5B6573] uppercase tracking-wider">
                Validated strengths
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {skillAnalysis?.strengths.slice(0, 3).map((s, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-[4px] bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] text-[11px] font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-[11px] font-medium text-[#5B6573] uppercase tracking-wider">
                Priority growth areas
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {skillAnalysis?.weaknesses.slice(0, 3).map((w, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-[4px] bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-[11px] font-medium"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Mentor Guidance + Assessment Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* AI Mentor Insight Card */}
          <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-5 shadow-sm flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center space-x-2.5 mb-3">
                <div className="p-1.5 rounded-[6px] bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#17202A]">AI Mentor Advice</h3>
                  <p className="text-[11px] text-[#5B6573]">Personalized pedagogical guidance</p>
                </div>
              </div>

              <div className="p-3 bg-[#F6F7F9] rounded-[6px] border border-[#DDE1E7]">
                <p className="text-xs text-[#17202A] leading-relaxed italic">
                  "{mentorBriefing?.guidance ||
                    "Welcome! Focus on building steady, consistent practice with the current module before moving forward."}"
                </p>
              </div>

              <div className="mt-3">
                <span className="text-[11px] font-medium text-[#5B6573] uppercase tracking-wider">
                  Recommended action
                </span>
                <p className="text-xs text-[#17202A] font-medium mt-1">
                  {mentorBriefing?.suggested_action || "Complete the weekly reading and quiz."}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('mentor')}
              className="mt-4 w-full py-2 rounded-[6px] border border-[#DDE1E7] hover:border-[#0F766E] hover:bg-[#F0FDFA] text-[#17202A] hover:text-[#0F766E] text-xs font-medium transition flex items-center justify-center space-x-1.5"
            >
              <Bot className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Ask AI Mentor a question</span>
            </button>
          </div>

          {/* Diagnostic Assessment Card */}
          <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-[#17202A] flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                <span>Diagnostic Assessment</span>
              </h3>
              <span className="text-[11px] text-[#5B6573]">5 questions</span>
            </div>
            <p className="text-xs text-[#5B6573] leading-relaxed">
              Verify your comprehension of recent concepts. Scoring below 60% automatically adapts your learning plan.
            </p>
            <button
              onClick={() => setActiveTab('assessments')}
              className="mt-3 w-full py-2 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-medium transition flex items-center justify-center space-x-1.5"
            >
              <span>Take diagnostic quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
