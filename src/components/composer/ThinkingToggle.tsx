"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useComposerStore } from "@/stores/composer";
import { cn } from "@/lib/cn";

interface ThinkingToggleProps {
  variant: "dark" | "light";
}

export function ThinkingToggle({ variant }: ThinkingToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { thinkingMode, setThinkingMode } = useComposerStore();

  const isLight = variant === "light";

  const t = {
    button: isLight
      ? "bg-[var(--surface-active)] text-[var(--text-secondary)]"
      : "bg-white/[0.06] text-white/50",
    buttonActive: isLight
      ? "bg-amber-100 text-amber-700 border border-amber-200"
      : "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    tooltip: isLight
      ? "bg-neutral-900 text-white"
      : "bg-white text-neutral-900",
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setThinkingMode(!thinkingMode);
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={cn(
          "h-8 rounded-lg flex items-center gap-1.5 px-2.5 transition-all text-[13px] font-medium",
          thinkingMode ? t.buttonActive : t.button
        )}
      >
        <BrainIcon className="w-3.5 h-3.5" />
        <span>Thinking</span>
        {thinkingMode && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="relative flex h-2 w-2"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </motion.span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          className={cn(
            "absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg text-[13px] w-[180px] shadow-xl z-50",
            t.tooltip
          )}
        >
          <p className="font-medium mb-0.5">Extended Thinking</p>
          <p className="opacity-60 leading-relaxed">
            Plans complex tasks and delivers autonomously with detailed reasoning
          </p>
        </motion.div>
      )}
    </div>
  );
}

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.54" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.54" />
    </svg>
  );
}
