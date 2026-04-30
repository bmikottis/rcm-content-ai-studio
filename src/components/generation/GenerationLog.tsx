"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGenerationStore } from "@/stores/generation";
import { GenerationStep } from "@/types/generation";
import { cn } from "@/lib/cn";

interface GenerationLogProps {
  className?: string;
}

export function GenerationLog({ className }: GenerationLogProps) {
  const { steps, isGenerating, expandedSteps, toggleExpanded, startGeneration, completeStep } = useGenerationStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  // Auto-start generation simulation
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    
    const timer = setTimeout(() => {
      startGeneration();
      simulateGeneration();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const simulateGeneration = async () => {
    const delays = [2200, 1800, 2500, 3200, 1500, 2000, 1200, 800];
    const stepIds = ["understand", "brand", "assets", "channels", "personalization", "language", "compliance", "linking"];
    
    for (let i = 0; i < stepIds.length; i++) {
      await new Promise(resolve => setTimeout(resolve, delays[i]));
      completeStep(stepIds[i]);
    }
  };

  // Auto-scroll to active step
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector("[data-active='true']");
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [steps]);

  const completedCount = steps.filter(s => s.status === "completed").length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className={cn("flex flex-col h-full bg-[#0A0A0B]", className)}>
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {isGenerating ? (
              <motion.div
                className="relative w-5 h-5"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20">
                  <circle
                    cx="10" cy="10" r="8"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="10" cy="10" r="8"
                    fill="none"
                    stroke="url(#spinnerGradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="50"
                    strokeDashoffset="35"
                  />
                  <defs>
                    <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00A1E0" />
                      <stop offset="100%" stopColor="#6B5ACC" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>
            ) : completedCount === steps.length ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
              >
                <CheckIcon className="w-3 h-3 text-white" />
              </motion.div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-white/20" />
            )}
            <h2 className="text-[13px] font-bold text-white/90">
              {isGenerating ? "Generating content" : completedCount === steps.length ? "Generation complete" : "Ready to generate"}
            </h2>
          </div>
          {isGenerating && (
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-white/40 tabular-nums">
                {completedCount}/{steps.length}
              </span>
              <span className="text-[13px] text-white/25">steps</span>
            </div>
          )}
        </div>
        
        {/* Progress bar with glow effect */}
        <div className="relative">
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#00A1E0] to-[#6B5ACC] rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Shimmer on progress bar */}
              {isGenerating && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              )}
            </motion.div>
          </div>
          {/* Glow effect */}
          {progress > 0 && (
            <motion.div
              className="absolute top-0 h-1 rounded-full bg-[#00A1E0] blur-sm opacity-50"
              style={{ width: `${progress}%` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
            />
          )}
        </div>
        
        {/* Current action label */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center gap-1.5"
          >
            <span className="text-[13px] text-white/30">Currently:</span>
            <span className="text-[13px] text-[#00A1E0]">
              {steps.find(s => s.status === "in_progress")?.title || "Preparing..."}
            </span>
          </motion.div>
        )}
      </div>

      {/* Steps timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <AnimatePresence mode="popLayout">
          {steps.map((step, index) => (
            <GenerationStepRow
              key={step.id}
              step={step}
              index={index}
              isExpanded={expandedSteps.has(step.id)}
              onToggle={() => toggleExpanded(step.id)}
              isLast={index === steps.length - 1}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer with summary */}
      {completedCount === steps.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex-shrink-0 px-5 py-4 border-t border-white/[0.06] bg-emerald-500/[0.03]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-white/90">Content ready</p>
              <p className="text-[13px] text-white/40">3 channels · 3 languages · 82% brand score</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface GenerationStepRowProps {
  step: GenerationStep;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}

function GenerationStepRow({ step, index, isExpanded, onToggle, isLast }: GenerationStepRowProps) {
  const isActive = step.status === "in_progress";
  const isCompleted = step.status === "completed";
  const isPending = step.status === "pending";

  return (
    <motion.div
      data-active={isActive}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="relative"
    >
      {/* Connector line */}
      {!isLast && (
        <div className={cn(
          "absolute left-[19px] top-[40px] w-[2px] h-[calc(100%-24px)]",
          isCompleted ? "bg-gradient-to-b from-emerald-500/50 to-emerald-500/20" : "bg-white/[0.06]"
        )} />
      )}

      {/* Main row */}
      <button
        onClick={step.expandable ? onToggle : undefined}
        disabled={!step.expandable}
        className={cn(
          "w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-200 text-left",
          isActive && "bg-white/[0.03]",
          step.expandable && "hover:bg-white/[0.02] cursor-pointer",
          !step.expandable && "cursor-default"
        )}
      >
        {/* Status icon */}
        <div className="relative flex-shrink-0 mt-0.5">
          <StepIcon 
            icon={step.icon} 
            status={step.status}
            isActive={isActive}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "text-[13px] font-medium transition-colors",
              isCompleted ? "text-white/90" : isActive ? "text-white" : "text-white/40"
            )}>
              {step.title}
            </h3>
            {isCompleted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
              </motion.div>
            )}
            {step.expandable && !isPending && (
              <ChevronIcon className={cn(
                "w-3 h-3 text-white/30 transition-transform",
                isExpanded && "rotate-180"
              )} />
            )}
          </div>
          <p className={cn(
            "text-[13px] mt-0.5 transition-colors",
            isActive ? "text-white/50" : "text-white/30"
          )}>
            {step.description}
          </p>

          {/* Active shimmer progress */}
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3"
            >
              <ShimmerBar />
            </motion.div>
          )}

          {/* Expanded content */}
          <AnimatePresence>
            {isExpanded && !isPending && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-2">
                  {/* Thought block */}
                  {step.thought && (
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <div className="flex items-center gap-2 mb-1.5">
                        <BrainIcon className="w-3 h-3 text-[#6B5ACC]" />
                        <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Thinking</span>
                      </div>
                      <p className="text-[13px] text-white/60 leading-relaxed">{step.thought}</p>
                    </div>
                  )}

                  {/* Sub-steps */}
                  {step.subSteps && step.subSteps.length > 0 && (
                    <div className="space-y-1.5">
                      {step.subSteps.map((sub, i) => (
                        <SubStepRow key={sub.id} subStep={sub} index={i} parentActive={isActive} />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </button>
    </motion.div>
  );
}

interface SubStepRowProps {
  subStep: { id: string; label: string; status: string; detail?: string };
  index: number;
  parentActive: boolean;
}

function SubStepRow({ subStep, index, parentActive }: SubStepRowProps) {
  const isCompleted = subStep.status === "completed";
  const isActive = parentActive && subStep.status === "pending" && index === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg",
        isActive ? "bg-white/[0.02]" : "bg-transparent"
      )}
    >
      <div className={cn(
        "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
        isCompleted ? "bg-emerald-500/20" : "bg-white/[0.04]"
      )}>
        {isCompleted ? (
          <CheckIcon className="w-2.5 h-2.5 text-emerald-400" />
        ) : isActive ? (
          <div className="w-1.5 h-1.5 rounded-full bg-[#00A1E0] animate-pulse" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className={cn(
          "text-[13px]",
          isCompleted ? "text-white/70" : isActive ? "text-white/60" : "text-white/30"
        )}>
          {subStep.label}
        </span>
        {subStep.detail && (
          <span className="text-[13px] text-white/30 ml-2">{subStep.detail}</span>
        )}
      </div>
    </motion.div>
  );
}

function ShimmerBar() {
  return (
    <div className="space-y-2">
      {/* Multi-layer shimmer for richer effect */}
      <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div
          className="h-full w-1/4 bg-gradient-to-r from-transparent via-[#00A1E0]/50 to-transparent"
          animate={{ x: ["-100%", "500%"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
      </div>
      
      {/* Activity indicator text */}
      <div className="flex items-center gap-2">
        <motion.div
          className="flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 rounded-full bg-[#00A1E0]"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </motion.div>
        <motion.span
          className="text-[13px] text-white/30"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Processing...
        </motion.span>
      </div>
    </div>
  );
}

interface StepIconProps {
  icon: GenerationStep["icon"];
  status: GenerationStep["status"];
  isActive: boolean;
}

function StepIcon({ icon, status, isActive }: StepIconProps) {
  const isCompleted = status === "completed";
  const isPending = status === "pending";

  const iconMap: Record<string, React.ReactNode> = {
    brain: <BrainIcon className="w-4 h-4" />,
    palette: <PaletteIcon className="w-4 h-4" />,
    assets: <ImageIcon className="w-4 h-4" />,
    channels: <ChannelsIcon className="w-4 h-4" />,
    personalization: <UserIcon className="w-4 h-4" />,
    language: <GlobeIcon className="w-4 h-4" />,
    shield: <ShieldIcon className="w-4 h-4" />,
    link: <LinkIcon className="w-4 h-4" />,
    sparkles: <SparklesIcon className="w-4 h-4" />,
  };

  return (
    <div className="relative">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
        isCompleted && "bg-emerald-500/10 text-emerald-400",
        isActive && "bg-[#00A1E0]/10 text-[#00A1E0]",
        isPending && "bg-white/[0.03] text-white/25"
      )}>
        {iconMap[icon]}
      </div>
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl border border-[#00A1E0]/30"
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </div>
  );
}

// Icons
function BrainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54" />
    </svg>
  );
}

function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function ChannelsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 8h20" />
      <path d="M8 4v4" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M5 19l.5 1.5L7 21l-1.5.5L5 23l-.5-1.5L3 21l1.5-.5L5 19z" />
      <path d="M19 5l.5 1.5L21 7l-1.5.5L19 9l-.5-1.5L17 7l1.5-.5L19 5z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
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

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
