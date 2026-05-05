"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface ActionItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  onClick: () => void;
}

interface ElementSidePanelProps {
  actions: ActionItem[];
  className?: string;
}

export function ElementSidePanel({ actions, className }: ElementSidePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -8, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "w-[168px] rounded-xl border border-[var(--border)]",
        "bg-[var(--surface)] shadow-[0_4px_20px_rgba(0,0,0,0.1)]",
        "py-1 overflow-hidden",
        className,
      )}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {actions.map((action, i) => (
        <button
          key={action.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2.5",
            "text-[13px] font-medium text-[var(--text-secondary)]",
            "hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]",
            "transition-colors duration-100 text-left",
            i > 0 && "border-t border-[var(--border-subtle)]",
          )}
        >
          {/* Icon container — fixed size so labels align */}
          <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-[var(--text-muted)]">
            {action.icon}
          </span>
          <span className="flex-1 leading-none">{action.label}</span>
          {action.badge != null && action.badge > 0 && (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white leading-none">
              {action.badge > 9 ? "9+" : action.badge}
            </span>
          )}
        </button>
      ))}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Shared icons used by callers — exported so the panel stays icon-agnostic
// ---------------------------------------------------------------------------

export function RephraseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("w-4 h-4", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

export function SourcesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("w-4 h-4", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}
