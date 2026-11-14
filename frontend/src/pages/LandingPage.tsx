import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';
import {
  Compass,
  ArrowRight,
  Sparkles,
  Layers,
  ShieldCheck,
  Bot
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setActiveTab, loginAsDemo } = useAuth();

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#17202A] flex flex-col font-sans">
      {/* Hero Section */}
      <section className="pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-6">
            <BrandLogo size="xl" showMeaning={true} showTagline={true} />
          </div>

          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-[4px] bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E] text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Adaptive Learning Platform • Learn. Discover. Evolve.</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#17202A] max-w-4xl mx-auto leading-tight">
            Personalized learning powered by{' '}
            <span className="text-[#0F766E]">collaborative AI agents</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#5B6573] max-w-2xl mx-auto leading-relaxed">
            Unlike static course platforms, <strong className="text-[#17202A] font-semibold">KATTR0LI (கற்றொளி)</strong> orchestrates specialized AI agents via LangGraph to audit your skills, match your career target, curate verified materials, and automatically adapt your roadmap when you encounter roadblocks.
          </p>

          {/* Primary CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={loginAsDemo}
              className="px-6 py-3 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-sm shadow-sm transition flex items-center space-x-2"
            >
              <span>Launch demo (Alex Rivera)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('onboarding')}
              className="px-6 py-3 rounded-[6px] bg-white hover:bg-[#EEF1F5] text-[#17202A] font-medium text-sm border border-[#DDE1E7] transition shadow-sm"
            >
              Create personalized profile
            </button>
          </div>

          {/* Key Metric Highlights */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-[10px] border border-[#DDE1E7] bg-white shadow-sm text-left">
              <p className="text-2xl font-semibold text-[#0F766E] tabular-nums">8 Agents</p>
              <p className="text-xs text-[#5B6573] mt-0.5">LangGraph multi-agent orchestration</p>
            </div>
            <div className="p-4 rounded-[10px] border border-[#DDE1E7] bg-white shadow-sm text-left">
              <p className="text-2xl font-semibold text-[#0F766E] tabular-nums">100%</p>
              <p className="text-xs text-[#5B6573] mt-0.5">Verified free learning resources</p>
            </div>
            <div className="p-4 rounded-[10px] border border-[#DDE1E7] bg-white shadow-sm text-left">
              <p className="text-2xl font-semibold text-[#B45309] tabular-nums">Dynamic</p>
              <p className="text-xs text-[#5B6573] mt-0.5">Continuous roadmap adaptation</p>
            </div>
            <div className="p-4 rounded-[10px] border border-[#DDE1E7] bg-white shadow-sm text-left">
              <p className="text-2xl font-semibold text-[#17202A] tabular-nums">Multi-Tenant</p>
              <p className="text-xs text-[#5B6573] mt-0.5">University & enterprise support</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars Section */}
      <section className="py-16 bg-white border-t border-[#DDE1E7]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-semibold text-[#17202A]">
              Designed around three core pillars
            </h2>
            <p className="text-xs text-[#5B6573] mt-2">
              Every feature is built to deliver real student outcomes, verifiable mastery, and visible multi-agent reasoning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-[10px] border border-[#DDE1E7] bg-[#F6F7F9] shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-[6px] bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E] flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[#17202A]">1. Evidence-Based Personalization</h3>
              <p className="text-xs text-[#5B6573] leading-relaxed">
                Rather than trusting self-ratings, KATTR0LI (கற்றொளி) synthesizes resumes, diagnostic quizzes, and practical exercises using weighted normalization.
              </p>
            </div>

            <div className="p-6 rounded-[10px] border border-[#DDE1E7] bg-[#F6F7F9] shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-[6px] bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E] flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[#17202A]">2. Visible Multi-Agent Architecture</h3>
              <p className="text-xs text-[#5B6573] leading-relaxed">
                Eight distinct agents collaborate via LangGraph, with Server-Sent Events streaming prompts, telemetry, and state transitions live.
              </p>
            </div>

            <div className="p-6 rounded-[10px] border border-[#DDE1E7] bg-[#F6F7F9] shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-[6px] bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[#17202A]">3. Closed-Loop Adaptive Learning</h3>
              <p className="text-xs text-[#5B6573] leading-relaxed">
                When a diagnostic quiz reveals a misconception, the Path Planner automatically re-synthesizes your curriculum with targeted prerequisites.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
