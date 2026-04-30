"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

interface BrandKitMenuProps {
  variant?: "dark" | "light" | "glass";
  /** Called only on manual user clicks, not on external sync */
  onManualSelect?: (brandId: string | null) => void;
  /** Push a brand selection from outside (e.g. brief auto-select) */
  externalBrandId?: string | null;
}

interface BrandOption {
  id: string;
  name: string;
  tone: string;
  colors: string[];
}

const mockBrands: BrandOption[] = [
  { id: "brand-1", name: "Salesforce Palette", tone: "Premium, Refined", colors: ["#1A1A1A", "#D4AF37", "#F5F5F0"] },
  { id: "brand-2", name: "Salesforce Palette Sport", tone: "Dynamic, Bold", colors: ["#FF4D4D", "#1A1A1A", "#FFFFFF"] },
  { id: "brand-3", name: "Salesforce Palette Home", tone: "Warm, Comfortable", colors: ["#8B7355", "#F5EFE6", "#2C3E50"] },
];

export function BrandKitMenu({ variant = "dark", onManualSelect, externalBrandId }: BrandKitMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandOption | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<"above" | "below">("above");
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isDark = variant === "dark";
  const hasSelection = selectedBrand !== null;

  const calculateDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 320;
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
    if (externalBrandId === undefined) return;
    if (externalBrandId === null) {
      setSelectedBrand(null);
    } else {
      const brand = mockBrands.find(b => b.id === externalBrandId);
      if (brand) setSelectedBrand(brand);
    }
  }, [externalBrandId]);

  const getButtonLabel = () => selectedBrand ? selectedBrand.name : "Brand Kit";

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
    listItem: isDark
      ? "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
      : "bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-hover)]",
    listItemSelected: isDark
      ? "bg-blue-500/10 border-blue-500/20"
      : "bg-blue-50 border-blue-200",
    briefTitle: isDark ? "text-white/90" : "text-[var(--text-primary)]",
    briefDesc: isDark ? "text-white/40" : "text-[var(--text-secondary)]",
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
        <BrandIcon className="w-3 h-3 flex-shrink-0" />
        <span className="relative">
          <span className="invisible whitespace-nowrap">Brand Kit</span>
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
                Select Brand Kit
              </p>

              {mockBrands.map((brand) => {
                const isSelected = selectedBrand?.id === brand.id;
                return (
                  <button
                    key={brand.id}
                    onClick={() => {
                      setSelectedBrand(brand);
                      onManualSelect?.(brand.id);
                    }}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all",
                      isSelected ? t.listItemSelected : t.listItem,
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[13px] font-medium", t.briefTitle)}>{brand.name}</span>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center"
                            >
                              <CheckIcon className="w-2.5 h-2.5 text-white" />
                            </motion.div>
                          )}
                        </div>
                        <p className={cn("text-[13px] mt-0.5", t.briefDesc)}>{brand.tone}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {brand.colors.map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}

              {selectedBrand && (
                <button
                  onClick={() => {
                    setSelectedBrand(null);
                    onManualSelect?.(null);
                  }}
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
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}
function ChevronIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>;
}
function BrandIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" /><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" /><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" /><circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" /></svg>;
}
