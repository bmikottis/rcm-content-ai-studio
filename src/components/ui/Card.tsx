"use client";

import { forwardRef, HTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface CardProps {
  children: ReactNode;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, hover = false, padding = "md", className }, ref) => {
    const baseClassName = cn(
      "bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)]",
      "shadow-[var(--shadow-sm)]",
      hover && "transition-all duration-[var(--duration-normal)] hover:shadow-[var(--shadow-md)]",
      paddingStyles[padding],
      className
    );

    if (hover) {
      return (
        <motion.div
          ref={ref}
          className={baseClassName}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={baseClassName}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function CardHeader({ title, description, action, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-4", className)} {...props}>
      <div>
        <h3 className="text-h3 text-[var(--text-primary)]">{title}</h3>
        {description && (
          <p className="text-body-sm text-[var(--text-muted)] mt-1">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardContent({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-4 pt-4 border-t border-[var(--border-subtle)]", className)} {...props}>
      {children}
    </div>
  );
}
