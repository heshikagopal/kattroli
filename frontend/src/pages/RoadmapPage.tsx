import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { roadmapsApi } from '../api';
import { Roadmap, RoadmapItem, RoadmapComparison } from '../types';
import { RoadmapFlow } from '../components/RoadmapFlow';
import { SkillDependencyGraph } from '../components/SkillDependencyGraph';
import {
  Compass,
  CheckCircle2,
  Clock,
  AlertCircle,
  GitCompare,
  GitFork,
  List,
  Sparkles
} from 'lucide-react';

interface RoadmapPageProps {
  onSelectModule: (module: RoadmapItem) => void;
}

export const RoadmapPage: React.FC<RoadmapPageProps> = ({ onSelectModule }) => {
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'flow' | 'list' | 'compare' | 'dag'>('flow');
  const [comparisonData, setComparisonData] = useState<RoadmapComparison | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const [rm, vers] = await Promise.all([
        roadmapsApi.getActive(),
        roadmapsApi.getVersions().catch(() => [])
      ]);
      setRoadmap(rm);
      setVersions(vers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadComparison = async () => {
    try {
      const data = await roadmapsApi.compareVersions();
      setComparisonData(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, [user]);

  useEffect(() => {
    if (viewMode === 'compare') {
      loadComparison();
    }
  }, [viewMode]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center space-x-3 text-[#5B6573]">
          <div className="w-5 h-5 border-2 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading learning roadmap...</span>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="text-center py-20 bg-white border border-[#DDE1E7] rounded-[10px] p-8">
        <Compass className="w-10 h-10 text-[#5B6573] mx-auto mb-3" />
        <h3 className="text-base font-semibold text-[#17202A]">No roadmap initialized</h3>
        <p className="text-xs text-[#5B6573] mt-1">Please complete onboarding to generate your personalized plan.</p>
      </div>
    );
  }

  const completedCount = roadmap.items.filter((i) => i.status === 'completed').length;
  const progressPct = Math.round((completedCount / (roadmap.items.length || 1)) * 100);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header bar with Versioning, Adaptation Reason, and View Mode Tabs */}
      <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-[#5B6573] bg-[#EEF1F5] px-2 py-0.5 rounded-[4px]">
              Version {roadmap.version}
            </span>
            <span className="text-xs text-[#5B6573]">• {roadmap.total_weeks} weeks planned</span>
            {roadmap.version > 1 && (
              <span className="text-xs font-medium text-[#B45309] bg-[#FFFBEB] px-2 py-0.5 rounded-[4px] border border-[#FDE68A] flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Adapted via Progress Evaluator</span>
              </span>
            )}
          </div>
          <h1 className="text-xl font-semibold text-[#17202A] mt-1.5">{roadmap.title}</h1>
          {roadmap.reason_for_adaptation && (
            <p className="text-xs text-[#B45309] mt-1 leading-relaxed">
              <span className="font-semibold">Adaptation rationale:</span> {roadmap.reason_for_adaptation}
            </p>
          )}
        </div>

        {/* View Mode Selector Tabs */}
        <div className="flex items-center space-x-1 bg-[#EEF1F5] p-1 rounded-[6px] text-xs shrink-0">
          <button
            onClick={() => setViewMode('flow')}
            className={`px-3 py-1.5 rounded-[4px] font-medium transition flex items-center space-x-1.5 ${
              viewMode === 'flow'
                ? 'bg-white text-[#17202A] shadow-sm font-semibold'
                : 'text-[#5B6573] hover:text-[#17202A]'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Interactive graph</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-[4px] font-medium transition flex items-center space-x-1.5 ${
              viewMode === 'list'
                ? 'bg-white text-[#17202A] shadow-sm font-semibold'
                : 'text-[#5B6573] hover:text-[#17202A]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Module list</span>
          </button>
          <button
            onClick={() => setViewMode('compare')}
            className={`px-3 py-1.5 rounded-[4px] font-medium transition flex items-center space-x-1.5 ${
              viewMode === 'compare'
                ? 'bg-white text-[#17202A] shadow-sm font-semibold'
                : 'text-[#5B6573] hover:text-[#17202A]'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Version diff</span>
          </button>
          <button
            onClick={() => setViewMode('dag')}
            className={`px-3 py-1.5 rounded-[4px] font-medium transition flex items-center space-x-1.5 ${
              viewMode === 'dag'
                ? 'bg-white text-[#17202A] shadow-sm font-semibold'
                : 'text-[#5B6573] hover:text-[#17202A]'
            }`}
          >
            <GitFork className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Prerequisites</span>
          </button>
        </div>
      </div>

      {/* Progress & Milestone Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-[10px] border border-[#DDE1E7] bg-white shadow-sm">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#5B6573]">Total Curriculum</span>
          <p className="text-xl font-semibold text-[#17202A] mt-1 tabular-nums">{roadmap.items.length} Modules</p>
          <span className="text-[11px] text-[#5B6573]">{roadmap.total_weeks} weeks duration</span>
        </div>
        <div className="p-4 rounded-[10px] border border-[#DDE1E7] bg-white shadow-sm">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#5B6573]">Completion Pace</span>
          <p className="text-xl font-semibold text-[#0F766E] mt-1 tabular-nums">{progressPct}% Complete</p>
          <span className="text-[11px] text-[#5B6573]">{completedCount} of {roadmap.items.length} validated</span>
        </div>
        <div className="p-4 rounded-[10px] border border-[#DDE1E7] bg-white shadow-sm">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#5B6573]">Weekly Commitment</span>
          <p className="text-xl font-semibold text-[#17202A] mt-1 tabular-nums">{user?.weekly_hours || 10} hrs / wk</p>
          <span className="text-[11px] text-[#0F766E] font-medium">Optimal pace</span>
        </div>
        <div className="p-4 rounded-[10px] border border-[#DDE1E7] bg-white shadow-sm">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#5B6573]">Roadmap Versions</span>
          <p className="text-xl font-semibold text-[#17202A] mt-1 tabular-nums">{versions.length || 1} Version{versions.length > 1 ? 's' : ''}</p>
          <span className="text-[11px] text-[#5B6573]">Adaptive history tracked</span>
        </div>
      </div>

      {/* VIEW 1: Interactive Graph */}
      {viewMode === 'flow' && (
        <div className="space-y-2">
          <RoadmapFlow roadmap={roadmap} onSelectModule={onSelectModule} />
        </div>
      )}

      {/* VIEW 2: Module List */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {roadmap.items.map((item) => {
            const isCompleted = item.status === 'completed';
            const isRemedial = item.is_remedial;
            return (
              <div
                key={item.id}
                onClick={() => onSelectModule(item)}
                className={`p-4 rounded-[8px] border cursor-pointer transition bg-white shadow-sm hover:border-[#0F766E] ${
                  isRemedial
                    ? 'border-[#FDE68A] bg-[#FFFBEB]/30'
                    : isCompleted
                    ? 'border-[#DDE1E7] bg-[#F6F7F9]'
                    : 'border-[#DDE1E7]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono text-[#5B6573] bg-[#EEF1F5] px-2 py-0.5 rounded-[4px]">
                        Week {item.week_number}
                      </span>
                      {isRemedial && (
                        <span className="text-[11px] font-medium text-[#B45309] bg-[#FFFBEB] px-2 py-0.5 rounded-[4px] border border-[#FDE68A]">
                          Adapted module
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-[4px] ${
                          isCompleted
                            ? 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]'
                            : 'bg-[#EEF1F5] text-[#5B6573]'
                        }`}
                      >
                        {item.status === 'completed' ? 'Completed' : item.status === 'in_progress' ? 'In progress' : 'Planned'}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#17202A] mt-1.5">{item.title}</h3>
                    <p className="text-xs text-[#5B6573] mt-1 line-clamp-1">
                      {item.learning_objectives.join(' • ')}
                    </p>
                    {item.explanation_gap && (
                      <p className="text-xs text-[#5B6573] mt-1.5 flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
                        <span><strong className="text-[#17202A]">Rationale:</strong> {item.explanation_gap}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-[#5B6573] flex items-center space-x-1 justify-end">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.duration_hours}h</span>
                    </span>
                    <span className="text-[11px] text-[#0F766E] font-medium mt-1 block">
                      {item.resources.length} verified resources
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: Version Diff / Comparison */}
      {viewMode === 'compare' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-1">
              <GitCompare className="w-4 h-4 text-[#B45309]" />
              <h2 className="text-sm font-semibold text-[#17202A]">Roadmap version comparison & semantic diff</h2>
            </div>
            <p className="text-xs text-[#5B6573] max-w-2xl">
              Inspect how the Multi-Agent System adapts your curriculum when diagnostic assessment scores, high streaks, or career goal transitions occur.
            </p>

            {comparisonData && (
              <div className="mt-4 p-4 rounded-[6px] bg-[#F6F7F9] border border-[#DDE1E7] text-xs">
                <span className="font-semibold text-[#17202A]">Adaptation Rationale:</span>
                <p className="text-[#5B6573] mt-1 leading-relaxed">{comparisonData.adaptation_reason}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] font-medium">
                    Added: {comparisonData.added_modules.length} Modules
                  </span>
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] font-medium">
                    Modified: {comparisonData.delayed_modules.length} Modules
                  </span>
                  <span className="px-2 py-0.5 rounded-[4px] bg-white text-[#5B6573] border border-[#DDE1E7] font-medium">
                    Trigger: {comparisonData.trigger_event || 'Diagnostic Outcome'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Module Diff Matrix Table */}
          {comparisonData?.comparison_table && (
            <div className="bg-white border border-[#DDE1E7] rounded-[10px] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F6F7F9] text-[#5B6573] uppercase text-[10px] font-semibold border-b border-[#DDE1E7]">
                    <tr>
                      <th className="p-3">Module title</th>
                      <th className="p-3">Skill</th>
                      <th className="p-3">Initial status</th>
                      <th className="p-3">Adapted status</th>
                      <th className="p-3">Change type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE1E7]">
                    {comparisonData.comparison_table.map((row, idx) => {
                      const tagStyles = {
                        added: 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]',
                        delayed: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
                        completed: 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]',
                        reused: 'bg-[#EEF1F5] text-[#5B6573] border-[#DDE1E7]',
                        removed: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]',
                      };
                      return (
                        <tr key={idx} className="hover:bg-[#F6F7F9]">
                          <td className="p-3 font-medium text-[#17202A]">{row.module_title}</td>
                          <td className="p-3 text-[#5B6573]">{row.skill_name || 'General'}</td>
                          <td className="p-3 text-[#5B6573]">{row.version_1_status}</td>
                          <td className="p-3 font-medium text-[#17202A]">{row.version_2_status}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-[4px] text-[10px] font-medium uppercase tracking-wider border ${
                                tagStyles[row.change_type] || tagStyles.reused
                              }`}
                            >
                              {row.change_type}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: Prerequisite Dependency DAG */}
      {viewMode === 'dag' && (
        <div className="space-y-4">
          <SkillDependencyGraph />
        </div>
      )}
    </div>
  );
};
