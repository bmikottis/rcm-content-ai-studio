"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface UserPromptProps {
  prompt: string;
  className?: string;
}

export function UserPrompt({ prompt, className }: UserPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-[var(--background)] rounded-[var(--radius-lg)] border border-[var(--border)]",
        "p-6",
        className
      )}
    >
      <p className="text-body text-[var(--text-primary)] leading-relaxed">
        "{prompt}"
      </p>
    </motion.div>
  );
}
