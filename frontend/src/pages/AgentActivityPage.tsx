import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { agentsApi } from '../api';
import { AgentLog, AgentStreamEvent } from '../types';
import {
  Activity,
  ArrowRight,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Terminal
} from 'lucide-react';

export const AgentActivityPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<AgentStreamEvent[]>([]);
  const [dbLogs, setDbLogs] = useState<AgentLog[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [sseConnected, setSseConnected] = useState<boolean>(false);

  // Fetch initial logs from database
  const loadDbLogs = async () => {
    try {
      const logs = await agentsApi.getLogs(60);
      setDbLogs(logs);
      // Map logs to stream format for unified view
      const mapped: AgentStreamEvent[] = logs.map((l) => ({
        event_id: `log-${l.id}`,
        user_id: user?.id || 1,
        agent_name: l.agent_name,
        status: l.status as any,
        task: l.task,
        input_summary: l.input_summary || '',
        output_summary: l.output_summary || '',
        execution_time_ms: l.execution_time_ms,
        next_agent: l.next_agent,
        metadata: l.metadata_json ? JSON.parse(l.metadata_json) : {},
        timestamp: l.created_at
      }));
      setEvents(mapped);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDbLogs();
  }, [user]);

  // Connect Server-Sent Events (SSE) stream
  useEffect(() => {
    const url = `/api/agents/stream${user?.id ? `?user_id=${user.id}` : ''}`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setSseConnected(true);
    };

    eventSource.onmessage = (e) => {
      try {
        const payload: AgentStreamEvent = JSON.parse(e.data);
        if (payload && payload.agent_name) {
          setEvents((prev) => {
            if (prev.some((x) => x.event_id === payload.event_id)) return prev;
            return [payload, ...prev];
          });
        }
      } catch (_) {}
    };

    eventSource.onerror = () => {
      setSseConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [user]);

  const AGENTS = [
    { name: 'Profiler Agent', role: 'Profile & Resume Analysis' },
    { name: 'Skill Analyst Agent', role: 'Gap & Radar Vector Audit' },
    { name: 'Career Matcher Agent', role: 'Role Fit & Priority Algorithm' },
    { name: 'Path Planner Agent', role: 'Curriculum Synthesis' },
    { name: 'Resource Curator Agent', role: 'Catalog Retrieval' },
    { name: 'Assessment Agent', role: 'Diagnostic Testing & Grading' },
    { name: 'Progress Evaluator Agent', role: 'Adaptive Replanning' },
    { name: 'Mentor Agent', role: 'Pedagogical Guidance' },
  ];

  const filteredEvents =
    selectedAgent === 'all'
      ? events
      : events.filter((e) => e.agent_name.toLowerCase().includes(selectedAgent.toLowerCase()));

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header with SSE Indicator */}
      <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#0F766E] bg-[#F0FDFA] px-2 py-0.5 rounded border border-[#CCFBF1]">
              Multi-Agent Orchestration
            </span>
            <span
              className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-medium border ${
                sseConnected
                  ? 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]'
                  : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${sseConnected ? 'bg-[#0F766E]' : 'bg-[#B45309]'}`} />
              <span>{sseConnected ? 'Event stream active' : 'Connecting stream...'}</span>
            </span>
          </div>
          <h1 className="text-xl font-semibold text-[#17202A] mt-2">
            Agent Activity Center
          </h1>
          <p className="text-xs text-[#5B6573] mt-1 leading-relaxed">
            Real-time telemetry and state transfers across specialized AI agents in the learning pipeline.
          </p>
        </div>

        {/* Filter by Agent */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-[#5B6573]" />
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="rounded-[6px] border border-[#DDE1E7] bg-white py-1.5 px-3 text-xs text-[#17202A] focus:border-[#0F766E] focus:outline-none"
          >
            <option value="all">All 8 Agents</option>
            {AGENTS.map((a, i) => (
              <option key={i} value={a.name}>{a.name}</option>
            ))}
          </select>
          <button
            onClick={loadDbLogs}
            className="p-1.5 rounded-[6px] border border-[#DDE1E7] bg-white text-[#5B6573] hover:text-[#17202A] hover:bg-[#F6F7F9] transition"
            title="Refresh logs from DB"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Visual Multi-Agent Architecture Nodes Bar */}
      <div className="bg-white border border-[#DDE1E7] rounded-[10px] p-5 shadow-sm overflow-x-auto">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5B6573] mb-3 block">
          Agent Execution Pipeline
        </span>
        <div className="flex items-center space-x-2 min-w-[850px]">
          {AGENTS.map((agent, i) => {
            const isSelected = selectedAgent === agent.name;
            return (
              <React.Fragment key={i}>
                <div
                  onClick={() => setSelectedAgent(isSelected ? 'all' : agent.name)}
                  className={`flex-1 p-2.5 rounded-[6px] border text-center cursor-pointer transition select-none ${
                    isSelected
                      ? 'border-[#0F766E] bg-[#F0FDFA] text-[#17202A]'
                      : 'border-[#DDE1E7] bg-white hover:border-[#0F766E] text-[#17202A]'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                    <span className="text-[11px] font-semibold truncate">
                      {agent.name.replace(' Agent', '')}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#5B6573] truncate">{agent.role}</p>
                </div>
                {i < AGENTS.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-[#5B6573] shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Stream Events Timeline List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#5B6573] px-1">
          <span className="font-medium">{filteredEvents.length} execution events recorded</span>
          <span className="font-mono text-[11px]">Latest events first</span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center border border-[#DDE1E7] rounded-[10px] bg-white text-[#5B6573]">
            <Activity className="w-6 h-6 mx-auto mb-2 text-[#5B6573]" />
            <p className="text-xs">No agent events logged matching the current filter.</p>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isExpanded = expandedEventId === evt.event_id;
            const isAdapted = evt.status === 'adapted';

            return (
              <div
                key={evt.event_id}
                className={`p-4 rounded-[8px] border transition shadow-sm bg-white ${
                  isAdapted
                    ? 'border-[#FDE68A] bg-[#FFFBEB]/30'
                    : 'border-[#DDE1E7]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="px-2 py-0.5 rounded-[4px] bg-[#EEF1F5] text-[#17202A] font-semibold text-xs">
                      {evt.agent_name}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-[4px] text-[10px] font-medium uppercase border ${
                        isAdapted
                          ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                          : 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]'
                      }`}
                    >
                      {evt.status}
                    </span>

                    <span className="text-[11px] text-[#5B6573] font-mono flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-[#5B6573]" />
                      <span>{evt.execution_time_ms} ms</span>
                    </span>
                  </div>

                  <span className="text-[11px] text-[#5B6573] font-mono">
                    {new Date(evt.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>

                {/* Task Name */}
                <h4 className="text-xs font-semibold text-[#17202A] mb-2 flex items-center space-x-2">
                  <span className="text-[#5B6573]">Task:</span>
                  <span>{evt.task}</span>
                </h4>

                {/* Input Summary */}
                {evt.input_summary && (
                  <div className="p-2.5 rounded-[6px] bg-[#F6F7F9] border border-[#DDE1E7] text-xs mb-2">
                    <span className="text-[10px] text-[#5B6573] uppercase font-semibold block mb-0.5">
                      Input summary:
                    </span>
                    <p className="text-[#17202A] leading-relaxed">{evt.input_summary}</p>
                  </div>
                )}

                {/* Output Summary */}
                <div className="p-2.5 rounded-[6px] bg-[#F6F7F9] border border-[#DDE1E7] text-xs mb-2">
                  <span className="text-[10px] text-[#5B6573] uppercase font-semibold block mb-0.5">
                    Output summary:
                  </span>
                  <p className="text-[#17202A] leading-relaxed font-mono text-[11px]">
                    {evt.output_summary}
                  </p>
                </div>

                {/* Next Agent in Pipeline */}
                {evt.next_agent && (
                  <div className="flex items-center space-x-1.5 text-[11px] text-[#0F766E] font-medium pt-1">
                    <span className="text-[#5B6573]">Transmitting state to:</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span className="bg-[#F0FDFA] px-2 py-0.5 rounded-[4px] border border-[#CCFBF1]">
                      {evt.next_agent}
                    </span>
                  </div>
                )}

                {/* Metadata JSON Inspector Toggle */}
                {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-[#DDE1E7]">
                    <button
                      onClick={() => setExpandedEventId(isExpanded ? null : evt.event_id)}
                      className="text-[11px] text-[#5B6573] hover:text-[#17202A] font-medium flex items-center space-x-1"
                    >
                      <Terminal className="w-3 h-3" />
                      <span>{isExpanded ? 'Hide payload metadata' : 'Inspect payload metadata'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {isExpanded && (
                      <pre className="mt-2 p-3 rounded-[6px] bg-[#F6F7F9] border border-[#DDE1E7] text-[11px] text-[#17202A] font-mono overflow-x-auto">
                        {JSON.stringify(evt.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
