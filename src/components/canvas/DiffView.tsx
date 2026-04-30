"use client";

import { motion } from "framer-motion";
import { ContentBlock } from "@/types/canvas";
import { InlineDiff } from "./InlineDiff";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface DiffViewProps {
  original: ContentBlock;
  updated: ContentBlock;
  onAccept: () => void;
  onRevert: () => void;
  className?: string;
}

export function DiffView({
  original,
  updated,
  onAccept,
  onRevert,
  className,
}: DiffViewProps) {
  const complianceDiff = updated.brandCompliance - original.brandCompliance;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("space-y-4", className)}
    >
      {/* Headline diff */}
      {original.headline !== updated.headline && (
        <div>
          <span className="text-caption text-[var(--text-muted)] block mb-1">
            Subject:
          </span>
          <InlineDiff original={original.headline} updated={updated.headline} />
        </div>
      )}

      {/* Body diff */}
      <div>
        <InlineDiff original={original.body} updated={updated.body} />
      </div>

      {/* Change summary */}
      <div className="flex items-center gap-4 text-[13px] text-[var(--text-muted)] pt-4 border-t border-[var(--border-subtle)]">
        <span>Changes applied</span>
        <span>•</span>
        <span>
          Brand compliance:{" "}
          <span
            className={cn(
              complianceDiff > 0 && "text-[var(--success)]",
              complianceDiff < 0 && "text-[var(--error)]"
            )}
          >
            {original.brandCompliance}% → {updated.brandCompliance}%
            {complianceDiff > 0 && ` (+${complianceDiff}%)`}
            {complianceDiff < 0 && ` (${complianceDiff}%)`}
          </span>
        </span>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="neutral" size="medium" onClick={onRevert}>
          Revert
        </Button>
        <Button variant="brand" size="medium" onClick={onAccept}>
          Accept Changes
        </Button>
      </div>
    </motion.div>
  );
}
