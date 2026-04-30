"use client";

import { useState, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { quickVibes } from "@/data/vibe-transformations";
import { cn } from "@/lib/cn";

interface FloatingVibeInputProps {
  onSubmit: (vibe: string) => void;
  onCancel: () => void;
  className?: string;
}

export function FloatingVibeInput({
  onSubmit,
  onCancel,
  className,
}: FloatingVibeInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleQuickVibe = (vibe: string) => {
    onSubmit(vibe);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn(
        "bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)]",
        "shadow-[var(--shadow-md)] p-4",
        className
      )}
    >
      <p className="text-body-sm text-[var(--text-muted)] mb-3">
        Quick adjustments:
      </p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {quickVibes.map((vibe) => (
          <button
            key={vibe.id}
            onClick={() => handleQuickVibe(vibe.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[13px]",
              "border border-[var(--border)] text-[var(--text-secondary)]",
              "hover:border-[var(--text-muted)] hover:bg-[var(--background)]",
              "transition-all duration-150"
            )}
          >
            {vibe.label}
          </button>
        ))}
      </div>

      <p className="text-body-sm text-[var(--text-muted)] mb-2">
        Or describe your change:
      </p>

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Make this more premium and less family-focused"
          className={cn(
            "flex-1 h-10 px-4 bg-[var(--background)] rounded-[var(--radius-md)]",
            "border border-[var(--border)] text-[var(--text-primary)] text-[14px]",
            "placeholder:text-[var(--text-muted)]",
            "focus:outline-none focus:border-[var(--text-secondary)]"
          )}
          autoFocus
        />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" size="small" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="brand"
          size="small"
          onClick={handleSubmit}
          disabled={!value.trim()}
        >
          Apply
        </Button>
      </div>
    </motion.div>
  );
}
