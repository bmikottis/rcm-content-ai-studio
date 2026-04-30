"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

interface BriefMenuProps {
  variant?: "dark" | "light" | "glass";
  onBriefSelect?: (briefId: string | null) => void;
  /** When set to null externally, clears the internal selection */
  controlledBriefId?: string | null;
}

export interface Brief {
  id: string;
  name: string;
  description: string;
  brand: string;
  assets: number;
  audiences: number;
  lastUsed?: string;
}

export const mockBriefs: Brief[] = [
  {
    id: "brief-1",
    name: "Q2 Product Launch",
    description: "Spring collection launch campaign",
    brand: "Salesforce Palette",
    assets: 12,
    audiences: 3,
    lastUsed: "2 days ago",
  },
  {
    id: "brief-2",
    name: "Holiday Campaign 2026",
    description: "End of year promotional campaign",
    brand: "Salesforce Palette",
    assets: 8,
    audiences: 2,
    lastUsed: "1 week ago",
  },
  {
    id: "brief-3",
    name: "Customer Win-back",
    description: "Re-engagement for dormant customers",
    brand: "Salesforce Palette",
    assets: 5,
    audiences: 4,
  },
];

export function BriefMenu({ variant = "dark", onBriefSelect, controlledBriefId }: BriefMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<"above" | "below">("above");
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isDark = variant === "dark";
  const hasSelection = selectedBrief !== null;

  const calculateDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 400;
    const spaceAbove = buttonRect.top;
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    if (spaceAbove < dropdownHeight && spaceBelow > spaceAbove) {
      setDropdownPosition("below");
    } else {
      setDropdownPosition("above");
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  useEffect(() => {
    if (controlledBriefId === null && selectedBrief !== null) {
      setSelectedBrief(null);
    } else if (controlledBriefId && controlledBriefId !== selectedBrief?.id) {
      const brief = mockBriefs.find(b => b.id === controlledBriefId);
      if (brief) setSelectedBrief(brief);
    }
  }, [controlledBriefId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectBrief = (brief: Brief) => {
    setSelectedBrief(brief);
    setIsOpen(false);
    onBriefSelect?.(brief.id);
  };

  const handleClearBrief = () => {
    setSelectedBrief(null);
    onBriefSelect?.(null);
  };

  const getButtonLabel = () => selectedBrief ? selectedBrief.name : "Brief";

  const t = {
    button: isDark
      ? hasSelection
        ? "bg-blue-500/10 border-blue-500/15 text-blue-400/90 hover:bg-blue-500/15"
        : "bg-white/[0.03] border-white/[0.05] text-white/30 hover:bg-white/[0.05] hover:text-white/45"
      : hasSelection
        ? "bg-blue-50 text-blue-600 border border-blue-200/80 hover:bg-blue-100"
        : "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
    buttonOpen: isDark ? "ring-1 ring-white/15" : "ring-1 ring-neutral-300",
    menu: isDark
      ? "bg-[#1a1a1c] border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
      : "bg-[var(--surface)] border border-[var(--border)] shadow-xl",
    sectionTitle: isDark ? "text-white/30" : "text-[var(--text-muted)]",
    briefCard: isDark
      ? "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]"
      : "bg-[var(--surface-subtle)] border-[var(--border)] hover:bg-[var(--surface-active)] hover:border-[var(--border)]",
    briefCardSelected: isDark
      ? "bg-blue-500/10 border-blue-500/20"
      : "bg-blue-50 border-blue-200",
    briefTitle: isDark ? "text-white/90" : "text-[var(--text-primary)]",
    briefDesc: isDark ? "text-white/40" : "text-[var(--text-secondary)]",
    briefMeta: isDark ? "text-white/25" : "text-[var(--text-muted)]",
  };

  return (
    <div ref={menuRef} className="relative" data-popover>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!isOpen) calculateDropdownPosition();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 border",
          t.button,
          isOpen && t.buttonOpen,
        )}
      >
        <PaperclipIcon className="w-3 h-3 flex-shrink-0" />
        <span className="relative">
          <span className="invisible whitespace-nowrap">Brief</span>
          <span className="absolute inset-0 truncate">{getButtonLabel()}</span>
        </span>
        <ChevronIcon className={cn("w-3 h-3 flex-shrink-0 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: dropdownPosition === "above" ? 8 : -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropdownPosition === "above" ? 8 : -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute left-0 w-[340px] rounded-xl overflow-hidden",
              dropdownPosition === "above" ? "bottom-full mb-2" : "top-full mt-2",
              t.menu,
            )}
            style={{ zIndex: "var(--z-dropdown)" }}
          >
            <div className="max-h-[380px] overflow-y-auto p-3 space-y-2">
              <p className={cn("text-[11px] font-medium uppercase tracking-wider px-1", t.sectionTitle)}>
                Marketing Cloud Briefs
              </p>

              {mockBriefs.map((brief) => {
                const isSelected = selectedBrief?.id === brief.id;
                return (
                  <button
                    key={brief.id}
                    onClick={() => handleSelectBrief(brief)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all",
                      isSelected ? t.briefCardSelected : t.briefCard,
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[13px] font-medium truncate", t.briefTitle)}>
                            {brief.name}
                          </span>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0"
                            >
                              <CheckIcon className="w-2.5 h-2.5 text-white" />
                            </motion.div>
                          )}
                        </div>
                        <p className={cn("text-[13px] mt-0.5 truncate", t.briefDesc)}>
                          {brief.description}
                        </p>
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-3 mt-2 text-[13px]", t.briefMeta)}>
                      <span>{brief.brand}</span>
                      <span>·</span>
                      <span>{brief.assets} assets</span>
                      <span>·</span>
                      <span>{brief.audiences} audiences</span>
                      {brief.lastUsed && (
                        <>
                          <span>·</span>
                          <span>{brief.lastUsed}</span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}

              {selectedBrief && (
                <button
                  onClick={handleClearBrief}
                  className={cn(
                    "w-full py-2 text-center text-[13px] font-medium rounded-lg transition-colors",
                    isDark
                      ? "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
                      : "text-[var(--text-muted)] hover:text-neutral-600 hover:bg-[var(--surface-hover)]",
                  )}
                >
                  Clear selection
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}
