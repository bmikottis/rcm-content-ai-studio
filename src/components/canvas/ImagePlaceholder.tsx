"use client";

import { cn } from "@/lib/cn";

interface ImagePlaceholderProps {
  placeholder: string;
  aspectRatio: "16:9" | "1:1" | "4:5";
  className?: string;
}

const aspectRatioStyles = {
  "16:9": "aspect-video",
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
};

export function ImagePlaceholder({
  placeholder,
  aspectRatio,
  className,
}: ImagePlaceholderProps) {
  return (
    <div
      className={cn(
        "w-full rounded-[var(--radius-md)] overflow-hidden",
        "bg-gradient-to-br from-[#f5f7fa] to-[#c3cfe2]",
        "flex flex-col items-center justify-center gap-3",
        aspectRatioStyles[aspectRatio],
        className
      )}
    >
      <ImageIcon className="w-8 h-8 text-[var(--text-muted)]" />
      <p className="text-body-sm text-[var(--text-muted)] text-center px-4 max-w-[200px]">
        {placeholder}
      </p>
    </div>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}
