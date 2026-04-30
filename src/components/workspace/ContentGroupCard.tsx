"use client";

import { useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ContentGroup, ChannelVariant, ChannelType } from "@/types/workspace";
import { useWorkspaceStore } from "@/stores/workspace";
import { useToolsStore } from "@/stores/tools";
import { cn } from "@/lib/cn";

const DRAG_COMMIT_PX_SCREEN = 8;

interface ContentGroupCardProps {
  group: ContentGroup;
  index: number;
  isSelected: boolean;
  dimmed?: boolean;
}

const channelConfig: Record<ChannelType, { label: string; icon: React.ReactNode; color: string }> = {
  email: { label: "Email", icon: <EmailIcon />, color: "bg-blue-500" },
  sms: { label: "SMS", icon: <SMSIcon />, color: "bg-emerald-500" },
  whatsapp: { label: "WhatsApp", icon: <WhatsAppIcon />, color: "bg-green-500" },
  rcs: { label: "RCS", icon: <RCSIcon />, color: "bg-purple-500" },
  web: { label: "Web", icon: <WebIcon />, color: "bg-orange-500" },
};

export function ContentGroupCard({ group, index, isSelected, dimmed }: ContentGroupCardProps) {
  const {
    select,
    addToSelection,
    moveGroup,
    toggleGroupCollapse,
    setDragging,
    setHovered,
    focusedChannel,
    enterChannel,
    agentOverlay,
    syncPulseIds,
    generationPhase,
  } = useWorkspaceStore();
  const isGenerating = generationPhase !== "idle" && generationPhase !== "done";
  const { openInspectorGroupDetail } = useToolsStore();
  const groupAgentBusy = agentOverlay?.scopeIds.includes(group.id) ?? false;
  const syncPulse = syncPulseIds.includes(group.id);
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, groupX: 0, groupY: 0 });
  const significantDragRef = useRef(false);
  const dragCommittedRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    significantDragRef.current = false;
    dragCommittedRef.current = false;
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).closest("[data-drag-handle]")) {
      return;
    }

    e.stopPropagation();
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      groupX: group.position.x,
      groupY: group.position.y,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dist = Math.hypot(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y);
      if (!dragCommittedRef.current) {
        if (dist <= DRAG_COMMIT_PX_SCREEN) return;
        dragCommittedRef.current = true;
        significantDragRef.current = true;
        setIsDragging(true);
        setDragging(true);
      }

      const { zoom } = useWorkspaceStore.getState().viewport;
      const deltaX = (e.clientX - dragStart.current.x) / zoom;
      const deltaY = (e.clientY - dragStart.current.y) / zoom;
      moveGroup(group.id, {
        x: dragStart.current.groupX + deltaX,
        y: dragStart.current.groupY + deltaY,
      });
    };

    const handleMouseUp = () => {
      if (dragCommittedRef.current) {
        setIsDragging(false);
        setDragging(false);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [group.id, group.position, moveGroup, setDragging]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const dragged = significantDragRef.current;
      significantDragRef.current = false;

      if (e.shiftKey) {
        addToSelection(group.id);
        return;
      }
      select([group.id]);
      if (!dragged) {
        openInspectorGroupDetail(group.id);
      }
    },
    [group.id, select, addToSelection, openInspectorGroupDetail],
  );

  return (
    <motion.div
      ref={dragRef}
      initial={{ opacity: 0, scale: 0.92, y: group.position.y + 20 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: group.position.x,
        y: group.position.y,
      }}
      transition={{ 
        opacity: { duration: 0.5 },
        scale: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        y: { duration: isGenerating ? 0.5 : 0, ease: [0.16, 1, 0.3, 1] },
        x: { duration: 0 },
      }}
      className={cn("absolute transition-opacity duration-300", dimmed && "opacity-[0.15] pointer-events-none")}
      style={{ 
        width: group.size.width,
        zIndex: isDragging 
          ? "var(--z-canvas-content-dragging)" 
          : isSelected 
            ? "var(--z-canvas-content-selected)" 
            : "var(--z-canvas-content)",
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseEnter={() => setHovered(group.id)}
      onMouseLeave={() => setHovered(null)}
    >
      <div
        className={cn(
          "relative rounded-2xl border-2 transition-all duration-150 overflow-hidden",
          "bg-[var(--surface)] shadow-lg",
          isSelected 
            ? "border-blue-500 shadow-blue-500/20" 
            : "border-[var(--border)] hover:border-[var(--border)]",
          isDragging && "shadow-2xl cursor-grabbing",
          syncPulse && "ring-2 ring-emerald-400/60",
        )}
      >
        {groupAgentBusy && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center pb-3">
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[13px] font-medium text-[var(--text-secondary)] shadow-md ring-1 ring-neutral-200/80">
              {agentOverlay?.label ?? "Updating…"}
            </span>
          </div>
        )}
        {groupAgentBusy && (
          <div className="pointer-events-none absolute inset-0 z-10 bg-white/40 backdrop-blur-[0.5px]">
            <div className="absolute inset-0 opacity-70 shimmer" />
          </div>
        )}
        {/* Header */}
        <div 
          data-drag-handle
          className="relative px-4 py-3 border-b border-[var(--border)] cursor-grab active:cursor-grabbing"
          style={{ 
            background: `linear-gradient(135deg, ${group.color}08 0%, transparent 100%)`,
            borderTop: `3px solid ${group.color}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: group.color }}
              />
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{group.name}</h3>
                {group.description && (
                  <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">{group.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {isGenerating ? (
                <span className="px-2 py-0.5 rounded-full bg-sky-50 text-[13px] font-medium text-[#00A1E0]">
                  Generating...
                </span>
              ) : (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      select([group.id]);
                      openInspectorGroupDetail(group.id);
                    }}
                    className="px-2 py-0.5 rounded-full bg-[var(--surface-active)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-neutral-200 transition-colors"
                  >
                    {group.channels.length} variants
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (group.collapsed) toggleGroupCollapse(group.id);
                    }}
                    className="px-2 py-0.5 rounded-full bg-[var(--surface-active)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-neutral-200 transition-colors"
                  >
                    {group.channels.length} channels
                  </button>
                </>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroupCollapse(group.id);
                }}
                className="p-1 rounded hover:bg-[var(--surface-active)] transition-colors"
              >
                <ChevronIcon className={cn(
                  "w-4 h-4 text-[var(--text-muted)] transition-transform",
                  group.collapsed && "-rotate-90"
                )} />
              </button>
            </div>
          </div>
        </div>

        {/* Channels grid */}
        {!group.collapsed && (
          <div className="p-3 grid grid-cols-2 gap-2" style={{ minHeight: group.size.height - 80 }}>
            {group.channels.map((channel) => (
              <ChannelCard
                key={channel.id}
                groupId={group.id}
                channel={channel}
                isFocused={
                  focusedChannel?.groupId === group.id && focusedChannel.channelId === channel.id
                }
                onFocusChannel={() => enterChannel(group.id, channel.id)}
              />
            ))}
          </div>
        )}

        {/* Collapsed state */}
        {group.collapsed && (
          <div className="px-4 py-3 flex items-center gap-2">
            {group.channels.map((channel) => (
              <div
                key={channel.id}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  channelConfig[channel.channel].color,
                  "text-white"
                )}
              >
                {channelConfig[channel.channel].icon}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -inset-1 rounded-2xl border-2 border-blue-500 pointer-events-none" />
      )}
    </motion.div>
  );
}

interface ChannelCardProps {
  groupId: string;
  channel: ChannelVariant;
  isFocused: boolean;
  onFocusChannel: () => void;
}

function ChannelCard({ channel, isFocused, onFocusChannel }: ChannelCardProps) {
  const config = channelConfig[channel.channel];
  const { generationPhase } = useWorkspaceStore();
  const isGenerating = generationPhase !== "idle" && generationPhase !== "done";

  const statusColors = {
    draft: "bg-neutral-200 text-neutral-600",
    ready: "bg-emerald-100 text-emerald-700",
    approved: "bg-blue-100 text-blue-700",
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onFocusChannel();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onFocusChannel();
        }
      }}
      className={cn(
        "relative p-3 rounded-xl border transition-colors cursor-pointer group text-left overflow-hidden",
        isFocused
          ? "bg-blue-50/80 border-blue-300 ring-1 ring-blue-400/30"
          : "bg-[var(--surface-subtle)] border-[var(--border)] hover:border-[var(--border)]",
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-white", config.color)}>
            {config.icon}
          </div>
          <span className="text-[13px] font-medium text-[var(--text-secondary)]">{config.label}</span>
        </div>
        <span className={cn("px-1.5 py-0.5 rounded text-[11px] font-medium capitalize", statusColors[channel.status])}>
          {channel.status}
        </span>
      </div>

      {/* Mini preview skeleton (always rendered as the base layer) */}
      <div className="space-y-1.5">
        <div className="h-8 rounded bg-neutral-200/50 flex items-center justify-center">
          <ImageIcon className="w-3 h-3 text-[var(--text-muted)]" />
        </div>
        <div className="space-y-1">
          <div className="h-2 w-3/4 rounded-full bg-neutral-200/70" />
          <div className="h-2 w-1/2 rounded-full bg-neutral-200/50" />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-[13px] text-[var(--text-muted)]">
        <LinkIcon className="w-3 h-3" />
        <span>{channel.atomicBlocks.length} content</span>
      </div>

      {/* Full-card spinner overlay during generation */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 rounded-xl bg-white/80 backdrop-blur-[1px]"
          >
            <motion.svg
              className="h-8 w-8"
              viewBox="0 0 40 40"
              fill="none"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
            >
              <circle cx="20" cy="20" r="16" stroke="#E5E7EB" strokeWidth="2.5" />
              <path
                d="M20 4a16 16 0 0 1 16 16"
                stroke="url(#channelSpinnerGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="channelSpinnerGrad" x1="20" y1="4" x2="36" y2="20">
                  <stop stopColor="#00A1E0" />
                  <stop offset="1" stopColor="#6B5ACC" />
                </linearGradient>
              </defs>
            </motion.svg>
            <span className="text-[13px] font-medium text-[var(--text-muted)]">Generating...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Icons
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function SMSIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function RCSIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function WebIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
