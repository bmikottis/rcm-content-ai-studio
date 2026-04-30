"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Same chevron as the campaign title row in `CanvasLeftPanel` (thin stroke, not arrow-with-stem). */
export function SidebarDrillChevron({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

type SidebarDrilldownHeaderProps = {
  title: ReactNode;
  onBack: () => void;
  backAriaLabel?: string;
  /** e.g. filter / overflow actions */
  rightSlot?: React.ReactNode;
  className?: string;
};

/**
 * Shared drill-down header for left inspector, channel drill, and tool panels:
 * back chevron, title, optional trailing actions, bottom separator.
 */
export function SidebarDrilldownHeader({
  title,
  onBack,
  backAriaLabel = "Back",
  rightSlot,
  className,
}: SidebarDrilldownHeaderProps) {
  return (
    <div
      className={cn(
        "flex h-12 shrink-0 items-center gap-2.5 border-b border-[var(--border)] px-4",
        className,
      )}
    >
      <button
        type="button"
        onClick={onBack}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
        aria-label={backAriaLabel}
      >
        <SidebarDrillChevron className="h-[18px] w-[18px]" />
      </button>
      <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-[var(--text-primary)]">
        {title}
      </span>
      {rightSlot != null ? <div className="shrink-0">{rightSlot}</div> : null}
    </div>
  );
}
