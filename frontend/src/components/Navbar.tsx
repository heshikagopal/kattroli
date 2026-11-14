import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import {
  Compass, Bell, CheckCircle2, ChevronDown,
  User as UserIcon, LogOut, Building, Shield, RotateCcw,
  Sparkles, Check
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    user,
    activeTab,
    setActiveTab,
    logout,
    switchRole,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    runScenarioA,
    runScenarioB,
    runScenarioC,
    runScenarioD,
    runScenarioE,
    runScenarioValidation,
    resetDemoScenario,
    notification,
    clearNotification
  } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  const handleAction = async (fn: () => Promise<any>, targetTab?: string) => {
    setIsDemoRunning(true);
    try {
      await fn();
      if (targetTab) setActiveTab(targetTab);
    } finally {
      setIsDemoRunning(false);
      setDemoMenuOpen(false);
    }
  };

  const roleLabels: Record<string, string> = {
    student: 'Student',
    employee: 'Employee',
    university_admin: 'University Administrator',
    organization_admin: 'Organization Administrator',
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#DDE1E7] bg-white">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto">
          {/* Logo & Brand: KATTR0LI (கற்றொளி) */}
          <BrandLogo
            size="md"
            onClick={() => setActiveTab(user ? (user.role.includes('admin') ? 'admin' : 'dashboard') : 'landing')}
          />

          {/* Center / Right controls */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* Evaluator Simulation Dropdown - Subtle & Uncluttered */}
                <div className="relative">
                  <button
                    onClick={() => { setDemoMenuOpen(!demoMenuOpen); setNotifDropdownOpen(false); setDropdownOpen(false); setRoleDropdownOpen(false); }}
                    className="flex items-center space-x-1.5 px-2.5 py-1 text-xs rounded-[6px] border border-[#DDE1E7] text-[#5B6573] hover:text-[#17202A] hover:bg-[#F6F7F9] transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
                    <span>Demo scenarios</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </button>

                  {demoMenuOpen && (
                    <div className="absolute right-0 mt-1.5 w-64 rounded-[10px] border border-[#DDE1E7] bg-white p-1.5 shadow-lg z-50 text-xs">
                      <p className="px-2.5 py-1 text-[11px] font-medium text-[#5B6573] border-b border-[#DDE1E7] mb-1">
                        Adaptive Triggers (Evaluation)
                      </p>
                      <button
                        onClick={() => handleAction(runScenarioA, 'roadmap')}
                        disabled={isDemoRunning}
                        className="w-full text-left px-2.5 py-1.5 rounded-[6px] hover:bg-[#F6F7F9] text-[#17202A] flex items-center justify-between"
                      >
                        <span>Take JavaScript quiz (Scores 40%)</span>
                        <span className="text-[10px] text-[#B45309] font-medium">Adapts v2</span>
                      </button>
                      <button
                        onClick={() => handleAction(runScenarioB, 'roadmap')}
                        disabled={isDemoRunning}
                        className="w-full text-left px-2.5 py-1.5 rounded-[6px] hover:bg-[#F6F7F9] text-[#17202A] flex items-center justify-between"
                      >
                        <span>Consecutive &gt;90% scores</span>
                        <span className="text-[10px] text-[#0F766E] font-medium">Compresses</span>
                      </button>
                      <button
                        onClick={() => handleAction(runScenarioC, 'mentor')}
                        disabled={isDemoRunning}
                        className="w-full text-left px-2.5 py-1.5 rounded-[6px] hover:bg-[#F6F7F9] text-[#17202A] flex items-center justify-between"
                      >
                        <span>Repeated difficulty</span>
                        <span className="text-[10px] text-[#B45309] font-medium">Decomposes</span>
                      </button>
                      <button
                        onClick={() => handleAction(runScenarioD, 'careers')}
                        disabled={isDemoRunning}
                        className="w-full text-left px-2.5 py-1.5 rounded-[6px] hover:bg-[#F6F7F9] text-[#17202A] flex items-center justify-between"
                      >
                        <span>Change career goal</span>
                        <span className="text-[10px] text-[#0F766E] font-medium">Carry-over</span>
                      </button>
                      <button
                        onClick={() => handleAction(runScenarioE, 'roadmap')}
                        disabled={isDemoRunning}
                        className="w-full text-left px-2.5 py-1.5 rounded-[6px] hover:bg-[#F6F7F9] text-[#17202A] flex items-center justify-between"
                      >
                        <span>7-day inactivity gap</span>
                        <span className="text-[10px] text-[#5B6573] font-medium">Rebalances</span>
                      </button>
                      <button
                        onClick={() => handleAction(runScenarioValidation, 'skills')}
                        disabled={isDemoRunning}
                        className="w-full text-left px-2.5 py-1.5 rounded-[6px] hover:bg-[#F6F7F9] text-[#17202A] flex items-center justify-between"
                      >
                        <span>Skill overestimation gap</span>
                        <span className="text-[10px] text-[#B45309] font-medium">Calibrates</span>
                      </button>
                      <div className="border-t border-[#DDE1E7] my-1" />
                      <button
                        onClick={() => handleAction(resetDemoScenario, 'dashboard')}
                        disabled={isDemoRunning}
                        className="w-full text-left px-2.5 py-1.5 rounded-[6px] hover:bg-[#F6F7F9] text-[#5B6573] flex items-center space-x-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset platform state</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Role Switcher Pill for Multi-Tenant Testing */}
                <div className="relative">
                  <button
                    onClick={() => { setRoleDropdownOpen(!roleDropdownOpen); setDemoMenuOpen(false); setNotifDropdownOpen(false); setDropdownOpen(false); }}
                    className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded-[6px] border border-[#DDE1E7] text-[#17202A] hover:bg-[#F6F7F9] transition"
                  >
                    <span>{roleLabels[user.role] || 'Student'}</span>
                    <ChevronDown className="w-3 h-3 text-[#5B6573]" />
                  </button>

                  {roleDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-52 rounded-[10px] border border-[#DDE1E7] bg-white p-1.5 shadow-lg z-50 text-xs">
                      <p className="px-2 py-1 text-[11px] font-medium text-[#5B6573] border-b border-[#DDE1E7] mb-1">
                        Switch active role
                      </p>
                      {(['student', 'employee', 'university_admin', 'organization_admin'] as const).map(r => (
                        <button
                          key={r}
                          onClick={() => { switchRole(r); setRoleDropdownOpen(false); }}
                          className="w-full text-left px-2.5 py-1.5 rounded-[6px] hover:bg-[#F6F7F9] text-[#17202A] flex items-center justify-between"
                        >
                          <span>{roleLabels[r]}</span>
                          {user.role === r && <Check className="w-3.5 h-3.5 text-[#0F766E]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => { setNotifDropdownOpen(!notifDropdownOpen); setDemoMenuOpen(false); setRoleDropdownOpen(false); setDropdownOpen(false); }}
                    className="relative p-1.5 rounded-[6px] text-[#5B6573] hover:text-[#17202A] hover:bg-[#F6F7F9] transition"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-[#B45309]" />
                    )}
                  </button>

                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-80 rounded-[10px] border border-[#DDE1E7] bg-white p-3 shadow-lg z-50">
                      <div className="flex items-center justify-between pb-2 border-b border-[#DDE1E7]">
                        <span className="text-xs font-semibold text-[#17202A]">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllNotificationsRead}
                            className="text-[11px] text-[#0F766E] hover:underline"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1.5 mt-2">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-[#5B6573] text-center py-4">No notifications</p>
                        ) : (
                          notifications.slice(0, 6).map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                markNotificationRead(n.id);
                                if (n.link_url) {
                                  if (n.link_url.includes('roadmap')) setActiveTab('roadmap');
                                  else if (n.link_url.includes('skills')) setActiveTab('skills');
                                  else if (n.link_url.includes('mentor')) setActiveTab('mentor');
                                }
                                setNotifDropdownOpen(false);
                              }}
                              className={`p-2 rounded-[6px] text-xs cursor-pointer transition ${
                                n.is_read
                                  ? 'text-[#5B6573] hover:bg-[#F6F7F9]'
                                  : 'bg-[#F0FDFA] text-[#17202A] font-medium hover:bg-[#CCFBF1]/40'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-[#17202A]">{n.title}</span>
                                {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-[#0F766E]" />}
                              </div>
                              <p className="text-[11px] text-[#5B6573] mt-0.5 line-clamp-2">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile menu */}
                <div className="relative">
                  <button
                    onClick={() => { setDropdownOpen(!dropdownOpen); setNotifDropdownOpen(false); setDemoMenuOpen(false); setRoleDropdownOpen(false); }}
                    className="flex items-center space-x-2 rounded-[6px] p-1 text-[#17202A] hover:bg-[#F6F7F9] transition"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#DDE1E7] text-xs font-semibold text-[#17202A]">
                      {user.full_name.charAt(0)}
                    </div>
                    <span className="text-xs font-medium text-[#17202A] hidden sm:inline-block max-w-[120px] truncate">
                      {user.full_name}
                    </span>
                    <ChevronDown className="h-3 w-3 text-[#5B6573]" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-52 rounded-[10px] border border-[#DDE1E7] bg-white p-1.5 shadow-lg z-50 text-xs">
                      <div className="px-2.5 py-2 border-b border-[#DDE1E7]">
                        <p className="font-semibold text-[#17202A] truncate">{user.full_name}</p>
                        <p className="text-[11px] text-[#5B6573] truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => { setActiveTab('dashboard'); setDropdownOpen(false); }}
                          className="w-full text-left px-2.5 py-1.5 rounded-[6px] hover:bg-[#F6F7F9] text-[#17202A]"
                        >
                          Dashboard
                        </button>
                        {user.role.includes('admin') && (
                          <button
                            onClick={() => { setActiveTab('admin'); setDropdownOpen(false); }}
                            className="w-full text-left px-2.5 py-1.5 rounded-[6px] hover:bg-[#F6F7F9] text-[#0F766E] font-medium"
                          >
                            Admin Dashboard
                          </button>
                        )}
                        <button
                          onClick={() => { setActiveTab('settings'); setDropdownOpen(false); }}
                          className="w-full text-left px-2.5 py-1.5 rounded-[6px] hover:bg-[#F6F7F9] text-[#17202A]"
                        >
                          Account settings
                        </button>
                      </div>
                      <div className="border-t border-[#DDE1E7] pt-1">
                        <button
                          onClick={() => { logout(); setDropdownOpen(false); }}
                          className="w-full text-left px-2.5 py-1.5 rounded-[6px] hover:bg-[#F6F7F9] text-[#B45309]"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('auth')}
                  className="px-3 py-1.5 rounded-[6px] text-xs font-medium text-[#17202A] hover:bg-[#F6F7F9] transition"
                >
                  Sign in
                </button>
                <button
                  onClick={() => setActiveTab('auth')}
                  className="px-3.5 py-1.5 rounded-[6px] bg-[#0F766E] text-xs font-medium text-white hover:bg-[#0D655E] transition"
                >
                  Get started
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Floating System Notification - Minimal & Clean */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in fade-in">
          <div className="p-3.5 rounded-[10px] border border-[#DDE1E7] bg-white shadow-lg text-xs flex items-start space-x-2.5">
            <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${notification.type === 'error' ? 'bg-rose-500' : notification.type === 'warning' ? 'bg-[#B45309]' : 'bg-[#0F766E]'}`} />
            <div className="flex-1 text-[#17202A] leading-relaxed">
              {notification.message}
            </div>
            <button onClick={clearNotification} className="text-[#5B6573] hover:text-[#17202A] text-xs">
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};
