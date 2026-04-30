"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimpleCanvasStore } from "@/stores/simple-canvas";
import { cn } from "@/lib/cn";

interface TagsMenuProps {
  variant?: "dark" | "light" | "glass";
}

export function TagsMenu({ variant = "dark" }: TagsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [dropdownPosition, setDropdownPosition] = useState<"above" | "below">("above");
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const cards = useSimpleCanvasStore((s) => s.cards);

  const isDark = variant === "dark";

  // Collect all unique tags from blocks
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const card of cards) {
      for (const tag of card.tags ?? []) tagSet.add(tag);
    }
    return [...tagSet].sort();
  }, [cards]);

  const calculateDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 300;
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

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const getButtonLabel = () => {
    if (selectedTags.size === 0) return "Tags";
    if (selectedTags.size === 1) return [...selectedTags][0];
    return `${selectedTags.size} tags`;
  };

  const t = {
    button: isDark
      ? selectedTags.size > 0
        ? "bg-amber-500/10 border-amber-500/15 text-amber-400/90 hover:bg-amber-500/15"
        : "bg-white/[0.03] border-white/[0.05] text-white/30 hover:bg-white/[0.05] hover:text-white/45"
      : selectedTags.size > 0
        ? "bg-amber-50 text-amber-600 border border-amber-200/80 hover:bg-amber-100"
        : "bg-neutral-50 text-[#7A7A7A] border border-[#DDD] hover:bg-neutral-100 hover:text-neutral-500",
    buttonOpen: isDark ? "ring-1 ring-white/15" : "ring-1 ring-neutral-300",
    menu: isDark
      ? "bg-[#1a1a1c] border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
      : "bg-white border border-[#DDD] shadow-xl",
    sectionTitle: isDark ? "text-white/30" : "text-[#7A7A7A]",
    itemDesc: isDark ? "text-white/30" : "text-[#7A7A7A]",
    tag: isDark
      ? "bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.07]"
      : "bg-neutral-50 border-[#DDD] text-neutral-600 hover:bg-neutral-100",
    tagSelected: isDark
      ? "bg-amber-500/15 border-amber-500/25 text-amber-400"
      : "bg-amber-50 border-amber-300 text-amber-700",
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
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full",
          "text-[13px] font-medium",
          "transition-all duration-150 border",
          t.button,
          isOpen && t.buttonOpen,
        )}
      >
        {selectedTags.size > 0 ? (
          <CheckIcon className="w-3 h-3" />
        ) : (
          <TagIcon className="w-3 h-3" />
        )}
        <span className="max-w-[100px] truncate">{getButtonLabel()}</span>
        <ChevronIcon className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: dropdownPosition === "above" ? 8 : -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropdownPosition === "above" ? 8 : -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute left-0 w-[280px] rounded-xl overflow-hidden",
              dropdownPosition === "above" ? "bottom-full mb-2" : "top-full mt-2",
              t.menu,
            )}
            style={{ zIndex: "var(--z-dropdown)" }}
          >
            <div className="p-3 space-y-2">
              <p className={cn("text-[11px] font-medium uppercase tracking-wider px-1", t.sectionTitle)}>
                Tags
              </p>
              <p className={cn("text-[13px] px-1 -mt-1", t.itemDesc)}>
                Select tags to scope the agent context.
              </p>

              {availableTags.length === 0 ? (
                <p className={cn("text-[13px] px-1 py-4 text-center", t.itemDesc)}>
                  No tags on any blocks yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-2 max-h-[220px] overflow-y-auto">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.has(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[13px] font-medium border transition-all",
                          isSelected ? t.tagSelected : t.tag,
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedTags.size > 0 && (
                <div className="pt-2 border-t border-[#DDD]/50 flex items-center justify-between">
                  <span className={cn("text-[13px]", t.itemDesc)}>
                    {selectedTags.size} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedTags(new Set())}
                    className={cn("text-[13px] font-medium transition-colors", isDark ? "text-white/40 hover:text-white/70" : "text-[#7A7A7A] hover:text-neutral-600")}
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
