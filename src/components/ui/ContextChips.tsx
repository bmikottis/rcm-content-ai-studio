"use client";

import { motion } from "framer-motion";
import { useContextStore } from "@/stores/context";
import { cn } from "@/lib/cn";

interface ContextChipsProps {
  className?: string;
}

export function ContextChips({ className }: ContextChipsProps) {
  const { context, isLoaded } = useContextStore();

  if (!isLoaded || !context) return null;

  const chips = [
    { label: "Brand", loaded: !!context.brand, detail: context.brand?.name },
    { label: "Assets", loaded: !!context.assets, detail: `${context.assets?.products?.length || 0} products` },
    { label: "Audience", loaded: context.audiences?.length > 0, detail: context.audiences?.[0]?.name },
  ];

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {chips.map((chip, index) => (
        <motion.div
          key={chip.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          className="group relative"
        >
          <div className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)]">
            <span className="text-[var(--success)]">✓</span>
            <span>{chip.label}</span>
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-[var(--text-primary)] text-white text-[13px] rounded-[var(--radius-md)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 shadow-lg">
            {chip.detail}
            <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-[var(--text-primary)]" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
