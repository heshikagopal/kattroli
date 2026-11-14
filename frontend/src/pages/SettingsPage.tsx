import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { careersApi } from '../api';
import { Role } from '../types';
import {
  ArrowRightLeft,
  RotateCcw,
  CheckCircle2,
  User as UserIcon,
  Sparkles
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, setActiveTab, resetDemoScenario, showNotification } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<number>(user?.current_role_id || 1);
  const [switching, setSwitching] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [carryoverResult, setCarryoverResult] = useState<any>(null);

  useEffect(() => {
    careersApi.getRoles().then((r) => setRoles(r)).catch(() => {});
    if (user?.current_role_id) setSelectedRole(user.current_role_id);
  }, [user]);

  const handleCareerSwitch = async () => {
    setSwitching(true);
    try {
      const res = await careersApi.switchRole(selectedRole);
      setCarryoverResult(res);
      await refreshUser();
      showNotification(
        'success',
        `${res.carry_over_percentage}% of your learning progress carried over to ${res.new_role_title}!`
      );
    } catch (e: any) {
      showNotification('error', `Failed to switch career goal: ${e.message}`);
    } finally {
      setSwitching(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm("Reset demo data to initial baseline state (Roadmap v1 active)?")) {
      setResetting(true);
      try {
        await resetDemoScenario();
        await refreshUser();
        setActiveTab('dashboard');
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-[#17202A]">Profile & Career Target Settings</h1>
        <p className="text-xs text-[#5B6573] mt-1 leading-relaxed">
          Switch your career goal with intelligent progress carry-over or reset demonstration account telemetry.
        </p>
      </div>

      {/* Profile Overview */}
      <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-5 shadow-sm">
        <h3 className="text-xs font-semibold text-[#17202A] uppercase tracking-wider mb-4 flex items-center space-x-2">
          <UserIcon className="w-4 h-4 text-[#0F766E]" />
          <span>Learner Profile</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[11px] text-[#5B6573] uppercase font-medium block">Learner name</span>
            <span className="text-[#17202A] font-semibold text-sm mt-0.5 block">{user?.full_name || 'Alex Rivera'}</span>
          </div>
          <div>
            <span className="text-[11px] text-[#5B6573] uppercase font-medium block">Email address</span>
            <span className="text-[#17202A] font-mono mt-0.5 block">{user?.email || 'alex@kattr0li.ai'}</span>
          </div>
          <div>
            <span className="text-[11px] text-[#5B6573] uppercase font-medium block">Educational background</span>
            <span className="text-[#17202A] mt-0.5 block">{user?.education || 'Computer Science Student'}</span>
          </div>
          <div>
            <span className="text-[11px] text-[#5B6573] uppercase font-medium block">Weekly study pace</span>
            <span className="text-[#0F766E] font-semibold mt-0.5 block">{user?.weekly_hours || 10} hours / week</span>
          </div>
        </div>
      </div>

      {/* Career Goal Switcher Section */}
      <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-6 shadow-sm">
        <div className="flex items-center space-x-2.5 mb-2">
          <div className="p-2 rounded-[6px] bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#17202A]">Dynamic Career Goal Transition</h3>
            <p className="text-xs text-[#5B6573]">Adaptive carry-over algorithm preserves overlapping skill proficiencies</p>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-[#17202A] mb-2.5">
            Select target career track:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {roles.map((r) => {
              const isSelected = selectedRole === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`p-3.5 rounded-[8px] border cursor-pointer transition select-none ${
                    isSelected
                      ? 'border-2 border-[#0F766E] bg-[#F0FDFA] text-[#17202A]'
                      : 'border-[#DDE1E7] bg-white text-[#17202A] hover:border-[#0F766E]'
                  }`}
                >
                  <span className="text-[10px] font-semibold text-[#5B6573] uppercase tracking-wider block mb-1">
                    {r.category}
                  </span>
                  <h4 className="text-xs font-semibold">{r.title}</h4>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleCareerSwitch}
            disabled={switching || selectedRole === user?.current_role_id}
            className="px-5 py-2.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-medium transition flex items-center space-x-2 shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{switching ? 'Recalculating skill matrix...' : 'Switch career goal & adapt roadmap'}</span>
          </button>
        </div>

        {/* Carry-over Explanation Output */}
        {carryoverResult && (
          <div className="mt-6 p-4 rounded-[8px] border border-[#CCFBF1] bg-[#F0FDFA] animate-in fade-in">
            <div className="flex items-center space-x-2 text-[#0F766E] text-xs font-semibold mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Goal switched to {carryoverResult.new_role_title}</span>
            </div>
            <p className="text-xs text-[#17202A] leading-relaxed">
              {carryoverResult.explanation}
            </p>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#CCFBF1] text-xs">
              <div>
                <span className="text-[11px] font-semibold uppercase text-[#0F766E] block mb-1">
                  Overlapping skills preserved ({carryoverResult.overlapping_skills.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {carryoverResult.overlapping_skills.map((s: any, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-[4px] bg-white text-[#0F766E] border border-[#CCFBF1] text-[11px] font-medium"
                    >
                      {s.skill_name} ({s.current_level} / {s.required_level})
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase text-[#17202A] block mb-1">
                  New required skills added
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {carryoverResult.new_required_skills.map((s: any, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-[4px] bg-white text-[#17202A] border border-[#DDE1E7] text-[11px] font-medium"
                    >
                      {s.skill_name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('roadmap')}
              className="mt-4 px-4 py-2 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-medium transition shadow-sm"
            >
              <span>View new {carryoverResult.new_role_title} roadmap</span>
            </button>
          </div>
        )}
      </div>

      {/* Demo State Reset Box */}
      <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-5 shadow-sm">
        <h3 className="text-xs font-semibold text-[#17202A] uppercase tracking-wider mb-1 flex items-center space-x-2">
          <RotateCcw className="w-3.5 h-3.5 text-[#5B6573]" />
          <span>Reset Demonstration Account</span>
        </h3>
        <p className="text-xs text-[#5B6573] mb-3">
          Resets Alex Rivera's account back to initial baseline: Full Stack Developer v1, Python 3, SQL 3, HTML 2, CSS 2, JS 1.
        </p>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="px-4 py-2 rounded-[6px] border border-[#DDE1E7] hover:border-[#B91C1C] hover:bg-[#FEF2F2] text-[#5B6573] hover:text-[#B91C1C] text-xs font-medium transition flex items-center space-x-1.5 disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{resetting ? 'Resetting...' : 'Reset demo to baseline'}</span>
        </button>
      </div>
    </div>
  );
};
