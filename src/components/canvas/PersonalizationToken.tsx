"use client";

import { cn } from "@/lib/cn";

interface PersonalizationTokenProps {
  token: string;
  className?: string;
}

export function PersonalizationToken({ token, className }: PersonalizationTokenProps) {
  const cleanToken = token.replace(/\{\{|\}\}/g, "");
  
  return (
    <span
      className={cn(
        "inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-700",
        "text-[inherit] font-medium",
        className
      )}
      title={`Will be replaced with contact's ${cleanToken.replace("_", " ")}`}
    >
      {token}
    </span>
  );
}
