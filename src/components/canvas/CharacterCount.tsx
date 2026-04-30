"use client";

import { cn } from "@/lib/cn";

interface CharacterCountProps {
  current: number;
  max: number;
  className?: string;
}

export function CharacterCount({ current, max, className }: CharacterCountProps) {
  const percentage = (current / max) * 100;
  const isOverLimit = current > max;
  const isNearLimit = percentage > 90 && !isOverLimit;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 h-1 bg-[var(--border)] rounded-full overflow-hidden max-w-[200px]">
        <div
          className={cn(
            "h-full transition-all duration-200",
            isOverLimit
              ? "bg-[var(--error)]"
              : isNearLimit
              ? "bg-[var(--warning)]"
              : "bg-[var(--success)]"
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span
        className={cn(
          "text-[13px]",
          isOverLimit
            ? "text-[var(--error)]"
            : isNearLimit
            ? "text-[var(--warning)]"
            : "text-[var(--text-muted)]"
        )}
      >
        {current} / {max} characters
      </span>
    </div>
  );
}
