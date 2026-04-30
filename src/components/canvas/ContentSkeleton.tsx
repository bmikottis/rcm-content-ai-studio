"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

export type SkeletonStage = 
  | "initializing"
  | "assets" 
  | "headlines" 
  | "body" 
  | "personalization"
  | "cta"
  | "complete";

interface ContentSkeletonProps {
  channel: "email" | "sms" | "whatsapp";
  stage?: SkeletonStage;
  delay?: number;
  onComplete?: () => void;
  className?: string;
}

const stageLabels: Record<SkeletonStage, string> = {
  initializing: "Preparing canvas",
  assets: "Loading assets",
  headlines: "Composing headline",
  body: "Writing content",
  personalization: "Adding personalization",
  cta: "Creating call-to-action",
  complete: "Ready",
};

const channelIcons: Record<string, React.ReactNode> = {
  email: <EmailIcon className="w-4 h-4" />,
  sms: <SMSIcon className="w-4 h-4" />,
  whatsapp: <WhatsAppIcon className="w-4 h-4" />,
};

export function ContentSkeleton({ 
  channel, 
  stage: externalStage,
  delay = 0,
  onComplete,
  className 
}: ContentSkeletonProps) {
  const [internalStage, setInternalStage] = useState<SkeletonStage>("initializing");
  const stage = externalStage ?? internalStage;

  useEffect(() => {
    if (externalStage) return;
    
    const stages: SkeletonStage[] = ["initializing", "assets", "headlines", "body", "personalization", "cta", "complete"];
    const durations = [400, 600, 500, 700, 400, 300];
    
    let timeoutId: NodeJS.Timeout;
    let currentIndex = 0;
    
    const advanceStage = () => {
      if (currentIndex < stages.length - 1) {
        currentIndex++;
        setInternalStage(stages[currentIndex]);
        if (currentIndex < stages.length - 1) {
          timeoutId = setTimeout(advanceStage, durations[currentIndex]);
        } else {
          onComplete?.();
        }
      }
    };
    
    timeoutId = setTimeout(() => {
      timeoutId = setTimeout(advanceStage, durations[0]);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [delay, externalStage, onComplete]);

  const isComplete = stage === "complete";
  const stageIndex = ["initializing", "assets", "headlines", "body", "personalization", "cta", "complete"].indexOf(stage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "bg-white rounded-xl border border-[#DDD]/80 shadow-sm overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#DDD] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-300",
            channel === "email" && "bg-blue-50 text-blue-500",
            channel === "sms" && "bg-emerald-50 text-emerald-500",
            channel === "whatsapp" && "bg-green-50 text-green-500"
          )}>
            {channelIcons[channel]}
          </div>
          <span className="text-[13px] font-medium text-[var(--text-primary)] capitalize">{channel}</span>
        </div>
        
        {/* Stage indicator */}
        <div className="flex items-center gap-2">
          {!isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5"
            >
              <LoadingDots />
              <span className="text-[13px] text-[#7A7A7A]">{stageLabels[stage]}</span>
            </motion.div>
          )}
          {isComplete && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="flex items-center gap-1 text-emerald-500"
            >
              <CheckIcon className="w-3.5 h-3.5" />
              <span className="text-[13px] font-medium">Ready</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="p-5 space-y-4">
        {/* Asset/Image area */}
        <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-neutral-50">
          <AnimatePresence mode="wait">
            {stageIndex < 2 ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-neutral-300" />
                  <span className="text-[13px] text-[#7A7A7A]">Loading asset</span>
                </div>
                <ShimmerOverlay />
              </motion.div>
            ) : (
              <motion.div
                key="loaded"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0"
              >
                <div className={cn(
                  "w-full h-full bg-gradient-to-br",
                  channel === "email" && "from-blue-100 to-indigo-100",
                  channel === "sms" && "from-emerald-100 to-teal-100",
                  channel === "whatsapp" && "from-green-100 to-emerald-100"
                )} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-[#7A7A7A]" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Headline */}
        <div className="space-y-1">
          <AnimatePresence mode="wait">
            {stageIndex < 3 ? (
              <motion.div
                key="headline-skeleton"
                exit={{ opacity: 0, y: -4 }}
                className="space-y-1"
              >
                <SkeletonLine width="70%" height={20} shimmer={stageIndex === 2} />
              </motion.div>
            ) : (
              <motion.div
                key="headline-content"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="h-5 w-3/4 bg-neutral-200 rounded" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Body text */}
        <div className="space-y-2">
          <AnimatePresence mode="wait">
            {stageIndex < 4 ? (
              <motion.div
                key="body-skeleton"
                exit={{ opacity: 0, y: -4 }}
                className="space-y-2"
              >
                <SkeletonLine width="100%" shimmer={stageIndex === 3} />
                <SkeletonLine width="100%" shimmer={stageIndex === 3} delay={0.05} />
                <SkeletonLine width="60%" shimmer={stageIndex === 3} delay={0.1} />
              </motion.div>
            ) : (
              <motion.div
                key="body-content"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, staggerChildren: 0.05 }}
                className="space-y-2"
              >
                {/* Simulated text with personalization token */}
                <div className="flex items-center gap-1 flex-wrap">
                  <div className="h-4 w-16 bg-neutral-200 rounded" />
                  {stageIndex >= 5 && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[13px] font-mono rounded"
                    >
                      {"{{first_name}}"}
                    </motion.span>
                  )}
                  <div className="h-4 w-24 bg-neutral-200 rounded" />
                </div>
                <div className="h-4 w-full bg-neutral-100 rounded" />
                <div className="h-4 w-2/3 bg-neutral-100 rounded" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA Button */}
        <AnimatePresence mode="wait">
          {stageIndex < 6 ? (
            <motion.div
              key="cta-skeleton"
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <SkeletonLine width="120px" height={36} shimmer={stageIndex === 5} />
            </motion.div>
          ) : (
            <motion.div
              key="cta-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className={cn(
                "w-[120px] h-9 rounded-lg",
                channel === "email" && "bg-blue-500",
                channel === "sms" && "bg-emerald-500",
                channel === "whatsapp" && "bg-green-500"
              )} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress bar at bottom */}
      {!isComplete && (
        <div className="h-0.5 bg-neutral-100">
          <motion.div
            className={cn(
              "h-full",
              channel === "email" && "bg-blue-400",
              channel === "sms" && "bg-emerald-400",
              channel === "whatsapp" && "bg-green-400"
            )}
            initial={{ width: "0%" }}
            animate={{ width: `${(stageIndex / 6) * 100}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      )}
    </motion.div>
  );
}

interface SkeletonLineProps {
  width?: string | number;
  height?: number;
  shimmer?: boolean;
  delay?: number;
}

function SkeletonLine({ width = "100%", height = 16, shimmer = false, delay = 0 }: SkeletonLineProps) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="relative overflow-hidden rounded bg-neutral-100"
      style={{ width, height }}
    >
      {shimmer && <ShimmerOverlay />}
    </motion.div>
  );
}

function ShimmerOverlay() {
  return (
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
      animate={{ x: ["-100%", "200%"] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
    />
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1 h-1 rounded-full bg-neutral-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
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

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function SMSIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
