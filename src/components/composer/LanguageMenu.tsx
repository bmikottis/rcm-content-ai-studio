"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

interface LanguageMenuProps {
  variant?: "dark" | "light" | "glass";
}

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: "en-US", name: "English (US)", flag: "🇺🇸" },
  { code: "en-UK", name: "English (UK)", flag: "🇬🇧" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "pt-BR", name: "Portuguese (Brazil)", flag: "🇧🇷" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "zh-CN", name: "Chinese (Simplified)", flag: "🇨🇳" },
];

export function LanguageMenu({ variant = "dark" }: LanguageMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set());
  const [dropdownPosition, setDropdownPosition] = useState<"above" | "below">("above");
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isDark = variant === "dark";

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
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const toggleLanguage = (langCode: string) => {
    setSelectedLanguages((prev) => {
      const next = new Set(prev);
      if (next.has(langCode)) {
        next.delete(langCode);
      } else {
        next.add(langCode);
      }
      return next;
    });
  };

  const getButtonLabel = () => {
    if (selectedLanguages.size === 0) return "Languages";
    if (selectedLanguages.size === 1) {
      const lang = languages.find(l => selectedLanguages.has(l.code));
      return lang?.name || "Languages";
    }
    return `${selectedLanguages.size} languages`;
  };

  const t = {
    button: isDark
      ? selectedLanguages.size > 0
        ? "bg-blue-500/10 border-blue-500/15 text-blue-400/90 hover:bg-blue-500/15"
        : "bg-white/[0.03] border-white/[0.05] text-white/30 hover:bg-white/[0.05] hover:text-white/45"
      : selectedLanguages.size > 0
        ? "bg-blue-50 text-blue-600 border border-blue-200/80 hover:bg-blue-100"
        : "bg-neutral-50 text-[#7A7A7A] border border-[#DDD] hover:bg-neutral-100 hover:text-neutral-500",
    buttonOpen: isDark ? "ring-1 ring-white/15" : "ring-1 ring-neutral-300",
    menu: isDark
      ? "bg-[#1a1a1c] border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
      : "bg-white border border-[#DDD] shadow-xl",
    sectionTitle: isDark ? "text-white/30" : "text-[#7A7A7A]",
    itemLabel: isDark ? "text-white/70" : "text-neutral-700",
    item: isDark
      ? "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
      : "bg-white border-[#DDD] hover:bg-neutral-50",
    itemSelected: isDark
      ? "bg-blue-500/10 border-blue-500/20"
      : "bg-blue-50 border-blue-200",
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
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
          "text-[13px] font-medium",
          "transition-all duration-150 border",
          t.button,
          isOpen && t.buttonOpen
        )}
      >
        {selectedLanguages.size > 0 ? (
          <CheckIcon className="w-3 h-3" />
        ) : (
          <GlobeIcon className="w-3 h-3" />
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
              t.menu
            )}
            style={{ zIndex: "var(--z-dropdown)" }}
          >
            <div className="p-3 space-y-2">
              <p className={cn("text-[11px] font-medium uppercase tracking-wider px-1", t.sectionTitle)}>
                Languages
              </p>

              <div className="flex flex-wrap gap-2 mt-2">
                {languages.map((lang) => {
                  const isSelected = selectedLanguages.has(lang.code);
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => toggleLanguage(lang.code)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                        isSelected ? t.itemSelected : t.item
                      )}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span className={cn("text-[13px] font-medium", t.itemLabel)}>
                        {lang.name}
                      </span>
                      {isSelected && (
                        <CheckIcon className={cn("w-3 h-3 ml-1", isDark ? "text-blue-400" : "text-blue-600")} />
                      )}
                    </button>
                  );
                })}
              </div>
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

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
