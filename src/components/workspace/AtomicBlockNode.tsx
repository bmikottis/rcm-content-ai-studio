"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AtomicBlock, AtomicBlockType } from "@/types/workspace";
import { useWorkspaceStore, GenerationPhase } from "@/stores/workspace";
import { useToolsStore } from "@/stores/tools";
import { cn } from "@/lib/cn";

/** Screen pixels before pointer movement counts as a drag (blocks move + inspector stays closed on trailing click). */
const DRAG_COMMIT_PX_SCREEN = 8;

const SPINNER_DURATION_BY_TYPE: Record<AtomicBlockType, number> = {
  image: 1200,
  headline: 1600,
  body: 2000,
  cta: 1800,
  section: 1400,
  divider: 1000,
  token: 2200,
  disclaimer: 2400,
  language: 2000,
};

interface AtomicBlockNodeProps {
  block: AtomicBlock;
  index: number;
  isSelected: boolean;
  dimmed?: boolean;
}

const blockConfig: Record<AtomicBlockType, { 
  label: string; 
  icon: React.ReactNode; 
  bgColor: string;
  borderColor: string;
  textColor: string;
}> = {
  image: { 
    label: "Image", 
    icon: <ImageIcon />, 
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
  },
  headline: { 
    label: "Headline", 
    icon: <HeadlineIcon />, 
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
  },
  body: { 
    label: "Body", 
    icon: <BodyIcon />, 
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    textColor: "text-slate-700",
  },
  cta: { 
    label: "CTA", 
    icon: <CTAIcon />, 
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700",
  },
  section: {
    label: "Section",
    icon: <SectionIcon />,
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    textColor: "text-violet-700",
  },
  divider: {
    label: "Divider",
    icon: <DividerIcon />,
    bgColor: "bg-neutral-50",
    borderColor: "border-[#DDD]",
    textColor: "text-neutral-600",
  },
  disclaimer: { 
    label: "Disclaimer", 
    icon: <DisclaimerIcon />, 
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
  },
  token: { 
    label: "Token", 
    icon: <TokenIcon />, 
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
  },
  language: { 
    label: "Language", 
    icon: <LanguageIcon />, 
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    textColor: "text-cyan-700",
  },
};

export function AtomicBlockNode({ block, index, isSelected, dimmed }: AtomicBlockNodeProps) {
  const { select, addToSelection, moveAtomicBlock, setDragging, setHovered, agentOverlay, syncPulseIds, generationPhase } =
    useWorkspaceStore();
  const { openInspectorBlockDetail } = useToolsStore();
  const agentBusy = agentOverlay?.scopeIds.includes(block.id) ?? false;
  const syncPulse = syncPulseIds.includes(block.id);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, blockX: 0, blockY: 0 });
  /** True only after a real drag (pointer moved past threshold) — suppress inspector on the trailing click. */
  const significantDragRef = useRef(false);
  const dragCommittedRef = useRef(false);

  const isGenerating = generationPhase !== "idle" && generationPhase !== "done";
  const [showSpinner, setShowSpinner] = useState(isGenerating);

  useEffect(() => {
    if (!isGenerating) {
      setShowSpinner(false);
      return;
    }
    setShowSpinner(true);
    const jitter = Math.random() * 300;
    const duration = SPINNER_DURATION_BY_TYPE[block.type] + jitter;
    const t = setTimeout(() => setShowSpinner(false), duration);
    return () => clearTimeout(t);
  }, [isGenerating, block.type]);

  const config = blockConfig[block.type];
  const linkedCount = block.linkedTo?.length || 0;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    significantDragRef.current = false;
    dragCommittedRef.current = false;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      blockX: block.position.x,
      blockY: block.position.y,
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
      moveAtomicBlock(block.id, {
        x: dragStart.current.blockX + deltaX,
        y: dragStart.current.blockY + deltaY,
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
  }, [block.id, block.position, moveAtomicBlock, setDragging]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const dragged = significantDragRef.current;
      significantDragRef.current = false;

      if (e.shiftKey) {
        addToSelection(block.id);
        return;
      }
      select([block.id]);
      if (!dragged) {
        openInspectorBlockDetail(block.id);
      }
    },
    [block.id, select, addToSelection, openInspectorBlockDetail],
  );

  const width = block.size?.width || (block.type === "image" ? 180 : 160);
  const height = block.size?.height || (block.type === "image" ? 100 : 60);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: block.position.x,
        y: block.position.y,
      }}
      transition={{ 
        opacity: { duration: 0.4 },
        scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
        x: { duration: 0 },
        y: { duration: 0 },
      }}
      className={cn("absolute cursor-grab active:cursor-grabbing transition-opacity duration-300", dimmed && "opacity-[0.15] pointer-events-none")}
      style={{ width, height }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseEnter={() => setHovered(block.id)}
      onMouseLeave={() => setHovered(null)}
    >
      <div
        className={cn(
          "relative w-full h-full rounded-xl border-2 transition-all duration-150",
          "flex flex-col items-center justify-center gap-1.5",
          "shadow-sm hover:shadow-md",
          config.bgColor,
          config.borderColor,
          isSelected && "border-blue-500 shadow-blue-500/20 ring-2 ring-blue-500/20",
          syncPulse && "ring-2 ring-emerald-400/70 animate-pulse",
          isDragging && "shadow-lg",
        )}
      >
        {/* Generation spinner overlay */}
        <AnimatePresence>
          {showSpinner && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1.5 rounded-[10px] bg-white/85 backdrop-blur-[1px]"
            >
              <motion.svg
                className="h-7 w-7"
                viewBox="0 0 40 40"
                fill="none"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              >
                <circle cx="20" cy="20" r="16" stroke="#E5E7EB" strokeWidth="2.5" />
                <path
                  d="M20 4a16 16 0 0 1 16 16"
                  stroke="url(#blockSpinnerGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="blockSpinnerGrad" x1="20" y1="4" x2="36" y2="20">
                    <stop stopColor="#00A1E0" />
                    <stop offset="1" stopColor="#6B5ACC" />
                  </linearGradient>
                </defs>
              </motion.svg>
            </motion.div>
          )}
        </AnimatePresence>

        {agentBusy && (
          <div className="absolute inset-0 z-10 overflow-hidden rounded-[10px] bg-white/55 backdrop-blur-[1px]">
            <div className="absolute inset-0 opacity-80 shimmer" />
            <p className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 text-[8px] font-medium text-neutral-500 shadow-sm">
              {agentOverlay?.label ?? "Updating…"}
            </p>
          </div>
        )}
        {/* Type badge */}
        <div className={cn(
          "absolute -top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider",
          config.bgColor,
          config.textColor,
          "border",
          config.borderColor
        )}>
          {config.label}
        </div>

        {/* Icon */}
        <div className={cn("w-6 h-6", config.textColor)}>
          {config.icon}
        </div>

        {/* Content preview */}
        <p className={cn("text-[13px] font-medium text-center px-2 truncate max-w-full", config.textColor)}>
          {block.content}
        </p>

        {/* Linked indicator */}
        {linkedCount > 0 && (
          <div className={cn(
            "absolute -bottom-1.5 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full",
            "bg-white border shadow-sm text-[8px] font-medium text-neutral-500"
          )}>
            <LinkIcon className="w-2.5 h-2.5" />
            <span>{linkedCount}</span>
          </div>
        )}

        {/* Connection points */}
        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#DDD] opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#DDD] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );
}

// Icons
function ImageIcon() {
  return (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function HeadlineIcon() {
  return (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h16" />
      <path d="M4 6h16" />
      <path d="M4 18h8" />
    </svg>
  );
}

function BodyIcon() {
  return (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="17" y1="10" x2="3" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="17" y1="18" x2="3" y2="18" />
    </svg>
  );
}

function CTAIcon() {
  return (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="8" rx="2" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}

function SectionIcon() {
  return (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
    </svg>
  );
}

function DividerIcon() {
  return (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  );
}

function DisclaimerIcon() {
  return (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function TokenIcon() {
  return (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7h-3a2 2 0 0 1-2-2V2" />
      <path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2H9Z" />
      <path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8" />
    </svg>
  );
}

function LanguageIcon() {
  return (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
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
