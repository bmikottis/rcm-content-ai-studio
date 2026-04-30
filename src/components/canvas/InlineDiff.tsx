"use client";

import { computeDiff, DiffChange } from "@/lib/diff-utils";
import { cn } from "@/lib/cn";

interface InlineDiffProps {
  original: string;
  updated: string;
  className?: string;
}

export function InlineDiff({ original, updated, className }: InlineDiffProps) {
  const changes = computeDiff(original, updated);

  return (
    <div className={cn("text-body text-[var(--text-primary)]", className)}>
      {changes.map((change, i) => (
        <DiffSpan key={i} change={change} />
      ))}
    </div>
  );
}

function DiffSpan({ change }: { change: DiffChange }) {
  if (change.type === "unchanged") {
    return <span>{change.text}</span>;
  }

  if (change.type === "removed") {
    return (
      <span className="bg-red-50 text-[var(--error)] line-through">
        {change.text}
      </span>
    );
  }

  if (change.type === "added") {
    return (
      <span className="bg-green-50 text-[var(--success)]">{change.text}</span>
    );
  }

  return null;
}
