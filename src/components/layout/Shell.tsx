"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ShellProps {
  children: ReactNode;
  header?: ReactNode;
  className?: string;
}

export function Shell({ children, header, className }: ShellProps) {
  return (
    <div className={cn("flex flex-col min-h-screen bg-[var(--background)]", className)}>
      {header && (
        <header className="sticky top-0 z-50 h-16 flex items-center px-6 bg-[var(--surface)] border-b border-[var(--border-subtle)] glass">
          {header}
        </header>
      )}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}

interface ShellHeaderProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}

export function ShellHeader({ left, center, right }: ShellHeaderProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        {left}
      </div>
      {center && (
        <div className="flex-1 flex justify-center">
          {center}
        </div>
      )}
      <div className="flex items-center gap-3">
        {right}
      </div>
    </div>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-h3 font-medium text-[var(--text-primary)]">
        Studio
      </span>
    </div>
  );
}
