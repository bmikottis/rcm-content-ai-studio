"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface BrandWarningProps {
  complianceScore: number;
  onApply: () => void;
  onAdjust: () => void;
  className?: string;
}

export function BrandWarning({
  complianceScore,
  onApply,
  onAdjust,
  className,
}: BrandWarningProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "bg-amber-50 border border-amber-200 rounded-[var(--radius-lg)] p-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-[var(--warning)] text-xl">⚠️</span>
        <div className="flex-1">
          <h4 className="text-h3 text-[var(--warning)] mb-1">
            Brand compliance dropped to {complianceScore}%
          </h4>
          <p className="text-body-sm text-amber-700 mb-4">
            This change significantly alters your brand voice. Consider:
          </p>
          <ul className="text-body-sm text-amber-700 mb-4 space-y-1">
            <li>• Keeping "refined" language</li>
            <li>• Maintaining premium positioning</li>
          </ul>
          <div className="flex gap-2">
            <Button variant="neutral" size="small" onClick={onApply}>
              Apply Anyway
            </Button>
            <Button variant="brand" size="small" onClick={onAdjust}>
              Adjust
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
