import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Compass,
  Radar,
  Briefcase,
  CheckCircle2,
  Bot,
  Activity,
  TrendingUp,
  Settings,
  Building,
  Target
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, user } = useAuth();

  if (!user) return null;

  const isAdminRole = user.role === 'university_admin' || user.role === 'organization_admin';

  const learnItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'roadmap', label: 'Learning Roadmap', icon: Compass },
    { id: 'assessments', label: 'Diagnostic Quizzes', icon: CheckCircle2 },
    { id: 'mentor', label: 'AI Mentor', icon: Bot },
  ];

  const insightItems = [
    { id: 'skills', label: 'Skill Profile', icon: Radar },
    { id: 'careers', label: 'Career Intelligence', icon: Briefcase },
    { id: 'analytics', label: 'Learning Progress', icon: TrendingUp },
  ];

  const systemItems = [
    { id: 'agents', label: 'Agent Activity', icon: Activity, isLive: true },
    { id: 'settings', label: 'Profile & Settings', icon: Settings },
  ];

  return (
    <aside className="w-60 bg-[#F6F7F9] border-r border-[#DDE1E7] flex flex-col shrink-0 min-h-[calc(100vh-3.5rem)] p-3 select-none text-[13px]">
      <div className="space-y-6 flex-1">
        {/* Group: Learn */}
        <div>
          <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-[#5B6573] mb-1.5">
            Learn
          </p>
          <div className="space-y-0.5">
            {learnItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 text-left transition-colors ${
                    isActive
                      ? 'bg-white text-[#17202A] font-semibold border-l-2 border-[#0F766E] shadow-sm rounded-r-[6px]'
                      : 'text-[#5B6573] hover:text-[#17202A] hover:bg-[#EEF1F5] rounded-[6px] font-normal'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#0F766E]' : 'text-[#5B6573]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Group: Insights */}
        <div>
          <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-[#5B6573] mb-1.5">
            Insights
          </p>
          <div className="space-y-0.5">
            {insightItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 text-left transition-colors ${
                    isActive
                      ? 'bg-white text-[#17202A] font-semibold border-l-2 border-[#0F766E] shadow-sm rounded-r-[6px]'
                      : 'text-[#5B6573] hover:text-[#17202A] hover:bg-[#EEF1F5] rounded-[6px] font-normal'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#0F766E]' : 'text-[#5B6573]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Group: Administration (Only shown for admin roles) */}
        {isAdminRole && (
          <div>
            <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-[#5B6573] mb-1.5">
              Administration
            </p>
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-left transition-colors ${
                  activeTab === 'admin'
                    ? 'bg-white text-[#17202A] font-semibold border-l-2 border-[#0F766E] shadow-sm rounded-r-[6px]'
                    : 'text-[#5B6573] hover:text-[#17202A] hover:bg-[#EEF1F5] rounded-[6px] font-normal'
                }`}
              >
                <Building
                  className={`w-4 h-4 shrink-0 ${
                    activeTab === 'admin' ? 'text-[#0F766E]' : 'text-[#5B6573]'
                  }`}
                />
                <span className="truncate">Admin Dashboard</span>
              </button>
            </div>
          </div>
        )}

        {/* Group: Platform */}
        <div>
          <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-[#5B6573] mb-1.5">
            System
          </p>
          <div className="space-y-0.5">
            {systemItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                    isActive
                      ? 'bg-white text-[#17202A] font-semibold border-l-2 border-[#0F766E] shadow-sm rounded-r-[6px]'
                      : 'text-[#5B6573] hover:text-[#17202A] hover:bg-[#EEF1F5] rounded-[6px] font-normal'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#0F766E]' : 'text-[#5B6573]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.isLive && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
                      Live
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Target Focus & Org Card */}
      <div className="pt-3 border-t border-[#DDE1E7] space-y-2">
        <div className="bg-white rounded-[10px] p-3 border border-[#DDE1E7] shadow-sm text-xs">
          <div className="flex items-center justify-between text-[#5B6573] mb-1">
            <span className="text-[11px] uppercase tracking-wider font-medium">Learning Goal</span>
            <Target className="w-3.5 h-3.5 text-[#0F766E]" />
          </div>
          <p className="font-semibold text-[#17202A] truncate">
            {user.current_role_id === 2 ? 'Data Scientist' : 'Full Stack Developer'}
          </p>
          <div className="mt-2 pt-2 border-t border-[#DDE1E7] flex items-center justify-between text-[11px] text-[#5B6573]">
            <span>Commitment</span>
            <span className="font-medium text-[#17202A]">{user.weekly_hours} hrs / week</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
