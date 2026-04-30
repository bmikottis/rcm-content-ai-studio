"use client";

import { ApprovalRequest } from "@/types/approval";
import { ApprovalBadge } from "./ApprovalBadge";
import { formatMessageTime } from "@/data/mock-approvals";
import { cn } from "@/lib/cn";

interface ApprovalFooterProps {
  approval: ApprovalRequest;
  onViewThread: () => void;
  className?: string;
}

export function ApprovalFooter({
  approval,
  onViewThread,
  className,
}: ApprovalFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-3 px-5 bg-[var(--background)]",
        "border-t border-[var(--border-subtle)]",
        className
      )}
    >
      <div className="flex items-center gap-2 text-[13px]">
        {approval.status === "pending" && (
          <span className="text-[var(--text-muted)]">
            Awaiting approval from {approval.requestedBy.name}
          </span>
        )}
        {approval.status === "approved" && approval.reviewedBy && (
          <span className="text-[var(--text-muted)]">
            Approved by {approval.reviewedBy.name} •{" "}
            {formatMessageTime(approval.reviewedAt!)}
          </span>
        )}
        {approval.status === "changes_requested" && (
          <span className="text-[var(--text-muted)]">
            Changes requested by {approval.reviewedBy?.name}
          </span>
        )}
      </div>
      
      <button
        onClick={onViewThread}
        className="text-[13px] text-[var(--info)] hover:underline"
      >
        View Thread →
      </button>
    </div>
  );
}
