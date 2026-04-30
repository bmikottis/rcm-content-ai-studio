"use client";

import { useRef, useState } from "react";
import { supportedLanguages } from "@/data/mock-contacts";
import { DetachedDropdown } from "./DetachedDropdown";
import { cn } from "@/lib/cn";

interface LanguageSelectorProps {
  selected: string;
  onChange: (language: string) => void;
  className?: string;
  omitLabel?: boolean;
}

export function LanguageSelector({
  selected,
  onChange,
  className,
  omitLabel = false,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedLanguage = supportedLanguages.find((l) => l.code === selected);

  return (
    <div className={cn("relative min-w-0", className)}>
      {!omitLabel && (
        <label className="mb-2 block text-body-sm text-[var(--text-muted)]">Language</label>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-12 w-full min-w-0 items-center justify-between gap-2 px-4 py-3",
          "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] text-left",
          "transition-colors hover:border-[var(--text-muted)]",
        )}
      >
        <span className="min-w-0 flex-1 truncate text-body-sm text-[var(--text-primary)]">
          {selectedLanguage?.flag} {selectedLanguage?.label}
        </span>
        <span className="shrink-0 text-[var(--text-muted)]">▾</span>
      </button>

      <DetachedDropdown open={isOpen} onClose={() => setIsOpen(false)} triggerRef={triggerRef} maxHeight={240}>
        {supportedLanguages.map((language) => (
          <button
            key={language.code}
            type="button"
            onClick={() => {
              onChange(language.code);
              setIsOpen(false);
            }}
            className={cn(
              "flex w-full min-w-0 items-center px-4 py-3 text-left transition-colors hover:bg-[var(--background)]",
              selected === language.code && "bg-[var(--background)]",
            )}
          >
            <span className="min-w-0 truncate text-body-sm text-[var(--text-primary)]">
              {selected === language.code && "● "}
              {language.flag} {language.label}
            </span>
          </button>
        ))}
      </DetachedDropdown>
    </div>
  );
}
