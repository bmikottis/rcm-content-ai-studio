"use client";

import { useState, KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

interface CommentInputProps {
  onSubmit: (comment: string) => void;
  placeholder?: string;
  className?: string;
}

export function CommentInput({
  onSubmit,
  placeholder = "Add a comment...",
  className,
}: CommentInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "flex-1 h-10 px-4 bg-[var(--background)] rounded-[var(--radius-md)]",
          "border border-[var(--border)] text-[var(--text-primary)] text-[14px]",
          "placeholder:text-[var(--text-muted)]",
          "focus:outline-none focus:border-[var(--text-secondary)]"
        )}
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim()}
        className={cn(
          "w-10 h-10 rounded-[var(--radius-md)] bg-[var(--accent)]",
          "flex items-center justify-center text-white",
          "hover:bg-[var(--accent-hover)] transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <SendIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
