"use client";

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-body-sm text-[var(--text-secondary)] mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full h-12 px-4 bg-[var(--surface)] rounded-[var(--radius-md)]",
              "border border-[var(--border)] text-[var(--text-primary)]",
              "placeholder:text-[var(--text-muted)]",
              "transition-all duration-[var(--duration-fast)]",
              "focus:outline-none focus:border-[var(--text-secondary)] focus:shadow-[var(--shadow-sm)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-[var(--error)] focus:border-[var(--error)]",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-[13px] text-[var(--error)]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-body-sm text-[var(--text-secondary)] mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full min-h-[120px] px-4 py-3 bg-[var(--surface)] rounded-[var(--radius-lg)]",
            "border border-[var(--border)] text-[var(--text-primary)]",
            "placeholder:text-[var(--text-muted)]",
            "transition-all duration-[var(--duration-fast)]",
            "focus:outline-none focus:border-[var(--text-secondary)] focus:shadow-[var(--shadow-sm)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "resize-none",
            error && "border-[var(--error)] focus:border-[var(--error)]",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-[13px] text-[var(--error)]">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
