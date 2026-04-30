"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface SkeletonBlockProps {
  className?: string;
}

export function SkeletonBlock({ className }: SkeletonBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)]",
        "shadow-[var(--shadow-sm)] overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="px-5 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded skeleton" />
          <div className="w-24 h-4 rounded skeleton" />
        </div>
        <div className="w-16 h-4 rounded skeleton" />
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div className="w-3/4 h-6 rounded skeleton" />
        
        <div className="aspect-video w-full rounded-[var(--radius-md)] skeleton" />
        
        <div className="space-y-2">
          <div className="w-full h-4 rounded skeleton" />
          <div className="w-full h-4 rounded skeleton" />
          <div className="w-2/3 h-4 rounded skeleton" />
        </div>
        
        <div className="w-32 h-10 rounded skeleton" />
      </div>
    </motion.div>
  );
}
