"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface ApprovalActionsProps {
  onApprove: (comment?: string) => void;
  onRequestChanges: (comment: string) => void;
  className?: string;
}

export function ApprovalActions({
  onApprove,
  onRequestChanges,
  className,
}: ApprovalActionsProps) {
  const [showChangeInput, setShowChangeInput] = useState(false);
  const [changeComment, setChangeComment] = useState("");

  const handleRequestChanges = () => {
    if (changeComment.trim()) {
      onRequestChanges(changeComment.trim());
      setChangeComment("");
      setShowChangeInput(false);
    }
  };

  if (showChangeInput) {
    return (
      <div className={cn("space-y-3", className)}>
        <textarea
          value={changeComment}
          onChange={(e) => setChangeComment(e.target.value)}
          placeholder="Describe the changes needed..."
          className={cn(
            "w-full h-20 px-4 py-3 bg-[var(--background)] rounded-[var(--radius-md)]",
            "border border-[var(--border)] text-[var(--text-primary)] text-[14px]",
            "placeholder:text-[var(--text-muted)] resize-none",
            "focus:outline-none focus:border-[var(--text-secondary)]"
          )}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="small"
            onClick={() => {
              setShowChangeInput(false);
              setChangeComment("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="brand"
            size="small"
            onClick={handleRequestChanges}
            disabled={!changeComment.trim()}
          >
            Request Changes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex justify-end gap-3", className)}>
      <Button variant="neutral" size="medium" onClick={() => setShowChangeInput(true)}>
        Request Changes
      </Button>
      <Button variant="brand" size="medium" onClick={() => onApprove()}>
        Approve
      </Button>
    </div>
  );
}
