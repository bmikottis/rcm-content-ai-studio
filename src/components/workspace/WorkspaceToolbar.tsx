"use client";

import { motion } from "framer-motion";
import { useWorkspaceStore } from "@/stores/workspace";
import { cn } from "@/lib/cn";

export function WorkspaceToolbar() {
  const { viewport, zoom, resetViewport, selectedIds, clearSelection } = useWorkspaceStore();

  const tools = [
    { id: "select", icon: <SelectIcon />, label: "Select", shortcut: "V" },
    { id: "hand", icon: <HandIcon />, label: "Pan", shortcut: "H" },
    { id: "zoom-in", icon: <ZoomInIcon />, label: "Zoom in", shortcut: "⌘+", action: () => zoom(0.1) },
    { id: "zoom-out", icon: <ZoomOutIcon />, label: "Zoom out", shortcut: "⌘-", action: () => zoom(-0.1) },
    { id: "fit", icon: <FitIcon />, label: "Fit to view", shortcut: "⌘0", action: resetViewport },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-lg"
    >
      {tools.map((tool, index) => (
        <div key={tool.id} className="flex items-center">
          {index === 2 && <div className="w-px h-5 bg-neutral-200 mx-1" />}
          <button
            onClick={tool.action}
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
              "hover:bg-[var(--surface-active)] active:bg-neutral-200",
              "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              "group relative"
            )}
            title={`${tool.label} (${tool.shortcut})`}
          >
            {tool.icon}
            
            {/* Tooltip */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-neutral-900 text-white text-[13px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {tool.label}
              <span className="ml-1.5 text-[var(--text-muted)]">{tool.shortcut}</span>
            </div>
          </button>
        </div>
      ))}

      <div className="w-px h-5 bg-neutral-200 mx-1" />

      {/* Add content button */}
      <button
        className={cn(
          "h-9 px-3 rounded-lg flex items-center gap-1.5 transition-all",
          "bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700",
          "text-white text-[13px] font-medium"
        )}
      >
        <PlusIcon className="w-4 h-4" />
        <span>Add</span>
      </button>
    </motion.div>
  );
}

function SelectIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  );
}

function HandIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function FitIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
