"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApprovalStore } from "@/stores/approval";
import { useCanvasStore } from "@/stores/canvas";
import { ThreadMessage } from "./ThreadMessage";
import { CommentInput } from "./CommentInput";
import { ApprovalActions } from "./ApprovalActions";
import { ApprovalBadge } from "./ApprovalBadge";
import { cn } from "@/lib/cn";

export function ApprovalThread() {
  const { blocks } = useCanvasStore();
  const {
    approvals,
    isThreadOpen,
    activeApprovalId,
    closeThread,
    addComment,
    approve,
    requestChanges,
  } = useApprovalStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const approval = activeApprovalId ? approvals[activeApprovalId] : null;
  const block = approval ? blocks.find((b) => b.id === approval.contentBlockId) : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeThread();
    };

    if (isThreadOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isThreadOpen, closeThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [approval?.thread.length]);

  const handleAddComment = (content: string) => {
    if (activeApprovalId) {
      addComment(activeApprovalId, content);
    }
  };

  const handleApprove = (comment?: string) => {
    if (activeApprovalId) {
      approve(activeApprovalId, comment);
    }
  };

  const handleRequestChanges = (comment: string) => {
    if (activeApprovalId) {
      requestChanges(activeApprovalId, comment);
    }
  };

  const channelLabel =
    block?.channel === "email"
      ? "EMAIL"
      : block?.channel === "sms"
      ? "SMS"
      : "WHATSAPP";

  return (
    <AnimatePresence>
      {isThreadOpen && approval && block && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={closeThread}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className={cn(
                "bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-panel)]",
                "w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
                <h2 className="text-h3 text-[var(--text-primary)]">Approval</h2>
                <button
                  onClick={closeThread}
                  className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--background)] transition-colors"
                >
                  <CloseIcon className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              {/* Content preview */}
              <div className="px-6 py-4 bg-[var(--background)] border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-caption text-[var(--text-muted)]">
                    {channelLabel} {block.variant && `VARIANT ${block.variant}`}
                  </span>
                  <span className="text-[var(--text-muted)]">•</span>
                  <ApprovalBadge status={approval.status} />
                </div>
                <p className="text-body-sm text-[var(--text-primary)]">
                  Subject: {block.headline.replace(/\{\{[^}]+\}\}/g, "[name]")}
                </p>
              </div>

              {/* Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {approval.thread.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <ThreadMessage message={message} />
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[var(--border-subtle)] space-y-4">
                {approval.status === "pending" && (
                  <>
                    <CommentInput onSubmit={handleAddComment} />
                    <ApprovalActions
                      onApprove={handleApprove}
                      onRequestChanges={handleRequestChanges}
                    />
                  </>
                )}

                {approval.status === "approved" && (
                  <div className="text-center py-2 text-[var(--success)]">
                    ✓ Approved by {approval.reviewedBy?.name}
                  </div>
                )}

                {approval.status === "changes_requested" && (
                  <CommentInput
                    onSubmit={handleAddComment}
                    placeholder="Reply to the feedback..."
                  />
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
