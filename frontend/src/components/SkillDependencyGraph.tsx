import React, { useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  MarkerType
} from '@xyflow/react';
import { skillsApi } from '../api';
import { PrerequisiteGraphResponse } from '../types';
import { Lock, CheckCircle2, ShieldCheck, Clock, Sparkles } from 'lucide-react';

export const SkillDependencyGraph: React.FC = () => {
  const [graphData, setGraphData] = useState<PrerequisiteGraphResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    skillsApi.getPrerequisitesGraph()
      .then(res => setGraphData(res))
      .catch(err => console.error('Failed to load prerequisite DAG:', err))
      .finally(() => setLoading(false));
  }, []);

  const { nodes, edges } = useMemo(() => {
    if (!graphData) return { nodes: [], edges: [] };

    // Layout nodes into functional tiers:
    // Tier 0 (Foundations): HTML/CSS, Python, SQL, Linux, Git
    // Tier 1 (Core Web/Data): JavaScript, Data Analysis, REST APIs
    // Tier 2 (Frameworks & Specialization): React, Node.js, Machine Learning, Cloud Computing
    const tierMap: Record<number, number> = {
      3: 0, // HTML/CSS
      1: 0, // Python
      6: 0, // SQL
      7: 0, // Git
      2: 1, // JavaScript
      12: 1, // Data Analysis
      8: 1, // REST APIs
      4: 2, // React
      5: 2, // Node.js
      9: 2, // Machine Learning
      10: 2, // Cloud Computing
      11: 2, // Cybersecurity
    };

    const tierY = [40, 220, 400];
    const tierCounters = [0, 0, 0];

    const calculatedNodes: Node[] = graphData.nodes.map(n => {
      const tier = tierMap[n.skill_id] ?? 1;
      const indexInTier = tierCounters[tier]++;
      const xPos = 40 + indexInTier * 260;
      const yPos = tierY[tier];

      const statusStyles = {
        completed: {
          bg: 'bg-[#F0FDFA] border border-[#0F766E]/50 text-[#17202A]',
          badge: 'bg-[#CCFBF1] text-[#0F766E]',
          icon: CheckCircle2,
          text: 'Completed'
        },
        validated: {
          bg: 'bg-white border border-[#0F766E] text-[#17202A]',
          badge: 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]',
          icon: ShieldCheck,
          text: 'Validated'
        },
        in_progress: {
          bg: 'bg-white border-2 border-[#0F766E] text-[#17202A] ring-2 ring-[#CCFBF1]',
          badge: 'bg-[#E0F2FE] text-[#0369A1]',
          icon: Clock,
          text: 'In progress'
        },
        locked: {
          bg: 'bg-[#F6F7F9] border border-[#DDE1E7] text-[#5B6573]',
          badge: 'bg-[#EEF1F5] text-[#5B6573]',
          icon: Lock,
          text: 'Prerequisite needed'
        },
        recommended: {
          bg: 'bg-[#FFFBEB] border border-[#B45309] text-[#17202A]',
          badge: 'bg-[#FEF3C7] text-[#B45309]',
          icon: Sparkles,
          text: 'Recommended next'
        }
      };

      const style = statusStyles[n.status] || statusStyles.in_progress;
      const Icon = style.icon;

      return {
        id: n.id,
        position: { x: xPos, y: yPos },
        data: {
          label: (
            <div className={`p-3.5 rounded-[8px] border shadow-sm transition w-[220px] select-none ${style.bg}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5B6573] truncate">
                  {n.category || 'Skill'}
                </span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] flex items-center space-x-1 ${style.badge}`}>
                  <Icon className="w-3 h-3" />
                  <span>{style.text}</span>
                </span>
              </div>
              <h4 className="text-xs font-semibold text-[#17202A] truncate">
                {n.label}
              </h4>
              <div className="mt-2 flex items-center justify-between text-[11px] text-[#5B6573] pt-1.5 border-t border-[#DDE1E7]">
                <span>Proficiency:</span>
                <span className="font-semibold text-[#17202A] font-mono">{n.proficiency} / 5</span>
              </div>
            </div>
          )
        }
      };
    });

    const calculatedEdges: Edge[] = graphData.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: e.is_strict,
      style: {
        stroke: e.is_strict ? '#0F766E' : '#DDE1E7',
        strokeWidth: 2,
        strokeDasharray: e.is_strict ? undefined : '4 4'
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: e.is_strict ? '#0F766E' : '#94A3B8'
      }
    }));

    return { nodes: calculatedNodes, edges: calculatedEdges };
  }, [graphData]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center text-xs font-medium text-[#5B6573]">
        Calculating prerequisite dependency sequence...
      </div>
    );
  }

  return (
    <div className="w-full h-[620px] rounded-[10px] border border-[#DDE1E7] bg-[#F6F7F9] overflow-hidden relative shadow-sm">
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-[6px] border border-[#DDE1E7] text-xs flex items-center space-x-3 shadow-sm">
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0F766E]"></div>
          <span className="text-[#17202A] text-[11px]">Mastered</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full border-2 border-[#0F766E] bg-white"></div>
          <span className="text-[#17202A] text-[11px]">In progress</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#B45309]"></div>
          <span className="text-[#B45309] text-[11px] font-medium">Recommended next</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]"></div>
          <span className="text-[#5B6573] text-[11px]">Prerequisite needed</span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        className="bg-[#F6F7F9]"
      >
        <Background color="#DDE1E7" gap={20} size={1} variant={BackgroundVariant.Dots} />
        <Controls className="bg-white border-[#DDE1E7] fill-[#17202A] shadow-sm rounded-[6px]" />
      </ReactFlow>
    </div>
  );
};
