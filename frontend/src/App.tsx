import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ModuleModal } from './components/ModuleModal';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { SkillAnalysisPage } from './pages/SkillAnalysisPage';
import { CareerMatchingPage } from './pages/CareerMatchingPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { MentorChatPage } from './pages/MentorChatPage';
import { AgentActivityPage } from './pages/AgentActivityPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { RoadmapItem } from './types';
import { roadmapsApi } from './api';

const MainAppContent: React.FC = () => {
  const { user, activeTab, refreshUser, showNotification } = useAuth();
  const [selectedModule, setSelectedModule] = useState<RoadmapItem | null>(null);

  const handleToggleComplete = async (moduleId: number) => {
    try {
      const res = await roadmapsApi.toggleComplete(moduleId);
      showNotification(
        res.new_status === 'completed' ? 'success' : 'info',
        `Module marked as ${res.new_status.replace('_', ' ')}!`
      );
      if (selectedModule && selectedModule.id === moduleId) {
        setSelectedModule({ ...selectedModule, status: res.new_status as any });
      }
      await refreshUser();
    } catch (e: any) {
      showNotification('error', `Failed to update status: ${e.message}`);
    }
  };

  // If user is not signed in and on landing or auth or onboarding
  if (!user) {
    if (activeTab === 'auth') {
      return (
        <div className="min-h-screen bg-[#F6F7F9] text-[#17202A]">
          <Navbar />
          <AuthPage />
        </div>
      );
    }
    if (activeTab === 'onboarding') {
      return (
        <div className="min-h-screen bg-[#F6F7F9] text-[#17202A]">
          <Navbar />
          <OnboardingPage />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#F6F7F9] text-[#17202A]">
        <Navbar />
        <LandingPage />
      </div>
    );
  }

  // If signed in but currently in onboarding tab
  if (activeTab === 'onboarding') {
    return (
      <div className="min-h-screen bg-[#F6F7F9] text-[#17202A]">
        <Navbar />
        <OnboardingPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#17202A] flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardPage onSelectModule={(mod) => setSelectedModule(mod)} />
          )}
          {activeTab === 'roadmap' && (
            <RoadmapPage onSelectModule={(mod) => setSelectedModule(mod)} />
          )}
          {activeTab === 'skills' && <SkillAnalysisPage />}
          {activeTab === 'careers' && <CareerMatchingPage />}
          {activeTab === 'assessments' && <AssessmentPage />}
          {activeTab === 'mentor' && <MentorChatPage />}
          {activeTab === 'agents' && <AgentActivityPage />}
          {activeTab === 'analytics' && <AnalyticsPage />}
          {activeTab === 'admin' && <AdminDashboardPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global Module Detail & Submission Modal */}
      <ModuleModal
        module={selectedModule}
        onClose={() => setSelectedModule(null)}
        onToggleComplete={handleToggleComplete}
        onRefresh={refreshUser}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;
