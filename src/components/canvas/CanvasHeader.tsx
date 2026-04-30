"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { usePreviewStore, ViewMode } from "@/stores/preview";
import { useWorkspaceStore } from "@/stores/workspace";
import { useThemeStore } from "@/stores/theme";
import { cn } from "@/lib/cn";

interface CanvasHeaderProps {
  className?: string;
}

function rectsIntersect(
  a: { left: number; right: number; top: number; bottom: number },
  b: DOMRect,
): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export function CanvasHeader({ className }: CanvasHeaderProps) {
  const { viewMode, setViewMode } = usePreviewStore();
  const { drillInChannel } = useWorkspaceStore();
  const isDark = useThemeStore((s) => s.resolvedTheme === "dark");
  const pillRef = useRef<HTMLDivElement>(null);
  const [useSecondRow, setUseSecondRow] = useState(false);

  useLayoutEffect(() => {
    if (drillInChannel) return undefined;

    const canvasArea = document.querySelector<HTMLElement>("[data-workspace-canvas-area]");
    if (!canvasArea) return undefined;

    const measure = () => {
      const pill = pillRef.current;
      const explorer = document.querySelector<HTMLElement>('[data-workspace-chrome="explorer"]');
      const actions = document.querySelector<HTMLElement>('[data-workspace-chrome="top-actions"]');
      if (!pill || !explorer || !actions) return;

      const canvas = canvasArea.getBoundingClientRect();
      const pillW = pill.offsetWidth;
      const pillH = pill.offsetHeight || 48;
      const topOffset = 12;
      const top = canvas.top + topOffset;
      const centerX = canvas.left + canvas.width / 2;
      const pad = 10;
      const pillBox = {
        left: centerX - pillW / 2 - pad,
        right: centerX + pillW / 2 + pad,
        top,
        bottom: top + pillH,
      };

      const er = explorer.getBoundingClientRect();
      const ar = actions.getBoundingClientRect();
      setUseSecondRow(rectsIntersect(pillBox, er) || rectsIntersect(pillBox, ar));
    };

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(measure);
    });
    ro.observe(canvasArea);
    window.addEventListener("resize", measure);
    measure();

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [drillInChannel, viewMode]);

  if (drillInChannel) return null;

  return (
    <div
      className={cn(
        "absolute left-1/2 flex -translate-x-1/2 items-center justify-center pointer-events-none",
        useSecondRow ? "top-[4.5rem]" : "top-3",
        "transition-[top] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        className,
      )}
      style={{ zIndex: "var(--z-panel)" }}
    >
      <div
        ref={pillRef}
        className={cn(
          "flex items-center h-[48px] px-1.5 rounded-xl pointer-events-auto",
          "backdrop-blur-xl backdrop-saturate-150 border",
          isDark
            ? "bg-[#1c1c1e]/80 border-[var(--border)] shadow-[0_4px_24px_rgba(0,0,0,0.4),0_1px_4px_rgba(0,0,0,0.3)]"
            : "bg-white/[0.80] border-transparent shadow-[0_4px_24px_rgba(0,0,0,0.14),0_1px_4px_rgba(0,0,0,0.10)]",
        )}
      >
        <ViewModeButton
          mode="canvas"
          currentMode={viewMode}
          onClick={() => setViewMode("canvas")}
          icon={<CanvasIcon className="w-4 h-4" />}
          label="Canvas"
        />
        <ViewModeButton
          mode="preview"
          currentMode={viewMode}
          onClick={() => setViewMode("preview")}
          icon={<PreviewIcon className="w-4 h-4" />}
          label="Preview"
        />
      </div>
    </div>
  );
}

function ViewModeButton({
  mode,
  currentMode,
  onClick,
  icon,
  label,
}: {
  mode: ViewMode;
  currentMode: ViewMode;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  const isActive = mode === currentMode;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors",
        isActive ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
      )}
    >
      {isActive && (
        <motion.div
          layoutId="viewModeIndicator"
          className="absolute inset-0 bg-[var(--surface-active)] rounded-lg"
          transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
        />
      )}
      <span className="relative flex items-center gap-2">
        {icon}
        {label}
      </span>
    </button>
  );
}

function CanvasIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function PreviewIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
