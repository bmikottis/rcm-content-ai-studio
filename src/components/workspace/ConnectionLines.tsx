"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Connection, ContentGroup, AtomicBlock } from "@/types/workspace";
import { useWorkspaceStore } from "@/stores/workspace";

interface ConnectionLinesProps {
  connections: Connection[];
  groups: ContentGroup[];
  atomicBlocks: AtomicBlock[];
}

export function ConnectionLines({ connections, groups, atomicBlocks }: ConnectionLinesProps) {
  const { hoveredId, selectedIds, generationPhase } = useWorkspaceStore();
  const shouldDrawIn = generationPhase === "connections";

  const lines = useMemo(() => {
    return connections.map((conn) => {
      let sourcePos = { x: 0, y: 0 };
      let targetPos = { x: 0, y: 0 };

      // Find source position
      if (conn.sourceType === "atomic") {
        const block = atomicBlocks.find((b) => b.id === conn.sourceId);
        if (block) {
          const width = block.size?.width || 160;
          const height = block.size?.height || 60;
          sourcePos = { 
            x: block.position.x, 
            y: block.position.y + height / 2 
          };
        }
      } else if (conn.sourceType === "group") {
        const group = groups.find((g) => g.id === conn.sourceId);
        if (group) {
          sourcePos = { 
            x: group.position.x + group.size.width, 
            y: group.position.y + group.size.height / 2 
          };
        }
      }

      // Find target position
      if (conn.targetType === "channel") {
        // Find the group containing this channel
        for (const group of groups) {
          const channel = group.channels.find((c) => c.id === conn.targetId);
          if (channel) {
            targetPos = {
              x: group.position.x + channel.position.x + 80,
              y: group.position.y + channel.position.y + 60,
            };
            break;
          }
        }
      } else if (conn.targetType === "group") {
        const group = groups.find((g) => g.id === conn.targetId);
        if (group) {
          targetPos = { 
            x: group.position.x, 
            y: group.position.y + group.size.height / 2 
          };
        }
      }

      const isHighlighted = 
        hoveredId === conn.sourceId || 
        hoveredId === conn.targetId ||
        selectedIds.includes(conn.sourceId) ||
        selectedIds.includes(conn.targetId);

      return {
        id: conn.id,
        sourcePos,
        targetPos,
        type: conn.connectionType,
        label: conn.label,
        isHighlighted,
      };
    });
  }, [connections, groups, atomicBlocks, hoveredId, selectedIds]);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      <defs>
        {/* Cascade gradient */}
        <linearGradient id="cascade-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        
        {/* Sync gradient */}
        <linearGradient id="sync-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        
        {/* Reference gradient */}
        <linearGradient id="reference-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Arrow markers */}
        <marker id="arrow-cascade" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#8B5CF6" />
        </marker>
        <marker id="arrow-sync" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#10B981" />
        </marker>
        <marker id="arrow-reference" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#F59E0B" />
        </marker>
      </defs>

      {lines.map((line, lineIndex) => {
        const dx = line.targetPos.x - line.sourcePos.x;
        const dy = line.targetPos.y - line.sourcePos.y;
        
        const midX = line.sourcePos.x + dx / 2;
        const controlOffset = Math.min(Math.abs(dx) * 0.3, 100);
        
        const path = `M ${line.sourcePos.x} ${line.sourcePos.y} 
                      C ${line.sourcePos.x + controlOffset} ${line.sourcePos.y},
                        ${line.targetPos.x - controlOffset} ${line.targetPos.y},
                        ${line.targetPos.x} ${line.targetPos.y}`;

        const gradientId = `${line.type}-gradient`;
        const markerId = `arrow-${line.type}`;
        const staggerDelay = shouldDrawIn ? lineIndex * 0.12 : 0.2;
        const drawDuration = shouldDrawIn ? 0.6 : 0.8;

        return (
          <g key={line.id}>
            {line.isHighlighted && (
              <motion.path
                d={path}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth={6}
                strokeOpacity={0.3}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              />
            )}
            
            <motion.path
              d={path}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={line.isHighlighted ? 2.5 : 1.5}
              strokeOpacity={line.isHighlighted ? 1 : 0.4}
              strokeDasharray={line.type === "reference" ? "5 5" : undefined}
              markerEnd={`url(#${markerId})`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: drawDuration, delay: staggerDelay, ease: "easeOut" }}
            />

            {line.label && line.isHighlighted && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <rect
                  x={midX - 40}
                  y={(line.sourcePos.y + line.targetPos.y) / 2 - 10}
                  width={80}
                  height={20}
                  rx={4}
                  fill="white"
                  stroke={line.type === "cascade" ? "#8B5CF6" : line.type === "sync" ? "#10B981" : "#F59E0B"}
                  strokeWidth={1}
                />
                <text
                  x={midX}
                  y={(line.sourcePos.y + line.targetPos.y) / 2 + 4}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={500}
                  fill="#374151"
                >
                  {line.label}
                </text>
              </motion.g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
