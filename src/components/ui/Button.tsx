"use client";

import { forwardRef, ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "brand" | "neutral" | "outline" | "destructive" | "icon";
type ButtonSize = "small" | "medium" | "large";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  brand: cn(
    "bg-[#0F8EFF] text-white",
    "hover:bg-[#0D7DE6]",
    "active:bg-[#0B6CCE]",
    "border border-[#0F8EFF] hover:border-[#0D7DE6]"
  ),
  neutral: cn(
    "bg-[var(--surface)] text-[var(--text-primary)]",
    "hover:bg-[var(--surface-hover)]",
    "active:bg-neutral-100",
    "border border-[var(--border)]"
  ),
  outline: cn(
    "bg-transparent text-[var(--text-primary)]",
    "hover:bg-[var(--surface-hover)]",
    "border border-[var(--border)]"
  ),
  destructive: cn(
    "bg-[#C23934] text-white",
    "hover:bg-[#A61A14]",
    "border border-[#C23934]"
  ),
  icon: cn(
    "bg-transparent text-[var(--text-secondary)]",
    "hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]",
    "border-none"
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  small: "h-6 px-3 text-[13px] gap-1",
  medium: "h-8 px-4 text-[13px] gap-2",
  large: "h-10 px-6 text-[14px] gap-2",
};

const iconSizeStyles: Record<ButtonSize, string> = {
  small: "w-6 h-6 p-0",
  medium: "w-8 h-8 p-0",
  large: "w-10 h-10 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "brand",
      size = "medium",
      children,
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const isIcon = variant === "icon";
    
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-normal",
          "rounded-lg transition-all duration-100",
          "focus:outline-none focus:ring-2 focus:ring-neutral-300",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          isIcon ? iconSizeStyles[size] : sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Spinner className="w-4 h-4" />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
