"use client";

import { ApprovalStatus } from "@/types/approval";
import { cn } from "@/lib/cn";

interface ApprovalBadgeProps {
  status: ApprovalStatus;
  className?: string;
}

const statusConfig: Record<ApprovalStatus, { label: string; color: string; icon: string }> = {
  pending: { label: "Pending approval", color: "var(--warning)", icon: "●" },
  approved: { label: "Approved", color: "var(--success)", icon: "✓" },
  changes_requested: { label: "Changes requested", color: "var(--error)", icon: "✕" },
};

export function ApprovalBadge({ status, className }: ApprovalBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[13px] font-medium",
        className
      )}
      style={{ color: config.color }}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
