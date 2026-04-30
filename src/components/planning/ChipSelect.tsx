"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface Option {
  id: string;
  label: string;
}

interface ChipSelectProps {
  options: Option[];
  multi?: boolean;
  onSubmit: (selected: string | string[]) => void;
  className?: string;
}

export function ChipSelect({
  options,
  multi = false,
  onSubmit,
  className,
}: ChipSelectProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleOption = (id: string) => {
    if (multi) {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
      );
    } else {
      setSelected([id]);
    }
  };

  const handleSubmit = () => {
    if (selected.length > 0) {
      onSubmit(multi ? selected : selected[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className={cn("mt-4", className)}
    >
      <div className="flex flex-wrap gap-2 mb-4">
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <motion.button
              key={option.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleOption(option.id)}
              className={cn(
                "px-4 py-2 rounded-full text-[15px] font-medium",
                "border transition-all duration-200",
                isSelected
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--text-muted)]"
              )}
            >
              {multi && isSelected && <span className="mr-1.5">✓</span>}
              {option.label}
            </motion.button>
          );
        })}
      </div>
      
      <Button
        variant="brand"
        size="medium"
        onClick={handleSubmit}
        disabled={selected.length === 0}
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
