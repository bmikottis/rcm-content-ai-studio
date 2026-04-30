"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useComposerStore, mockSkills } from "@/stores/composer";
import { Skill } from "@/types/composer";
import { cn } from "@/lib/cn";

interface SkillsMenuProps {
  variant: "dark" | "light" | "glass";
  viewAllMode?: boolean;
}

export function SkillsMenu({ variant, viewAllMode }: SkillsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const { selectedSkills, toggleSkill } = useComposerStore();

  const isLight = variant === "light" || variant === "glass";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredSkills = mockSkills.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  const t = {
    button: isLight
      ? "bg-[var(--surface-active)] hover:bg-neutral-200 text-[var(--text-secondary)]"
      : "bg-white/[0.06] hover:bg-white/[0.1] text-white/60",
    buttonActive: isLight
      ? "bg-violet-100 text-violet-700 border border-violet-200"
      : "bg-violet-500/20 text-violet-300 border border-violet-500/30",
    menu: isLight
      ? "bg-[var(--surface)] border-[var(--border)] shadow-xl"
      : "bg-[#1C1C1E] border-white/10 shadow-2xl",
    input: isLight
      ? "bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
      : "bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/30",
    skillItem: isLight
      ? "hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
      : "hover:bg-white/[0.06] text-white/80",
    skillItemSelected: isLight
      ? "bg-violet-50 border-violet-200"
      : "bg-violet-500/10 border-violet-500/20",
    skillDesc: isLight ? "text-[var(--text-muted)]" : "text-white/40",
    label: isLight ? "text-[var(--text-secondary)]" : "text-white/40",
  };

  const hasSelectedSkills = selectedSkills.length > 0;

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
          viewAllMode
            ? isLight
              ? "text-[var(--text-muted)] hover:text-neutral-600"
              : "text-white/40 hover:text-white/60"
            : hasSelectedSkills
              ? t.buttonActive
              : t.button,
          !viewAllMode && isOpen && !hasSelectedSkills && (isLight ? "bg-neutral-200" : "bg-white/[0.1]")
        )}
      >
        {viewAllMode ? (
          <span>View all</span>
        ) : (
          <>
            <BookIcon className="w-3.5 h-3.5" />
            <span>Skills</span>
            {hasSelectedSkills && (
              <span className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center text-[13px] font-bold",
                isLight ? "bg-violet-600 text-white" : "bg-violet-500 text-white"
              )}>
                {selectedSkills.length}
              </span>
            )}
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
              "absolute bottom-full left-0 mb-2 w-[280px]",
              "rounded-xl border overflow-hidden z-50",
              t.menu
            )}
          >
            {/* Search */}
            <div className="p-2 border-b border-white/[0.06]">
              <input
                type="text"
                placeholder="Search skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  "w-full h-8 px-3 rounded-lg text-[13px] border",
                  "focus:outline-none transition-colors",
                  t.input
                )}
              />
            </div>

            {/* Skills list */}
            <div className="max-h-[280px] overflow-y-auto p-1">
              {filteredSkills.map((skill) => {
                const isSelected = selectedSkills.some((s) => s.id === skill.id);
                return (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill)}
                    className={cn(
                      "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all text-left border border-transparent",
                      t.skillItem,
                      isSelected && t.skillItemSelected
                    )}
                  >
                    <span className="text-lg mt-0.5">{skill.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium">{skill.name}</p>
                        {isSelected && (
                          <CheckIcon className={cn("w-3.5 h-3.5", isLight ? "text-violet-600" : "text-violet-400")} />
                        )}
                      </div>
                      <p className={cn("text-[13px] mt-0.5", t.skillDesc)}>
                        {skill.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected summary */}
            {selectedSkills.length > 0 && (
              <div className={cn("px-3 py-2 border-t", isLight ? "border-[var(--border)] bg-[var(--surface-subtle)]" : "border-white/[0.06] bg-white/[0.02]")}>
                <p className={cn("text-[13px]", t.label)}>
                  {selectedSkills.length} skill{selectedSkills.length > 1 ? "s" : ""} selected
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
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
