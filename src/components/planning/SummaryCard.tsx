"use client";

import { motion } from "framer-motion";
import { CampaignSummary } from "@/types/planning";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface SummaryCardProps {
  summary: CampaignSummary;
  onEdit: () => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  className?: string;
}

const channelLabels: Record<string, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
  social: "Social",
  print: "Print",
};

const goalLabels: Record<string, string> = {
  awareness: "Awareness",
  engagement: "Engagement",
  conversion: "Conversion",
  retention: "Retention",
};

export function SummaryCard({
  summary,
  onEdit,
  onGenerate,
  isGenerating = false,
  className,
}: SummaryCardProps) {
  const rows = [
    { label: "Campaign", value: summary.title },
    { label: "Audience", value: summary.audience },
    { label: "Channels", value: summary.channels.map((c) => channelLabels[c]).join(", ") },
    { label: "Key Message", value: `"${summary.keyMessage}"` },
    { label: "Tone", value: summary.tone },
    { label: "Goal", value: goalLabels[summary.goal] },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("space-y-6", className)}
    >
      <p className="text-heading-small text-[var(--text-primary)]">
        Here's what we're creating:
      </p>

      <div className="bg-[var(--background)] rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={cn(
              "flex items-start py-4 px-5",
              index !== rows.length - 1 && "border-b border-[var(--border-subtle)]"
            )}
          >
            <span className="w-28 flex-shrink-0 text-body-sm text-[var(--text-muted)]">
              {row.label}
            </span>
            <span className="text-body text-[var(--text-primary)]">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="neutral" size="medium" onClick={onEdit}>
          Edit
        </Button>
        <Button
          variant="brand"
          size="large"
          onClick={onGenerate}
          isLoading={isGenerating}
          rightIcon={!isGenerating && <ArrowIcon className="w-4 h-4" />}
        >
          {isGenerating ? "Generating..." : "Generate Campaign"}
        </Button>
      </div>
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
