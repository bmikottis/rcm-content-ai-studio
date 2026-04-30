"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface NewProjectCardProps {
  onClick: () => void;
  className?: string;
}

export function NewProjectCard({ onClick, className }: NewProjectCardProps) {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        "w-full aspect-[4/3] rounded-[var(--radius-lg)]",
        "border-2 border-dashed border-[var(--border)]",
        "flex flex-col items-center justify-center gap-3",
        "hover:border-[var(--text-muted)] hover:bg-[var(--background)]",
        "transition-colors duration-200 cursor-pointer",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-[var(--background)] flex items-center justify-center">
        <PlusIcon className="w-6 h-6 text-[var(--text-muted)]" />
      </div>
      <span className="text-body-sm text-[var(--text-muted)]">New Project</span>
    </motion.button>
  );
}

function PlusIcon({ className }: { className?: string }) {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
