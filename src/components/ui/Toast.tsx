"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToastStore, type ToastVariant } from "@/stores/toast";
import { cn } from "@/lib/cn";

const variantIcons: Record<ToastVariant, React.FC<{ className?: string }>> = {
  default: InfoIcon,
  success: CheckIcon,
  error: XIcon,
  warning: AlertIcon,
};

const variantStyles: Record<ToastVariant, { wrapper: string; iconBg: string; iconText: string }> = {
  default: { wrapper: "bg-neutral-50 border-[#DDD] text-neutral-700",  iconBg: "bg-neutral-200/60", iconText: "text-neutral-600" },
  success: { wrapper: "bg-emerald-50 border-emerald-200 text-emerald-800", iconBg: "bg-emerald-100",    iconText: "text-emerald-600" },
  error:   { wrapper: "bg-red-50 border-red-200 text-red-800",             iconBg: "bg-red-100",        iconText: "text-red-600" },
  warning: { wrapper: "bg-amber-50 border-amber-200 text-amber-800",       iconBg: "bg-amber-100",      iconText: "text-amber-600" },
};

function ToastItem({ id, message, variant, duration }: { id: string; message: string; variant: ToastVariant; duration: number }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const style = variantStyles[variant];

  useEffect(() => {
    const timer = setTimeout(() => removeToast(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, removeToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-[12px] border shadow-[0_4px_12px_rgba(0,0,0,0.08)] min-w-[240px] max-w-[400px]",
          "text-[13px] font-medium",
          style.wrapper,
        )}
      >
        <div className={cn("w-5 h-5 rounded-[6px] flex items-center justify-center flex-shrink-0", style.iconBg, style.iconText)}>
          {(() => { const Icon = variantIcons[variant]; return <Icon className="w-3 h-3" />; })()}
        </div>
        <span className="flex-1">{message}</span>
        <button
          onClick={() => removeToast(id)}
          className="ml-1 text-[#7A7A7A] hover:text-neutral-600 transition-colors text-[13px] flex-shrink-0"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}

/* -- SVG Icons -- */

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 pointer-events-auto">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
