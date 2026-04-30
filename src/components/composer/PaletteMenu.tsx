"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useComposerStore, mockPalettes } from "@/stores/composer";
import { cn } from "@/lib/cn";

interface PaletteMenuProps {
  variant: "dark" | "light";
}

export function PaletteMenu({ variant }: PaletteMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { selectedPalette, setPalette } = useComposerStore();

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
    menu: isLight
      ? "bg-white border-[#DDD] shadow-xl"
      : "bg-[#1C1C1E] border-white/10 shadow-2xl",
    paletteItem: isLight
      ? "hover:bg-neutral-50 text-neutral-700"
      : "hover:bg-white/[0.06] text-white/80",
    paletteItemSelected: isLight
      ? "bg-neutral-100 border-[#DDD]"
      : "bg-white/[0.08] border-white/20",
    source: isLight ? "text-[#7A7A7A]" : "text-white/40",
    header: isLight ? "text-neutral-500 border-[#DDD]" : "text-white/40 border-white/[0.06]",
  };

  const hasPalette = !!selectedPalette;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "h-8 rounded-lg flex items-center gap-2 px-2.5 transition-all text-[13px] font-medium",
          t.button,
          isOpen && (isLight ? "bg-neutral-200" : "bg-white/[0.1]")
        )}
      >
        {hasPalette ? (
          <>
            <div className="flex -space-x-0.5">
              {selectedPalette.colors.slice(0, 4).map((color, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full border border-white/20"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="max-w-[60px] truncate">{selectedPalette.name}</span>
          </>
        ) : (
          <>
            <ColorIcon className="w-3.5 h-3.5" />
            <span>Colors</span>
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute bottom-full right-0 mb-2 w-[220px]",
              "rounded-xl border overflow-hidden z-50",
              t.menu
            )}
          >
            <div className={cn("px-3 py-2 border-b text-[11px] font-semibold uppercase tracking-wider", t.header)}>
              Color Palette
            </div>

            <div className="p-1 max-h-[240px] overflow-y-auto">
              {/* Brand palettes */}
              <div className={cn("px-2 py-1.5 text-[13px] font-medium", t.source)}>Brand</div>
              {mockPalettes.filter(p => p.source === "brand").map((palette) => (
                <PaletteItem
                  key={palette.id}
                  palette={palette}
                  isSelected={selectedPalette?.id === palette.id}
                  onClick={() => {
                    setPalette(selectedPalette?.id === palette.id ? null : palette);
                    setIsOpen(false);
                  }}
                  theme={t}
                />
              ))}

              {/* Campaign palettes */}
              <div className={cn("px-2 py-1.5 text-[13px] font-medium mt-1", t.source)}>Campaigns</div>
              {mockPalettes.filter(p => p.source === "campaign").map((palette) => (
                <PaletteItem
                  key={palette.id}
                  palette={palette}
                  isSelected={selectedPalette?.id === palette.id}
                  onClick={() => {
                    setPalette(selectedPalette?.id === palette.id ? null : palette);
                    setIsOpen(false);
                  }}
                  theme={t}
                />
              ))}

              {/* Create new */}
              <button
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-lg transition-colors text-left",
                  t.paletteItem
                )}
              >
                <PlusIcon className="w-4 h-4 opacity-50" />
                <span className="text-[13px]">Create new palette</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PaletteItemProps {
  palette: typeof mockPalettes[0];
  isSelected: boolean;
  onClick: () => void;
  theme: Record<string, string>;
}

function PaletteItem({ palette, isSelected, onClick, theme }: PaletteItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left border border-transparent",
        theme.paletteItem,
        isSelected && theme.paletteItemSelected
      )}
    >
      <div className="flex -space-x-0.5">
        {palette.colors.map((color, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <span className="text-[13px] font-medium flex-1">{palette.name}</span>
      {isSelected && (
        <CheckIcon className="w-3.5 h-3.5 opacity-60" />
      )}
    </button>
  );
}

function ColorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a7 7 0 0 0 0 14 7 7 0 0 0 0-14" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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
