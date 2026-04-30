"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useToolsStore } from "@/stores/tools";
import { useWorkspaceStore } from "@/stores/workspace";
import { ToolType } from "@/types/tools";
import { cn } from "@/lib/cn";

const toolGroups = [
  {
    id: "navigation",
    tools: [
      { id: "select" as ToolType, icon: <SelectIcon />, label: "Select", shortcut: "V" },
    ],
  },
  {
    id: "editing",
    tools: [
      { id: "group-edit" as ToolType, icon: <GroupEditIcon />, label: "Group Edit", shortcut: "G" },
      { id: "image-edit" as ToolType, icon: <ImageEditIcon />, label: "Image Edit", shortcut: "I" },
      { id: "layout-edit" as ToolType, icon: <LayoutEditIcon />, label: "Layout Edit", shortcut: "L" },
    ],
  },
  {
    id: "content",
    tools: [
      { id: "language" as ToolType, icon: <LanguageIcon />, label: "Language & Tokens", shortcut: "T" },
      { id: "link" as ToolType, icon: <LinkIcon />, label: "Link / Unlink", shortcut: "K" },
    ],
  },
];

const viewActions = [
  { id: "zoom-in", icon: <ZoomInIcon />, label: "Zoom in", shortcut: "⌘+" },
  { id: "zoom-out", icon: <ZoomOutIcon />, label: "Zoom out", shortcut: "⌘-" },
  { id: "fit", icon: <FitIcon />, label: "Fit to view", shortcut: "⌘0" },
];

export function UnifiedToolbar() {
  const { activeTool, setActiveTool, isProcessing } = useToolsStore();
  const { selectedIds, zoom, resetViewport } = useWorkspaceStore();

  const hasSelection = selectedIds.length > 0;

  const handleViewAction = (actionId: string) => {
    switch (actionId) {
      case "zoom-in":
        zoom(0.1);
        break;
      case "zoom-out":
        zoom(-0.1);
        break;
      case "fit":
        resetViewport();
        break;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2"
      style={{ zIndex: "var(--z-toolbar)" }}
    >
      {/* Main tools panel */}
      <div className="flex flex-col gap-1 p-1.5 rounded-2xl bg-[var(--surface)] border border-[#DDD]/80 shadow-lg shadow-neutral-200/50">
        {toolGroups.map((group, groupIndex) => (
          <div key={group.id}>
            {groupIndex > 0 && (
              <div className="h-px bg-[var(--surface-active)] mx-2 my-1" />
            )}
            {group.tools.map((tool) => {
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
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl bg-neutral-900 text-white text-[13px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl"
                       style={{ zIndex: "var(--z-dropdown)" }}>
                    <span className="font-medium">{tool.label}</span>
                    <span className="ml-2.5 px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono text-[13px]">{tool.shortcut}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

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
      </div>

      {/* View controls panel */}
      <div className="flex flex-col gap-1 p-1.5 rounded-2xl bg-[var(--surface)] border border-[#DDD]/80 shadow-lg shadow-neutral-200/50">
        {viewActions.map((action) => (
          <div key={action.id} className="relative group">
            <button
              onClick={() => handleViewAction(action.id)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 text-[var(--text-secondary)] hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
            >
              {action.icon}
            </button>

            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl bg-neutral-900 text-white text-[13px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl"
                 style={{ zIndex: "var(--z-dropdown)" }}>
              <span className="font-medium">{action.label}</span>
              <span className="ml-2.5 px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono text-[13px]">{action.shortcut}</span>
            </div>
          </div>
        ))}
      </div>

    </motion.div>
  );
}

// Icons
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

function ZoomInIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function FitIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

