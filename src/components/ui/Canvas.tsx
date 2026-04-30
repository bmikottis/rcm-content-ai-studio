"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CanvasProps {
  children: ReactNode;
  className?: string;
  showGrid?: boolean;
}

export function Canvas({ children, className, showGrid = true }: CanvasProps) {
  return (
    <div
      className={cn(
        "flex-1 overflow-auto bg-[var(--background)]",
        showGrid && "dotted-grid",
        className
      )}
    >
      {children}
    </div>
  );
}

interface CanvasContentProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

const maxWidthStyles = {
  sm: "max-w-xl",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  full: "max-w-full",
};

export function CanvasContent({ children, className, maxWidth = "lg" }: CanvasContentProps) {
  return (
    <div className={cn("mx-auto px-6 py-12", maxWidthStyles[maxWidth], className)}>
      {children}
    </div>
  );
}
