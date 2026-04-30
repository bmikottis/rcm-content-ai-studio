"use client";

import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

interface FloatingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  position?: "center" | "right";
  showOverlay?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[90vw] max-h-[90vh]",
};

export function FloatingPanel({
  isOpen,
  onClose,
  children,
  title,
  size = "md",
  position = "center",
  showOverlay = true,
  className,
}: FloatingPanelProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {showOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40"
              onClick={onClose}
            />
          )}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className={cn(
              "fixed z-50",
              position === "center" && "inset-0 flex items-center justify-center p-4",
              position === "right" && "right-0 top-0 h-full"
            )}
          >
            <div
              className={cn(
                "bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-panel)]",
                "w-full overflow-hidden",
                sizeStyles[size],
                position === "right" && "h-full rounded-none rounded-l-[var(--radius-xl)]",
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
                  <h2 className="text-h3 text-[var(--text-primary)]">{title}</h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--background)] transition-colors"
                  >
                    <CloseIcon className="w-5 h-5 text-[var(--text-muted)]" />
                  </button>
                </div>
              )}
              <div className={cn(!title && "pt-6", "px-6 pb-6 overflow-y-auto max-h-[calc(85vh-80px)]")}>
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
