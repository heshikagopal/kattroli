import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { careersApi } from '../api';
import { CareerMatch, Role, TransitionPlan } from '../types';
import {
  Briefcase,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  ArrowRightLeft,
  Clock,
  ShieldCheck
} from 'lucide-react';

export const CareerMatchingPage: React.FC = () => {
  const { user, refreshUser, setActiveTab, showNotification } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'match' | 'transition'>('match');
  const [careerMatch, setCareerMatch] = useState<CareerMatch | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<number | null>(null);

  // Transition Planner State
  const [selectedTargetRole, setSelectedTargetRole] = useState<number>(2); // Default Data Scientist
  const [transitionPlan, setTransitionPlan] = useState<TransitionPlan | null>(null);
  const [loadingTransition, setLoadingTransition] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cm, r] = await Promise.all([
        careersApi.getMatch(),
        careersApi.getRoles()
      ]);
      setCareerMatch(cm);
      setRoles(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (activeSubTab === 'transition' && selectedTargetRole) {
      setLoadingTransition(true);
      careersApi.getTransitionPlan(selectedTargetRole)
        .then(res => setTransitionPlan(res))
        .catch(err => console.error('Transition plan error:', err))
        .finally(() => setLoadingTransition(false));
    }
  }, [activeSubTab, selectedTargetRole]);

  const handleSwitch = async (targetRoleId: number) => {
    setSwitching(targetRoleId);
    try {
      const res = await careersApi.switchRole(targetRoleId);
      await refreshUser();
      showNotification('success', `${res.carry_over_percentage}% of learning progress carried over to ${res.new_role_title}!`);
      await fetchData();
      setActiveTab('roadmap');
    } catch (e: any) {
      showNotification('error', `Switch failed: ${e.message}`);
    } finally {
      setSwitching(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center space-x-3 text-[#5B6573]">
          <div className="w-5 h-5 border-2 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Calculating career compatibility matrix...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#0F766E] bg-[#F0FDFA] px-2 py-0.5 rounded border border-[#CCFBF1]">
              Career Intelligence Engine
            </span>
            <span className="text-xs text-[#5B6573]">8 benchmark profiles</span>
          </div>
          <h1 className="text-xl font-semibold text-[#17202A] mt-2">
            Career Compatibility & Transition Intelligence
          </h1>
          <p className="text-xs text-[#5B6573] mt-1 leading-relaxed">
            Algorithmic role fit calculation evaluating weighted proficiency coverage, transferable skills, and transition roadmaps.
          </p>
        </div>

        {/* SubTab Navigation */}
        <div className="flex items-center space-x-1 bg-[#EEF1F5] p-1 rounded-[6px] text-xs shrink-0">
          <button
            onClick={() => setActiveSubTab('match')}
            className={`px-3 py-1.5 rounded-[4px] font-medium transition flex items-center space-x-1.5 ${
              activeSubTab === 'match'
                ? 'bg-white text-[#17202A] shadow-sm font-semibold'
                : 'text-[#5B6573] hover:text-[#17202A]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Role compatibility</span>
          </button>
          <button
            onClick={() => setActiveSubTab('transition')}
            className={`px-3 py-1.5 rounded-[4px] font-medium transition flex items-center space-x-1.5 ${
              activeSubTab === 'transition'
                ? 'bg-white text-[#17202A] shadow-sm font-semibold'
                : 'text-[#5B6573] hover:text-[#17202A]'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Career transition planner</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: Standard Compatibility & Gaps */}
      {activeSubTab === 'match' && (
        <div className="space-y-6">
          {/* Target Role Overview Banner */}
          <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#5B6573]">Current Target Role</span>
              <h2 className="text-xl font-semibold text-[#17202A] mt-1">{careerMatch?.role_title}</h2>
              <p className="text-xs text-[#5B6573] mt-1">
                Weighted proficiency coverage across {careerMatch?.required_skills_count} required technical benchmarks.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-3xl font-semibold text-[#0F766E] tabular-nums">
                {careerMatch?.match_percentage}%
              </span>
              <p className="text-xs text-[#5B6573] mt-0.5">
                {careerMatch?.matched_skills_count} of {careerMatch?.required_skills_count} skills mastered
              </p>
            </div>
          </div>

          {/* Ranked Skill Gaps Table */}
          <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-[#17202A] flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-[#B45309]" />
                <span>Prioritized Skill Gaps</span>
              </h2>
              <p className="text-xs text-[#5B6573] mt-0.5">
                Ranked by role importance, current proficiency gap, and prerequisite dependency depth.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F6F7F9] text-[#5B6573] uppercase text-[10px] font-semibold border-b border-[#DDE1E7]">
                  <tr>
                    <th className="p-3">Skill</th>
                    <th className="p-3">Current level</th>
                    <th className="p-3">Required level</th>
                    <th className="p-3">Deficit</th>
                    <th className="p-3">Importance</th>
                    <th className="p-3">Priority score</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE1E7]">
                  {careerMatch?.skill_gaps.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#F6F7F9]">
                      <td className="p-3 font-semibold text-[#17202A]">
                        <span>{item.skill_name}</span>
                        {item.is_core && (
                          <span className="ml-2 text-[10px] font-medium text-[#0F766E] bg-[#F0FDFA] px-1.5 py-0.2 rounded border border-[#CCFBF1]">
                            Core
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-[#5B6573] font-mono">{item.current_level.toFixed(1)} / 5</td>
                      <td className="p-3 text-[#5B6573] font-mono">{item.required_level.toFixed(1)} / 5</td>
                      <td className="p-3 font-medium text-[#B45309] font-mono">
                        {item.gap > 0 ? `-${item.gap.toFixed(1)}` : '0.0'}
                      </td>
                      <td className="p-3 text-[#5B6573]">{item.weight}x</td>
                      <td className="p-3 font-medium text-[#17202A] font-mono">{item.priority_score.toFixed(1)}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-[4px] text-[10px] font-medium border ${
                            item.status === 'Mastered'
                              ? 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]'
                              : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Adjacent Roles Grid */}
          <div>
            <h2 className="text-sm font-semibold text-[#17202A] mb-3">All Supported Career Tracks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {roles.map((r) => {
                const isCurrent = user?.current_role_id === r.id;
                return (
                  <div
                    key={r.id}
                    className={`p-4 rounded-[10px] border flex flex-col justify-between transition bg-white shadow-sm ${
                      isCurrent
                        ? 'border-2 border-[#0F766E] ring-1 ring-[#CCFBF1]'
                        : 'border-[#DDE1E7] hover:border-[#0F766E]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5B6573]">
                          {r.category}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded bg-[#F0FDFA] text-[#0F766E] text-[10px] font-semibold border border-[#CCFBF1]">
                            Active target
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-semibold text-[#17202A]">{r.title}</h3>
                      <p className="text-[11px] text-[#5B6573] mt-1 line-clamp-2 leading-relaxed">
                        {r.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#DDE1E7] flex items-center justify-between">
                      <span className="text-[11px] text-[#5B6573]">{r.skills.length} competencies</span>
                      {!isCurrent && (
                        <button
                          onClick={() => handleSwitch(r.id)}
                          disabled={switching !== null}
                          className="px-2.5 py-1 rounded-[4px] border border-[#DDE1E7] hover:border-[#0F766E] hover:bg-[#F0FDFA] text-[#17202A] text-xs font-medium transition"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Career Transition Planner */}
      {activeSubTab === 'transition' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B45309]">
                  Transition Planning Engine
                </span>
                <h2 className="text-lg font-semibold text-[#17202A] mt-1">
                  Transition from {careerMatch?.role_title} → Target Role
                </h2>
                <p className="text-xs text-[#5B6573] mt-0.5">
                  Select an aspirational career path to evaluate transferable skills, reusable modules, and required weeks.
                </p>
              </div>

              {/* Target Role Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-[#5B6573]">Target role:</span>
                <select
                  value={selectedTargetRole}
                  onChange={(e) => setSelectedTargetRole(Number(e.target.value))}
                  className="rounded-[6px] border border-[#DDE1E7] bg-white px-3 py-1.5 text-xs text-[#17202A] focus:border-[#0F766E] focus:outline-none"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Transition Metrics */}
            {transitionPlan && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-[#DDE1E7]">
                <div className="p-3.5 rounded-[8px] bg-[#F6F7F9] border border-[#DDE1E7]">
                  <span className="text-[11px] font-medium text-[#5B6573] uppercase">Transferable skills</span>
                  <p className="text-xl font-semibold text-[#0F766E] mt-1 tabular-nums">
                    {transitionPlan.transferability_percentage}%
                  </p>
                  <span className="text-[10px] text-[#5B6573]">Direct carry-over</span>
                </div>
                <div className="p-3.5 rounded-[8px] bg-[#F6F7F9] border border-[#DDE1E7]">
                  <span className="text-[11px] font-medium text-[#5B6573] uppercase">Reusable modules</span>
                  <p className="text-xl font-semibold text-[#17202A] mt-1 tabular-nums">
                    {transitionPlan.reusable_modules_count} Modules
                  </p>
                  <span className="text-[10px] text-[#5B6573]">Preserved from plan</span>
                </div>
                <div className="p-3.5 rounded-[8px] bg-[#F6F7F9] border border-[#DDE1E7]">
                  <span className="text-[11px] font-medium text-[#5B6573] uppercase">New modules needed</span>
                  <p className="text-xl font-semibold text-[#B45309] mt-1 tabular-nums">
                    {transitionPlan.new_modules_needed} Modules
                  </p>
                  <span className="text-[10px] text-[#5B6573]">Focused upskilling</span>
                </div>
                <div className="p-3.5 rounded-[8px] bg-[#F6F7F9] border border-[#DDE1E7]">
                  <span className="text-[11px] font-medium text-[#5B6573] uppercase">Est. transition time</span>
                  <p className="text-xl font-semibold text-[#17202A] mt-1 tabular-nums">
                    {transitionPlan.estimated_transition_weeks} Weeks
                  </p>
                  <span className="text-[10px] text-[#5B6573]">At {user?.weekly_hours || 10}h / week</span>
                </div>
              </div>
            )}
          </div>

          {/* Transferable Skills Breakdown */}
          {transitionPlan && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Transferable Skills */}
              <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-semibold text-[#17202A] flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                  <span>Transferable Core Competencies</span>
                </h3>
                <div className="space-y-2">
                  {transitionPlan.transferable_skills.map((ts, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-[6px] border border-[#DDE1E7] bg-[#F6F7F9] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[#17202A]">{ts.skill_name}</span>
                        <div className="text-[11px] text-[#5B6573] mt-0.5">
                          Current: {ts.user_level.toFixed(1)} / Required: {ts.required_level.toFixed(1)}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-[4px] bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] text-[10px] font-medium">
                        {ts.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Upskilling Requirements */}
              <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-semibold text-[#17202A] flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-[#B45309]" />
                  <span>Target Upskilling Requirements</span>
                </h3>
                <div className="space-y-2">
                  {transitionPlan.critical_gaps.map((cg, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-[6px] border border-[#FDE68A] bg-[#FFFBEB] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[#17202A]">{cg.skill_name}</span>
                        <div className="text-[11px] text-[#B45309] mt-0.5">Deficit: -{cg.gap.toFixed(1)} levels</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-[4px] bg-[#FEF3C7] text-[#B45309] text-[10px] font-medium">
                        Critical gap
                      </span>
                    </div>
                  ))}
                  {transitionPlan.moderate_gaps.map((mg, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-[6px] border border-[#DDE1E7] bg-[#F6F7F9] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[#17202A]">{mg.skill_name}</span>
                        <div className="text-[11px] text-[#5B6573] mt-0.5">Deficit: -{mg.gap.toFixed(1)} levels</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-[4px] bg-[#EEF1F5] text-[#5B6573] text-[10px] font-medium">
                        Moderate gap
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Compliance Disclaimer Banner */}
          {transitionPlan && (
            <div className="p-4 rounded-[10px] border border-[#DDE1E7] bg-white shadow-sm flex items-start space-x-3 text-xs text-[#5B6573]">
              <ShieldCheck className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#17202A]">Compliance & Ethical Advisory:</span>
                <p className="mt-0.5 leading-relaxed">{transitionPlan.disclaimer}</p>
              </div>
            </div>
          )}

          {/* Action button */}
          {transitionPlan && user?.current_role_id !== selectedTargetRole && (
            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleSwitch(selectedTargetRole)}
                disabled={switching !== null}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-xs shadow-sm transition"
              >
                <span>Switch to {transitionPlan.target_role_title} (Carry over {transitionPlan.transferability_percentage}%)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
