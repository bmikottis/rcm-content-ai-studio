"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface ChipProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
  selected?: boolean;
  onClick?: () => void;
  leftIcon?: ReactNode;
  className?: string;
}

const variantStyles = {
  default: "bg-[var(--background)] text-[var(--text-secondary)] border-[var(--border)]",
  success: "bg-green-50 text-[var(--success)] border-green-200",
  warning: "bg-amber-50 text-[var(--warning)] border-amber-200",
  error: "bg-red-50 text-[var(--error)] border-red-200",
  info: "bg-blue-50 text-[var(--info)] border-blue-200",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-[11px] gap-1",
  md: "px-3 py-1 text-[13px] gap-1.5",
};

export function Chip({
  children,
  variant = "default",
  size = "md",
  selected = false,
  onClick,
  leftIcon,
  className,
}: ChipProps) {
  const isClickable = !!onClick;
  
  return (
    <motion.span
      whileTap={isClickable ? { scale: 0.95 } : undefined}
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        "transition-all duration-[var(--duration-fast)]",
        variantStyles[variant],
        sizeStyles[size],
        selected && "bg-[var(--accent)] text-white border-[var(--accent)]",
        isClickable && "cursor-pointer hover:border-[var(--text-muted)]",
        className
      )}
      onClick={onClick}
    >
      {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      {children}
    </motion.span>
  );
}

interface ChipGroupProps {
  children: ReactNode;
  className?: string;
}

export function ChipGroup({ children, className }: ChipGroupProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {children}
    </div>
  );
}
