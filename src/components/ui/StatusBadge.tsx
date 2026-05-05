"use client";

import { cn } from "@/lib/cn";
import { useThemeStore } from "@/stores/theme";

export type BadgeStatus =
  | "draft"
  | "generating"
  | "in_progress"
  | "ready"
  | "published"
  | "pending"
  | "approved"
  | "changes_requested"
  | "review"
  | "archived";

type BadgeSize = "xs" | "sm" | "md";

interface StatusBadgeProps {
  status: string;
  size?: BadgeSize;
  className?: string;
}

type BadgeConfig = Record<string, { label: string; bg: string; text: string }>;

const lightConfig: BadgeConfig = {
  draft:              { label: "Draft",             bg: "bg-[var(--surface-subtle)]", text: "text-[var(--text-muted)]" },
  generating:         { label: "Generating",        bg: "bg-amber-50",               text: "text-amber-600" },
  in_progress:        { label: "In Progress",       bg: "bg-blue-50",                text: "text-blue-600" },
  ready:              { label: "Ready",             bg: "bg-emerald-50",             text: "text-emerald-600" },
  published:          { label: "Published",         bg: "bg-blue-50",                text: "text-blue-600" },
  pending:            { label: "Pending",           bg: "bg-amber-50",               text: "text-amber-600" },
  approved:           { label: "Approved",          bg: "bg-purple-50",              text: "text-purple-600" },
  changes_requested:  { label: "Changes Requested", bg: "bg-red-50",                 text: "text-red-600" },
  review:             { label: "In Review",         bg: "bg-amber-50",               text: "text-amber-600" },
  archived:           { label: "Archived",          bg: "bg-[var(--surface-subtle)]", text: "text-[var(--text-muted)]" },
};

const darkConfig: BadgeConfig = {
  draft:              { label: "Draft",             bg: "bg-white/[0.10]",             text: "text-[var(--text-secondary)]" },
  generating:         { label: "Generating",        bg: "bg-amber-500/[0.12]",         text: "text-amber-400" },
  in_progress:        { label: "In Progress",       bg: "bg-blue-500/[0.12]",          text: "text-blue-400" },
  ready:              { label: "Ready",             bg: "bg-emerald-500/[0.12]",       text: "text-emerald-400" },
  published:          { label: "Published",         bg: "bg-blue-500/[0.12]",          text: "text-blue-400" },
  pending:            { label: "Pending",           bg: "bg-amber-500/[0.12]",         text: "text-amber-400" },
  approved:           { label: "Approved",          bg: "bg-purple-500/[0.12]",        text: "text-purple-400" },
  changes_requested:  { label: "Changes Requested", bg: "bg-red-500/[0.12]",           text: "text-red-400" },
  review:             { label: "In Review",         bg: "bg-amber-500/[0.12]",         text: "text-amber-400" },
  archived:           { label: "Archived",          bg: "bg-white/[0.10]",             text: "text-[var(--text-secondary)]" },
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: "px-1.5 py-0 rounded text-[10px] font-bold uppercase tracking-wide",
  sm: "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
  md: "px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wide",
};

export function StatusBadge({ status, size = "sm", className }: StatusBadgeProps) {
  const isDark = useThemeStore((s) => s.resolvedTheme === "dark");
  const palette = isDark ? darkConfig : lightConfig;
  const config = palette[status] ?? palette.draft;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-0.5 flex-shrink-0",
        sizeStyles[size],
        config.bg,
        config.text,
        className,
      )}
    >
      {status === "review" && (
        <svg
          className="h-2.5 w-2.5 shrink-0 opacity-90"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )}
      {config.label}
    </span>
  );
}
