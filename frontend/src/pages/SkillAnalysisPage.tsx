import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { skillsApi } from '../api';
import { SkillAnalysis, UserSkill } from '../types';
import {
  Radar as RadarIcon,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles
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

export const SkillAnalysisPage: React.FC = () => {
  const { user, setActiveTab } = useAuth();
  const [analysis, setAnalysis] = useState<SkillAnalysis | null>(null);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [an, us] = await Promise.all([
          skillsApi.getAnalysis(),
          skillsApi.getMySkills()
        ]);
        setAnalysis(an);
        setUserSkills(us);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center space-x-3 text-[#5B6573]">
          <div className="w-5 h-5 border-2 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Analyzing multi-source evidence and skill vectors...</span>
        </div>
      </div>
    );
  }

  const evidenceItems = analysis?.evidence_breakdown || [];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-6 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-[#0F766E] bg-[#F0FDFA] px-2 py-0.5 rounded border border-[#CCFBF1]">
            Evidence Validation Engine
          </span>
          <span className="text-xs text-[#5B6573] font-mono">
            {evidenceItems.length} skills tracked
          </span>
        </div>
        <h1 className="text-xl font-semibold text-[#17202A] mt-2">
          Evidence-Based Skill Validation & Gap Audit
        </h1>
        <p className="text-xs text-[#5B6573] mt-1 max-w-3xl leading-relaxed">
          KATTR0LI (கற்றொளி) verifies competencies by synthesizing self-reports, resume parsing, diagnostic assessments,
          and practical exercise evaluations using weighted normalization to prevent overestimation and reveal true skill gaps.
        </p>
      </div>

      {/* Top Grid: Radar Chart + Prerequisite Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#DDE1E7] rounded-[10px] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#17202A] flex items-center space-x-2">
              <RadarIcon className="w-4 h-4 text-[#0F766E]" />
              <span>Multi-Dimensional Skill Competency Radar</span>
            </h2>
            <p className="text-xs text-[#5B6573] mt-0.5">
              Teal indicates your validated proficiency; dotted line represents industry role benchmarks.
            </p>
          </div>

          <div className="h-[320px] w-full my-2">
            {analysis?.radar_data && analysis.radar_data.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={analysis.radar_data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke="#DDE1E7" />
                  <PolarAngleAxis dataKey="skill" stroke="#5B6573" tick={{ fill: '#17202A', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#DDE1E7" />
                  <Radar
                    name="Validated level"
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
                      color: '#17202A'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="text-[11px] text-[#5B6573] pt-2 border-t border-[#DDE1E7] flex items-center justify-between">
            <span>Scores normalized on a 0.0 to 5.0 scale</span>
            <span className="text-[#0F766E] font-medium">Confidence-weighted</span>
          </div>
        </div>

        {/* Strengths, Weaknesses & Prerequisite Dependencies (5 cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Missing Prerequisites Alert */}
          {analysis?.missing_prerequisites && analysis.missing_prerequisites.length > 0 && (
            <div className="p-4 rounded-[10px] border border-[#FDE68A] bg-[#FFFBEB] shadow-sm">
              <h3 className="text-xs font-semibold text-[#92400E] uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-[#B45309]" />
                <span>Missing prerequisites detected</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-[#92400E]">
                {analysis.missing_prerequisites.map((p, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-[#B45309] font-bold">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strengths */}
          <div className="p-4 rounded-[10px] border border-[#DDE1E7] bg-white shadow-sm flex-1">
            <h3 className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
              <span>Validated strengths (≥3.0)</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {analysis?.strengths.map((str, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-[4px] bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] text-xs font-medium"
                >
                  {str}
                </span>
              ))}
            </div>
          </div>

          {/* Priority Focus Areas */}
          <div className="p-4 rounded-[10px] border border-[#DDE1E7] bg-white shadow-sm flex-1">
            <h3 className="text-xs font-semibold text-[#B45309] uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-[#B45309]" />
              <span>Priority upskilling gaps (&lt;2.5)</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {analysis?.weaknesses.map((w, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-[4px] bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-xs font-medium"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature 2: Evidence-Based Skill Validation Audit Matrix */}
      <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DDE1E7] pb-3">
          <div>
            <h2 className="text-sm font-semibold text-[#17202A] flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
              <span>Multi-Source Skill Evidence Audit Table</span>
            </h2>
            <p className="text-xs text-[#5B6573] mt-0.5">
              Demonstrates synthesized proficiency computed across self-ratings, resume extraction, diagnostic quiz scores, and practical exercise code.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('assessments')}
            className="px-3.5 py-1.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-medium transition shadow-sm self-start"
          >
            Take diagnostic quiz
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F6F7F9] text-[#5B6573] uppercase text-[10px] font-semibold border-b border-[#DDE1E7]">
              <tr>
                <th className="p-3">Skill</th>
                <th className="p-3">Self-rating</th>
                <th className="p-3">Resume</th>
                <th className="p-3">Diagnostic quiz</th>
                <th className="p-3">Practical code</th>
                <th className="p-3">Synthesized level</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">Validation status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE1E7]">
              {evidenceItems.map((item, idx) => {
                const statusBadges: Record<string, { label: string; style: string }> = {
                  fully_validated: { label: 'Fully validated', style: 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]' },
                  practically_validated: { label: 'Practically validated', style: 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]' },
                  assessment_validated: { label: 'Assessment validated', style: 'bg-[#EEF1F5] text-[#17202A] border-[#DDE1E7]' },
                  self_reported: { label: 'Self-reported only', style: 'bg-[#EEF1F5] text-[#5B6573] border-[#DDE1E7]' },
                  needs_calibration: { label: 'Needs calibration', style: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]' }
                };
                const badge = statusBadges[item.validation_status] || statusBadges.self_reported;

                return (
                  <tr key={idx} className="hover:bg-[#F6F7F9]">
                    <td className="p-3">
                      <div className="font-semibold text-[#17202A]">{item.skill_name}</div>
                      {item.discrepancy_note && (
                        <p className="text-[11px] text-[#B45309] mt-0.5">
                          {item.discrepancy_note}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-[#5B6573] font-mono">
                      {item.self_reported > 0 ? `${item.self_reported.toFixed(1)} / 5` : '—'}
                    </td>
                    <td className="p-3 text-[#5B6573] font-mono">
                      {item.resume > 0 ? `${item.resume.toFixed(1)} / 5` : '—'}
                    </td>
                    <td className="p-3 text-[#17202A] font-semibold font-mono">
                      {item.assessment > 0 ? `${item.assessment.toFixed(1)} / 5` : '—'}
                    </td>
                    <td className="p-3 text-[#0F766E] font-semibold font-mono">
                      {item.practical > 0 ? `${item.practical.toFixed(1)} / 5` : '—'}
                    </td>
                    <td className="p-3 font-semibold text-[#0F766E] text-sm font-mono">
                      {item.synthesized_proficiency.toFixed(1)} <span className="text-[10px] text-[#5B6573]">/ 5.0</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-1.5 rounded-full bg-[#EEF1F5] overflow-hidden">
                          <div
                            className="h-full bg-[#0F766E] rounded-full"
                            style={{ width: `${Math.round(item.confidence_score * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[#5B6573] text-[11px]">
                          {Math.round(item.confidence_score * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-medium border ${badge.style}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
