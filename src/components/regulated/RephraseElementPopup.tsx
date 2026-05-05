"use client";

import { useState, KeyboardEvent, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSimpleCanvasStore } from "@/stores/simple-canvas";
import { useCanvasStore } from "@/stores/canvas";
import { ContentElement } from "@/types/simple-canvas";
import { getPresetsForContext, applyRephrasePreset } from "@/data/rephrase-presets";
import { InlineDiff } from "@/components/canvas/InlineDiff";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Phase = "prompt" | "regenerating" | "diff";

interface RephraseElementPopupProps {
  cardId: string;
  element: ContentElement;
  channel: "email" | "sms";
  onClose: () => void;
}

export function RephraseElementPopup({
  cardId,
  element,
  channel,
  onClose,
}: RephraseElementPopupProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return createPortal(
    <RephrasePopupContent
      cardId={cardId}
      element={element}
      channel={channel}
      onClose={onClose}
    />,
    document.body,
  );
}

function RephrasePopupContent({
  cardId,
  element,
  onClose,
}: RephraseElementPopupProps) {
  const [phase, setPhase] = useState<Phase>("prompt");
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [regeneratedContent, setRegeneratedContent] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const projectId = useCanvasStore((s) => s.projectId);
  const regulated = projectId === "proj-pharma-email";
  const presets = getPresetsForContext(regulated);
  const updateElement = useSimpleCanvasStore((s) => s.updateElement);

  // Close on Escape
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Focus textarea on mount
  useEffect(() => {
    if (phase === "prompt") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [phase]);

  const togglePreset = (id: string) => {
    setSelectedPresets((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const canSubmit = selectedPresets.length > 0 || customPrompt.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setPhase("regenerating");

    // Simulate AI regeneration delay
    await new Promise((r) => setTimeout(r, 1200));

    const { newContent } = applyRephrasePreset(
      element.content,
      selectedPresets,
      customPrompt,
    );

    setRegeneratedContent(newContent);
    setPhase("diff");
  };

  const handleAccept = () => {
    updateElement(cardId, element.id, { content: regeneratedContent });
    onClose();
  };

  const handleTryAgain = () => {
    setPhase("prompt");
    setRegeneratedContent("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const noChange = regeneratedContent === element.content;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
        aria-hidden
      />

      {/* Popup */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999]",
          "w-full max-w-[520px] mx-auto",
          "bg-[var(--surface)] rounded-2xl border border-[var(--border)]",
          "shadow-[0_8px_40px_rgba(0,0,0,0.14)] px-5 py-4",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          {phase === "prompt" && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center">
                    <RephraseIcon className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <span className="text-[14px] font-semibold text-[var(--text-primary)]">
                    Rephrase block
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-active)] transition-colors"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Preset chips */}
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                Style options
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {presets.map((preset) => {
                  const active = selectedPresets.includes(preset.id);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      title={preset.description}
                      onClick={() => togglePreset(preset.id)}
                      className={cn(
                        "h-7 px-3 rounded-full text-[12px] font-medium transition-all duration-100 border",
                        active
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50",
                      )}
                    >
                      {active && (
                        <span className="mr-1 text-indigo-200">✓</span>
                      )}
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom prompt */}
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
                Or describe your change
              </p>
              <textarea
                ref={inputRef}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Make this more empathetic and remove medical jargon"
                rows={2}
                className={cn(
                  "w-full px-3 py-2 rounded-xl resize-none",
                  "bg-[var(--background)] border border-[var(--border)]",
                  "text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                  "focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100",
                  "transition-colors",
                )}
              />

              {/* Actions */}
              <div className="flex justify-end gap-2 mt-3">
                <Button variant="neutral" size="small" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="brand"
                  size="small"
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                  className="bg-indigo-600 border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700"
                >
                  Regenerate
                </Button>
              </div>
            </motion.div>
          )}

          {phase === "regenerating" && (
            <motion.div
              key="regenerating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="py-6 flex flex-col items-center gap-3"
            >
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-100" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <RephraseIcon className="w-4 h-4 text-indigo-500" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-[14px] font-medium text-[var(--text-primary)]">
                  Regenerating...
                </p>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                  Applying{" "}
                  {selectedPresets.length > 0
                    ? selectedPresets.length === 1
                      ? presets.find((p) => p.id === selectedPresets[0])?.label
                      : `${selectedPresets.length} styles`
                    : "your prompt"}
                </p>
              </div>
            </motion.div>
          )}

          {phase === "diff" && (
            <motion.div
              key="diff"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                    <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[14px] font-semibold text-[var(--text-primary)]">
                    {noChange ? "No changes detected" : "Review changes"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-active)] transition-colors"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {noChange ? (
                <p className="text-[13px] text-[var(--text-muted)] mb-4">
                  The selected options didn&apos;t produce a different result for this block. Try a different style or add a custom prompt.
                </p>
              ) : (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-3 mb-4 max-h-48 overflow-y-auto">
                  <InlineDiff
                    original={element.content}
                    updated={regeneratedContent}
                  />
                </div>
              )}

              {/* Applied tags */}
              {(selectedPresets.length > 0 || customPrompt.trim()) && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {selectedPresets.map((id) => (
                    <span
                      key={id}
                      className="h-5 px-2 rounded-full bg-indigo-50 border border-indigo-200 text-[10px] font-medium text-indigo-700"
                    >
                      {presets.find((p) => p.id === id)?.label ?? id}
                    </span>
                  ))}
                  {customPrompt.trim() && (
                    <span className="h-5 px-2 rounded-full bg-[var(--surface-active)] border border-[var(--border)] text-[10px] font-medium text-[var(--text-secondary)] max-w-[200px] truncate">
                      &quot;{customPrompt.trim()}&quot;
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="neutral" size="small" onClick={handleTryAgain}>
                  Try again
                </Button>
                {!noChange && (
                  <Button
                    variant="brand"
                    size="small"
                    onClick={handleAccept}
                    className="bg-indigo-600 border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700"
                  >
                    Accept
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function RephraseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
