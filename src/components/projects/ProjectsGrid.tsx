"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ProjectsGridProps {
  children: ReactNode;
  className?: string;
}

export function ProjectsGrid({ children, className }: ProjectsGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
        className
      )}
    >
      {children}
    </div>
  );
}
