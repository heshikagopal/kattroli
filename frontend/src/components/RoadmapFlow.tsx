import React, { useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  MarkerType
} from '@xyflow/react';
import { Roadmap, RoadmapItem } from '../types';
import { CheckCircle2, Clock, AlertCircle, BookOpen } from 'lucide-react';

interface RoadmapFlowProps {
  roadmap: Roadmap;
  onSelectModule: (module: RoadmapItem) => void;
}

export const RoadmapFlow: React.FC<RoadmapFlowProps> = ({ roadmap, onSelectModule }) => {
  const { nodes, edges } = useMemo(() => {
    const calculatedNodes: Node[] = [];
    const calculatedEdges: Edge[] = [];

    const items = roadmap.items || [];

    const cols = 2;
    const xSpacing = 340;
    const ySpacing = 160;

    items.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      const xPos = 40 + (row % 2 === 0 ? col * xSpacing : (cols - 1 - col) * xSpacing);
      const yPos = 40 + row * ySpacing;

      const isCompleted = item.status === 'completed';
      const isInProgress = item.status === 'in_progress';
      const isRemedial = item.is_remedial;

      calculatedNodes.push({
        id: `node-${item.id}`,
        position: { x: xPos, y: yPos },
        data: {
          item,
          label: (
            <div
              onClick={() => onSelectModule(item)}
              className={`p-4 rounded-[8px] border text-left cursor-pointer transition w-[290px] shadow-sm select-none ${
                isRemedial
                  ? 'bg-[#FFFBEB] border-2 border-[#B45309]'
                  : isCompleted
                  ? 'bg-[#F0FDFA] border border-[#0F766E]/50'
                  : isInProgress
                  ? 'bg-white border-2 border-[#0F766E] ring-2 ring-[#CCFBF1]'
                  : 'bg-white border border-[#DDE1E7] hover:border-[#0F766E]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[4px] ${
                    isRemedial
                      ? 'bg-[#FEF3C7] text-[#B45309]'
                      : isCompleted
                      ? 'bg-[#CCFBF1] text-[#0F766E]'
                      : isInProgress
                      ? 'bg-[#E0F2FE] text-[#0369A1]'
                      : 'bg-[#EEF1F5] text-[#5B6573]'
                  }`}
                >
                  Week {item.week_number}
                </span>

                <div className="flex items-center space-x-1">
                  {isRemedial && (
                    <span className="flex items-center space-x-1 text-[10px] font-semibold text-[#B45309]">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Adapted</span>
                    </span>
                  )}
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                  ) : isInProgress ? (
                    <Clock className="w-4 h-4 text-[#0F766E]" />
                  ) : (
                    <BookOpen className="w-4 h-4 text-[#5B6573]" />
                  )}
                </div>
              </div>

              <h4 className="text-xs font-semibold text-[#17202A] line-clamp-2 mb-2 leading-snug">
                {item.title}
              </h4>

              <div className="flex items-center justify-between text-[11px] text-[#5B6573] pt-2 border-t border-[#DDE1E7]">
                <span className="font-medium text-[#17202A] truncate max-w-[140px]">
                  {item.skill_name || 'Core Topic'}
                </span>
                <span className="font-mono">{item.duration_hours}h</span>
              </div>
            </div>
          )
        }
      });

      if (index > 0) {
        const prevItem = items[index - 1];
        const strokeColor = isRemedial ? '#B45309' : isCompleted ? '#0F766E' : '#DDE1E7';

        calculatedEdges.push({
          id: `edge-${prevItem.id}-${item.id}`,
          source: `node-${prevItem.id}`,
          target: `node-${item.id}`,
          animated: isInProgress || isRemedial,
          style: {
            stroke: strokeColor,
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
          }
        });
      }
    });

    return { nodes: calculatedNodes, edges: calculatedEdges };
  }, [roadmap, onSelectModule]);

  return (
    <div className="w-full h-[620px] rounded-[10px] border border-[#DDE1E7] bg-[#F6F7F9] overflow-hidden relative shadow-sm">
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-[6px] border border-[#DDE1E7] text-xs flex items-center space-x-4 shadow-sm">
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" />
          <span className="text-[#17202A] text-[11px]">Completed</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full border-2 border-[#0F766E] bg-white" />
          <span className="text-[#17202A] text-[11px]">In progress</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#B45309]" />
          <span className="text-[#B45309] text-[11px] font-semibold">Adapted module</span>
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
