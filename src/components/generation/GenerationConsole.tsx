"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

export interface GenerationStep {
  id: string;
  label: string;
  status: "pending" | "active" | "completed";
  detail?: string;
}

interface GenerationConsoleProps {
  steps: GenerationStep[];
  isVisible: boolean;
  onMinimize?: () => void;
  className?: string;
}

export function GenerationConsole({ 
  steps, 
  isVisible,
  onMinimize,
  className 
}: GenerationConsoleProps) {
  const completedCount = steps.filter(s => s.status === "completed").length;
  const activeStep = steps.find(s => s.status === "active");
  const progress = (completedCount / steps.length) * 100;

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "w-[400px] bg-[var(--surface)] rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-[var(--border)]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6"
            >
              <SparkleIcon className="w-6 h-6 text-[#0F8EFF]" />
            </motion.div>
          </div>
          <div>
            <p className="text-[13px] font-bold text-[var(--text-primary)]">
              Generating Campaign
            </p>
            <p className="text-[13px] text-[var(--text-muted)]">
              {activeStep?.label || "Processing..."}
            </p>
          </div>
        </div>
        {onMinimize && (
          <button
            onClick={onMinimize}
            className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--background)] transition-colors"
          >
            <MinimizeIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2 border-b border-[#E5E5E5]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[13px] text-[var(--text-muted)]">
            {completedCount} of {steps.length} steps
          </span>
          <span className="text-[13px] font-bold text-[#0F8EFF]">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1 bg-[#E5E5E5] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#0F8EFF] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Steps list */}
      <div className="max-h-[240px] overflow-y-auto">
        <div className="p-2">
          {steps.map((step, index) => (
            <GenerationStepItem 
              key={step.id} 
              step={step} 
              index={index} 
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

interface GenerationStepItemProps {
  step: GenerationStep;
  index: number;
}

function GenerationStepItem({ step, index }: GenerationStepItemProps) {
  const isActive = step.status === "active";
  const isCompleted = step.status === "completed";
  const isPending = step.status === "pending";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded transition-colors",
        isActive && "bg-[#EBF5FE]",
        isCompleted && "bg-transparent",
        isPending && "opacity-50"
      )}
    >
      {/* Status indicator */}
      <div className="flex-shrink-0">
        {isCompleted ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-5 h-5 rounded-full bg-[#2E844A] flex items-center justify-center"
          >
            <CheckIcon className="w-3 h-3 text-white" />
          </motion.div>
        ) : isActive ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 rounded-full border-2 border-[#0F8EFF] border-t-transparent"
          />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-[var(--border)]" />
        )}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-[13px] truncate",
          isActive && "font-bold text-[#0F8EFF]",
          isCompleted && "text-[var(--text-primary)]",
          isPending && "text-[var(--text-muted)]"
        )}>
          {step.label}
        </p>
        {step.detail && (isActive || isCompleted) && (
          <p className="text-[13px] text-[var(--text-muted)] truncate">
            {step.detail}
          </p>
        )}
      </div>

      {/* Timing indicator for completed steps */}
      {isCompleted && (
        <span className="text-[13px] text-[var(--text-muted)]">✓</span>
      )}
    </motion.div>
  );
}

// Icons
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M5 19l.5 1.5L7 21l-1.5.5L5 23l-.5-1.5L3 21l1.5-.5L5 19z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function MinimizeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}
