"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  className?: string;
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Launch a campaign for a new electric SUV focused on urban families",
  className,
}: PromptInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className={cn("w-full max-w-[720px] mx-auto", className)}>
      <motion.div
        animate={{
          boxShadow: isFocused
            ? "0 8px 32px rgba(0,0,0,0.08)"
            : "0 4px 24px rgba(0,0,0,0.04)",
        }}
        className={cn(
          "relative bg-[var(--surface)] rounded-[var(--radius-xl)] border transition-colors duration-200",
          isFocused ? "border-[var(--text-muted)]" : "border-[var(--border)]"
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={3}
          className={cn(
            "w-full px-6 py-5 text-[var(--text-primary)] bg-transparent",
            "placeholder:text-[var(--text-muted)] resize-none",
            "focus:outline-none text-[16px] leading-relaxed"
          )}
        />
        
        {/* Submit button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: value.trim() || isFocused ? 1 : 0,
            scale: value.trim() || isFocused ? 1 : 0.9,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSubmit}
          disabled={!value.trim()}
          className={cn(
            "absolute right-4 bottom-4 w-10 h-10 rounded-full",
            "bg-[var(--accent)] text-white",
            "flex items-center justify-center",
            "transition-colors duration-200",
            "hover:bg-[var(--accent-hover)]",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <ArrowIcon className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
