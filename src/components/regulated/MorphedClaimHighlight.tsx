"use client";

import { ReactNode, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

interface MorphedClaimHighlightProps {
  claimCode: string;
  originalVerbatim: string;
  children: ReactNode;
  onPingRequest: (code: string) => void;
  /** If true, renders a subtle persistent underline (canvas view, not diff view) */
  persistent?: boolean;
}

/**
 * Wraps morphed claim text with a purple highlight and an inline info icon.
 *
 * - Text span: purple bg highlight, clicking it pings the sidebar claim card
 * - Info icon: hovering shows a tooltip card with Claim ID + original verbatim
 * - In canvas view (persistent=true): subtle underline + smaller icon
 */
export function MorphedClaimHighlight({
  claimCode,
  originalVerbatim,
  children,
  onPingRequest,
  persistent = false,
}: MorphedClaimHighlightProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const iconRef = useRef<HTMLButtonElement>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const handleIconMouseEnter = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top,
        left: rect.right + 8,
      });
    }
    setShowTooltip(true);
  };

  const handleIconMouseLeave = () => setShowTooltip(false);

  const handleSpanClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPingRequest(claimCode);
  };

  return (
    <>
      {/* Purple-highlighted claim text */}
      <span
        onClick={handleSpanClick}
        className={cn(
          "cursor-pointer transition-colors rounded-sm",
          persistent
            ? "border-b-2 border-purple-400 hover:bg-purple-50"
            : "bg-purple-100 border-b-2 border-purple-500 hover:bg-purple-200 px-0.5",
        )}
        title="Click to highlight in sidebar"
      >
        {children}
      </span>

      {/* Info icon — tooltip trigger */}
      <button
        ref={iconRef}
        type="button"
        onMouseEnter={handleIconMouseEnter}
        onMouseLeave={handleIconMouseLeave}
        onClick={(e) => {
          e.stopPropagation();
          onPingRequest(claimCode);
        }}
        className={cn(
          "inline-flex items-center justify-center align-middle rounded-full transition-colors ml-0.5",
          "focus:outline-none focus-visible:ring-1 focus-visible:ring-purple-400",
          persistent
            ? "w-3 h-3 text-purple-300 hover:text-purple-500"
            : "w-4 h-4 text-purple-400 hover:text-purple-700 hover:bg-purple-100",
        )}
        aria-label={`View original claim ${claimCode}`}
      >
        <InfoIcon className={persistent ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} />
      </button>

      {/* Tooltip card portal */}
      {showTooltip &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={cn(
              "fixed z-[99999] pointer-events-none",
              "w-72 rounded-xl border border-purple-200 bg-white shadow-xl",
              "px-4 py-3",
            )}
            style={{ top: tooltipPos.top - 4, left: tooltipPos.left }}
          >
            {/* Claim ID row */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-purple-400 w-20 shrink-0">
                Claim ID
              </span>
              <span className="font-mono text-[12px] font-bold text-purple-700 bg-purple-50 rounded px-1.5 py-0.5">
                {claimCode}
              </span>
            </div>

            {/* Divider */}
            <div className="border-t border-purple-100 mb-2" />

            {/* Original claim text row */}
            <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-400 mb-1">
              Original claim text
            </p>
            <p className="text-[11px] leading-snug text-[var(--text-primary,#111)] line-clamp-4">
              {originalVerbatim}
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-1 4a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0v-6z"
      />
    </svg>
  );
}
