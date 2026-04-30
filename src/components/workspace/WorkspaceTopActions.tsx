"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AccountDropdown } from "@/components/home/AccountDropdown";
import { useAuthStore } from "@/stores/auth";
import { useSimpleCanvasStore } from "@/stores/simple-canvas";
import { useConversationStore } from "@/stores/conversation";
import { usePreviewStore } from "@/stores/preview";
import { cn } from "@/lib/cn";

type SavePhase = "idle" | "saving" | "saved";

function useAutoSaveIndicator(): SavePhase {
  const isGenerating = useSimpleCanvasStore((s) => s.isGenerating);
  const isThinking = useConversationStore((s) => s.isThinking);
  const [phase, setPhase] = useState<SavePhase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const wasActive = useRef(false);
  const statusSnapshot = useRef<string>("");

  const triggerSave = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase("saving");
    timers.current.push(setTimeout(() => setPhase("saved"), 1400));
    timers.current.push(setTimeout(() => setPhase("idle"), 4000));
  };

  // After generation / thinking completes
  useEffect(() => {
    const active = isGenerating || isThinking;
    if (active) {
      wasActive.current = true;
    } else if (wasActive.current) {
      wasActive.current = false;
      triggerSave();
    }
  }, [isGenerating, isThinking]); // eslint-disable-line react-hooks/exhaustive-deps

  // Every 3 minutes
  useEffect(() => {
    const interval = setInterval(triggerSave, 3 * 60 * 1000);
    return () => { clearInterval(interval); timers.current.forEach(clearTimeout); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On publish / unpublish status changes
  const cards = useSimpleCanvasStore((s) => s.cards);
  useEffect(() => {
    const key = cards.map(c => `${c.id}:${c.status}`).join(",");
    if (statusSnapshot.current && key !== statusSnapshot.current) {
      triggerSave();
    }
    statusSnapshot.current = key;
  }, [cards]); // eslint-disable-line react-hooks/exhaustive-deps

  return phase;
}

/** Share (icon) → Publish (primary) → account — canvas + preview. */
export function WorkspaceTopActions() {
  const { isAuthenticated } = useAuthStore();
  const { viewport, zoom: zoomFn, fitToContent, resetViewport } = useSimpleCanvasStore();
  const viewMode = usePreviewStore((s) => s.viewMode);
  const pct = Math.round(viewport.zoom * 100);
  const savePhase = useAutoSaveIndicator();

  return (
    <div
      data-workspace-chrome="top-actions"
      className="pointer-events-auto absolute right-3 top-3 flex items-center gap-2"
      style={{ zIndex: "var(--z-dropdown)" }}
    >
      {/* Auto-save indicator — left of zoom */}
      <AnimatePresence>
        {savePhase !== "idle" && viewMode === "canvas" && (
          <motion.div
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-1.5 pr-1"
          >
            {savePhase === "saving" ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              >
                <SaveSpinnerIcon className="h-3.5 w-3.5 text-neutral-400" />
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <SaveCheckIcon className="h-3.5 w-3.5 text-neutral-400" />
              </motion.div>
            )}
            <span className="text-[12px] text-neutral-400 select-none">
              {savePhase === "saving" ? "Saving…" : "Saved"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom controls — canvas mode only, left of the main bar */}
      {viewMode === "canvas" && (
        <div className="flex h-12 items-center gap-0.5 rounded-xl bg-[var(--surface)] px-1.5 shadow-[var(--shadow-panel)]">
          <button
            type="button"
            title="Zoom out"
            onClick={() => zoomFn(-0.1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
          >
            <MinusIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Reset zoom to 100%"
            onClick={() => resetViewport()}
            className="min-w-[42px] px-1 text-center text-[13px] font-medium tabular-nums text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            {pct}%
          </button>
          <button
            type="button"
            title="Zoom in"
            onClick={() => zoomFn(0.1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
          <div className="mx-0.5 h-5 w-px bg-neutral-200" aria-hidden />
          <button
            type="button"
            title="Fit to content"
            onClick={() => fitToContent()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
          >
            <FitIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div
        className={cn(
          "flex h-12 shrink-0 items-center gap-1 rounded-xl bg-[var(--surface)] px-1.5 shadow-[var(--shadow-panel)]",
        )}
      >
        <button
          type="button"
          title="Share"
          aria-label="Share campaign"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)] active:bg-neutral-200/80"
        >
          <ShareIcon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>

        {isAuthenticated && (
          <>
            <div className="mx-0.5 h-6 w-px shrink-0 bg-neutral-200/90" aria-hidden />
            <div className="flex shrink-0 items-center">
              <AccountDropdown variant="light" avatarRadius="xl" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ShareIcon({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function FitIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

function SaveSpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" opacity={0.3} />
      <path d="M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function SaveCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
