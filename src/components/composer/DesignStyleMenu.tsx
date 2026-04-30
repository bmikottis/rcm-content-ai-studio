"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useComposerStore, mockDesignStyles } from "@/stores/composer";
import { cn } from "@/lib/cn";

interface DesignStyleMenuProps {
  variant: "dark" | "light";
}

export function DesignStyleMenu({ variant }: DesignStyleMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { designStyle, setDesignStyle } = useComposerStore();

  const isLight = variant === "light";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const t = {
    button: isLight
      ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-600"
      : "bg-white/[0.06] hover:bg-white/[0.1] text-white/60",
    buttonActive: isLight
      ? "bg-blue-50 text-blue-700 border border-blue-200"
      : "bg-[#00A1E0]/15 text-[#00A1E0] border border-[#00A1E0]/30",
    menu: isLight
      ? "bg-white border-[#DDD] shadow-xl"
      : "bg-[#1C1C1E] border-white/10 shadow-2xl",
    styleItem: isLight
      ? "hover:bg-neutral-50 text-neutral-700"
      : "hover:bg-white/[0.06] text-white/80",
    styleItemSelected: isLight
      ? "bg-blue-50 border-blue-200"
      : "bg-[#00A1E0]/10 border-[#00A1E0]/20",
    styleDesc: isLight ? "text-[#7A7A7A]" : "text-white/40",
    header: isLight ? "text-neutral-500 border-[#DDD]" : "text-white/40 border-white/[0.06]",
  };

  const hasStyle = !!designStyle;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "h-8 rounded-lg flex items-center gap-1.5 px-2.5 transition-all text-[13px] font-medium",
          hasStyle ? t.buttonActive : t.button,
          isOpen && !hasStyle && (isLight ? "bg-neutral-200" : "bg-white/[0.1]")
        )}
      >
        <PaletteIcon className="w-3.5 h-3.5" />
        <span>{designStyle?.name || "Style"}</span>
        <ChevronIcon className={cn("w-3 h-3 opacity-50 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute bottom-full right-0 mb-2 w-[200px]",
              "rounded-xl border overflow-hidden z-50",
              t.menu
            )}
          >
            <div className={cn("px-3 py-2 border-b text-[11px] font-semibold uppercase tracking-wider", t.header)}>
              Design Style
            </div>

            <div className="p-1">
              {mockDesignStyles.map((style) => {
                const isSelected = designStyle?.id === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => {
                      setDesignStyle(isSelected ? null : style);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left border border-transparent",
                      t.styleItem,
                      isSelected && t.styleItemSelected
                    )}
                  >
                    <div className="flex-1">
                      <p className="text-[13px] font-medium">{style.name}</p>
                      <p className={cn("text-[13px]", t.styleDesc)}>{style.description}</p>
                    </div>
                    {isSelected && (
                      <CheckIcon className={cn("w-3.5 h-3.5 flex-shrink-0", isLight ? "text-blue-600" : "text-[#00A1E0]")} />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="1" />
      <circle cx="17.5" cy="10.5" r="1" />
      <circle cx="8.5" cy="7.5" r="1" />
      <circle cx="6.5" cy="12.5" r="1" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
