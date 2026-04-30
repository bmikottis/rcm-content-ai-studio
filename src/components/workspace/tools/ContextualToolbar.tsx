"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useToolsStore } from "@/stores/tools";
import { useWorkspaceStore } from "@/stores/workspace";
import { ToolType } from "@/types/tools";
import { cn } from "@/lib/cn";

const tools: { id: ToolType; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { id: "select", icon: <SelectIcon />, label: "Select & Inspect", shortcut: "V" },
  { id: "group-edit", icon: <GroupEditIcon />, label: "Group Edit", shortcut: "G" },
  { id: "image-edit", icon: <ImageEditIcon />, label: "Image Edit", shortcut: "I" },
  { id: "layout-edit", icon: <LayoutEditIcon />, label: "Layout Edit", shortcut: "L" },
  { id: "language", icon: <LanguageIcon />, label: "Language & Tokens", shortcut: "T" },
  { id: "link", icon: <LinkIcon />, label: "Link / Unlink", shortcut: "K" },
];

export function ContextualToolbar() {
  const { activeTool, setActiveTool, isProcessing } = useToolsStore();
  const { selectedIds } = useWorkspaceStore();

  const hasSelection = selectedIds.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 p-1.5 rounded-2xl bg-[var(--surface)] border border-[#DDD]/80 shadow-lg shadow-neutral-200/50"
    >
      {tools.map((tool) => {
        const isActive = activeTool === tool.id;
        const isDisabled = tool.id !== "select" && !hasSelection;

        return (
          <div key={tool.id} className="relative group">
            <motion.button
              onClick={() => !isDisabled && setActiveTool(tool.id)}
              disabled={isDisabled || isProcessing}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150",
                isActive 
                  ? "bg-neutral-900 text-white shadow-sm" 
                  : isDisabled
                    ? "text-neutral-200 cursor-not-allowed"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]",
              )}
            >
              {tool.icon}
            </motion.button>

            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl bg-neutral-900 text-white text-[13px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
              <span className="font-medium">{tool.label}</span>
              <span className="ml-2.5 px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono text-[13px]">{tool.shortcut}</span>
            </div>
          </div>
        );
      })}

      {/* Processing indicator */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 rounded-2xl bg-white/95 backdrop-blur-sm flex items-center justify-center border border-[var(--border)]"
          >
            <div className="w-5 h-5 border-2 border-[var(--border)] border-t-neutral-900 rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SelectIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
    </svg>
  );
}

function GroupEditIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ImageEditIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function LayoutEditIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}

function LanguageIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
