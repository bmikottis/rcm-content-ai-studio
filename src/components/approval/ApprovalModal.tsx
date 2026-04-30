"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApprovalStore } from "@/stores/approval";
import { useCanvasStore } from "@/stores/canvas";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function ApprovalModal() {
  const { blocks } = useCanvasStore();
  const { isModalOpen, activeApprovalId, closeRequestModal, requestApproval } =
    useApprovalStore();
  const [note, setNote] = useState("");

  const block = blocks.find((b) => b.id === activeApprovalId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRequestModal();
    };

    if (isModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isModalOpen, closeRequestModal]);

  const handleSubmit = () => {
    if (activeApprovalId) {
      requestApproval(activeApprovalId, note || undefined);
      setNote("");
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
      {isModalOpen && block && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={closeRequestModal}
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
                "w-full max-w-md overflow-hidden"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
                <h2 className="text-h3 text-[var(--text-primary)]">
                  Request Approval
                </h2>
                <button
                  onClick={closeRequestModal}
                  className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--background)] transition-colors"
                >
                  <CloseIcon className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Content preview */}
                <div className="bg-[var(--background)] rounded-[var(--radius-md)] p-4">
                  <div className="text-caption text-[var(--text-muted)] mb-2">
                    {channelLabel} {block.variant && `VARIANT ${block.variant}`}
                  </div>
                  <p className="text-body-sm text-[var(--text-primary)] font-medium">
                    Subject: {block.headline.replace(/\{\{[^}]+\}\}/g, "[name]")}
                  </p>
                  <p className="text-body-sm text-[var(--text-muted)] mt-1 line-clamp-2">
                    {block.body.replace(/\{\{[^}]+\}\}/g, "[name]").slice(0, 100)}...
                  </p>
                </div>

                {/* Note input */}
                <div>
                  <label className="block text-body-sm text-[var(--text-muted)] mb-2">
                    Add a note (optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ready for final review. Please check the CTA copy."
                    className={cn(
                      "w-full h-20 px-4 py-3 bg-[var(--background)] rounded-[var(--radius-md)]",
                      "border border-[var(--border)] text-[var(--text-primary)] text-[14px]",
                      "placeholder:text-[var(--text-muted)] resize-none",
                      "focus:outline-none focus:border-[var(--text-secondary)]"
                    )}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--border-subtle)]">
                <Button variant="outline" size="medium" onClick={closeRequestModal}>
                  Cancel
                </Button>
                <Button variant="brand" size="medium" onClick={handleSubmit}>
                  Request
                </Button>
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
