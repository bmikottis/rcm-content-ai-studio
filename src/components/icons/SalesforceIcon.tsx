"use client";

import { cn } from "@/lib/cn";

interface SalesforceIconProps {
  className?: string;
}

export function SalesforceIcon({ className }: SalesforceIconProps) {
  return (
    <svg
      className={cn("w-5 h-5", className)}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M10.006 5.415a4.195 4.195 0 0 1 3.045-1.306c1.56 0 2.954.9 3.69 2.205.63-.3 1.35-.45 2.1-.45 2.85 0 5.159 2.34 5.159 5.22s-2.31 5.22-5.16 5.22c-.45 0-.9-.06-1.32-.165a3.958 3.958 0 0 1-3.63 2.385 3.93 3.93 0 0 1-2.25-.705 4.782 4.782 0 0 1-4.29 2.67C4.5 20.49 2.1 18 2.1 14.97c0-1.47.6-2.805 1.56-3.78a4.47 4.47 0 0 1-.45-1.95c0-2.43 1.98-4.395 4.41-4.395 1.14 0 2.175.42 2.97 1.11l-.584.46z" />
    </svg>
  );
}
