"use client";

import { ApprovalMessage } from "@/types/approval";
import { formatMessageTime } from "@/data/mock-approvals";
import { cn } from "@/lib/cn";

interface ThreadMessageProps {
  message: ApprovalMessage;
  className?: string;
}

export function ThreadMessage({ message, className }: ThreadMessageProps) {
  const isApproval = message.type === "approval";
  const isRejection = message.type === "rejection";

  return (
    <div className={cn("flex gap-3", className)}>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-medium flex-shrink-0"
        style={{ backgroundColor: message.author.avatarColor }}
      >
        {message.author.initials}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-body-sm font-medium text-[var(--text-primary)]">
            {message.author.name}
          </span>
          <span className="text-[13px] text-[var(--text-muted)]">
            {formatMessageTime(message.createdAt)}
          </span>
        </div>
        
        <p
          className={cn(
            "text-body-sm",
            isApproval && "text-[var(--success)]",
            isRejection && "text-[var(--error)]",
            !isApproval && !isRejection && "text-[var(--text-secondary)]"
          )}
        >
          {isApproval && "✓ "}
          {isRejection && "✕ Changes requested: "}
          {message.content}
        </p>
      </div>
    </div>
  );
}
