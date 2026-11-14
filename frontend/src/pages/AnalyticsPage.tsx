import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { assessmentsApi, roadmapsApi, skillsApi } from '../api';
import { TrendingUp, BarChart2 } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [assessmentHistory, setAssessmentHistory] = useState<any[]>([]);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [userSkills, setUserSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ah, rm, us] = await Promise.all([
          assessmentsApi.getHistory().catch(() => []),
          roadmapsApi.getActive().catch(() => null),
          skillsApi.getMySkills().catch(() => [])
        ]);
        setAssessmentHistory(ah);
        setRoadmap(rm);
        setUserSkills(us);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Transform assessment history for chart
  const quizTrendData = assessmentHistory
    .map((item, idx) => ({
      name: `Quiz #${assessmentHistory.length - idx} (${item.skill_name})`,
      score: item.score_percentage
    }))
    .reverse();

  const chartData =
    quizTrendData.length > 0
      ? quizTrendData
      : [
          { name: 'Onboarding check', score: 35 },
          { name: 'Python assessment', score: 65 },
          { name: 'JavaScript diagnostic', score: 40 },
        ];

  const skillBars = userSkills.map((s) => ({
    skill: s.skill_name,
    proficiency: s.proficiency_level,
    confidence: Math.round(s.confidence_score * 100)
  }));

  const completedModules = roadmap?.items?.filter((i: any) => i.status === 'completed').length || 0;
  const totalModules = roadmap?.items?.length || 1;
  const completionRate = Math.round((completedModules / totalModules) * 100);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center space-x-3 text-[#5B6573]">
          <div className="w-5 h-5 border-2 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Aggregating learning analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-[#17202A]">Learning Progress & Analytics</h1>
        <p className="text-xs text-[#5B6573] mt-1 leading-relaxed">
          Historical tracking of skill progression, quiz score trends, and module velocity.
        </p>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-[10px] border border-[#DDE1E7] bg-white shadow-sm">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#5B6573]">Curriculum Completion</span>
          <p className="text-2xl font-semibold text-[#0F766E] mt-1 tabular-nums">{completionRate}%</p>
          <p className="text-[11px] text-[#5B6573] mt-1">{completedModules} of {totalModules} modules mastered</p>
        </div>

        <div className="p-4 rounded-[10px] border border-[#DDE1E7] bg-white shadow-sm">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#5B6573]">Weekly Commitment</span>
          <p className="text-2xl font-semibold text-[#17202A] mt-1 tabular-nums">{user?.weekly_hours || 10} hrs / wk</p>
          <p className="text-[11px] text-[#5B6573] mt-1">Expected completion in {roadmap?.total_weeks || 10} weeks</p>
        </div>

        <div className="p-4 rounded-[10px] border border-[#DDE1E7] bg-white shadow-sm">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#5B6573]">Roadmap Version</span>
          <p className="text-2xl font-semibold text-[#17202A] mt-1 tabular-nums">Version {roadmap?.version || 1}</p>
          <p className="text-[11px] text-[#5B6573] mt-1">
            {roadmap?.version > 1 ? 'Dynamic adaptive replanning active' : 'Initial baseline curriculum'}
          </p>
        </div>
      </div>

      {/* Assessment Trend Chart */}
      <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[#17202A] mb-1 flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-[#0F766E]" />
          <span>Diagnostic Assessment Score Trend</span>
        </h2>
        <p className="text-xs text-[#5B6573] mb-4">Historical quiz scores over time (pass threshold: 60%)</p>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 15, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE1E7" />
              <XAxis dataKey="name" stroke="#5B6573" tick={{ fill: '#17202A', fontSize: 11 }} />
              <YAxis domain={[0, 100]} stroke="#5B6573" tick={{ fill: '#17202A', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#DDE1E7',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#17202A'
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#0F766E"
                strokeWidth={2}
                dot={{ fill: '#0F766E', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Skill Proficiency Distribution Bars */}
      <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[#17202A] mb-1 flex items-center space-x-2">
          <BarChart2 className="w-4 h-4 text-[#0F766E]" />
          <span>Skill Proficiency Distribution</span>
        </h2>
        <p className="text-xs text-[#5B6573] mb-4">Normalized proficiency levels (0 to 5.0 scale)</p>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={skillBars} margin={{ top: 15, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE1E7" />
              <XAxis dataKey="skill" stroke="#5B6573" tick={{ fill: '#17202A', fontSize: 11 }} />
              <YAxis domain={[0, 5]} stroke="#5B6573" tick={{ fill: '#17202A', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#DDE1E7',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#17202A'
                }}
              />
              <Bar dataKey="proficiency" fill="#0F766E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
