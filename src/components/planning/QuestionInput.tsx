"use client";

import { useState, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface QuestionInputProps {
  onSubmit: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function QuestionInput({
  onSubmit,
  placeholder = "Type your answer...",
  className,
}: QuestionInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className={cn("flex items-center gap-3 mt-4", className)}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "flex-1 h-12 px-4 bg-[var(--background)] rounded-[var(--radius-md)]",
          "border border-[var(--border)] text-[var(--text-primary)]",
          "placeholder:text-[var(--text-muted)]",
          "transition-all duration-[var(--duration-fast)]",
          "focus:outline-none focus:border-[var(--text-secondary)]"
        )}
        autoFocus
      />
      <Button
        variant="brand"
        size="medium"
        onClick={handleSubmit}
        disabled={!value.trim()}
        rightIcon={<ArrowIcon className="w-4 h-4" />}
      >
        Continue
      </Button>
    </motion.div>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
