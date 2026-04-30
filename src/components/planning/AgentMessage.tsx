"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { ReactNode } from "react";

interface AgentMessageProps {
  children: ReactNode;
  className?: string;
}

export function AgentMessage({ children, className }: AgentMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)]",
        "shadow-[var(--shadow-sm)] p-6",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
