"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface AddBlockButtonProps {
  onClick: () => void;
  className?: string;
}

export function AddBlockButton({ onClick, className }: AddBlockButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "w-full py-6 rounded-[var(--radius-lg)]",
        "border-2 border-dashed border-[var(--border)]",
        "flex items-center justify-center gap-2",
        "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
        "hover:border-[var(--text-muted)] hover:bg-[var(--surface)]",
        "transition-all duration-200",
        className
      )}
    >
      <PlusIcon className="w-5 h-5" />
      <span className="text-body-sm">Add Content Block</span>
    </motion.button>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
