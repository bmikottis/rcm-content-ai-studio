"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ChannelType } from "@/types/canvas";
import { useCanvasStore } from "@/stores/canvas";
import { cn } from "@/lib/cn";

interface ContentBlockProps {
  id: string;
  channel: ChannelType;
  variant?: number;
  brandCompliance: number;
  children: ReactNode;
  className?: string;
}

const channelConfig: Record<ChannelType, { icon: string; label: string; color: string }> = {
  email: { icon: "📧", label: "EMAIL", color: "var(--text-secondary)" },
  sms: { icon: "💬", label: "SMS", color: "var(--text-secondary)" },
  whatsapp: { icon: "💚", label: "WHATSAPP", color: "#25D366" },
};

export function ContentBlock({
  id,
  channel,
  variant,
  brandCompliance,
  children,
  className,
}: ContentBlockProps) {
  const { selectedBlockId, setSelectedBlock } = useCanvasStore();
  const isSelected = selectedBlockId === id;
  const config = channelConfig[channel];

  const getComplianceColor = (score: number) => {
    if (score >= 80) return "var(--success)";
    if (score >= 60) return "var(--warning)";
    return "var(--error)";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={() => setSelectedBlock(isSelected ? null : id)}
      className={cn(
        "bg-[var(--surface)] rounded-[var(--radius-lg)] border overflow-hidden",
        "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
        "transition-all duration-200 cursor-pointer",
        isSelected ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/10" : "border-[var(--border-subtle)]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <span>{config.icon}</span>
          <span className="text-caption text-[var(--text-muted)]">
            {config.label}
            {variant && ` VARIANT ${variant}`}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] text-[var(--text-muted)]">Brand:</span>
            <span
              className="text-[13px] font-medium"
              style={{ color: getComplianceColor(brandCompliance) }}
            >
              {brandCompliance}%
            </span>
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getComplianceColor(brandCompliance) }}
            />
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Open menu
            }}
            className="p-1 rounded hover:bg-[var(--background)] transition-colors"
          >
            <MoreIcon className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}
