"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

interface GeneratingStateProps {
  className?: string;
}

type GenerationPhase = {
  id: string;
  label: string;
  icon: React.ReactNode;
  detail: string;
};

const phases: GenerationPhase[] = [
  { 
    id: "analyze", 
    label: "Analyzing brief", 
    icon: <BrainIcon className="w-5 h-5" />,
    detail: "Understanding campaign objectives"
  },
  { 
    id: "brand", 
    label: "Applying brand", 
    icon: <PaletteIcon className="w-5 h-5" />,
    detail: "Matching tone and visual identity"
  },
  { 
    id: "content", 
    label: "Composing content", 
    icon: <PenIcon className="w-5 h-5" />,
    detail: "Creating channel variants"
  },
  { 
    id: "personalize", 
    label: "Personalizing", 
    icon: <UserIcon className="w-5 h-5" />,
    detail: "Adding dynamic content"
  },
];

export function GeneratingState({ className }: GeneratingStateProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [completedPhases, setCompletedPhases] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhase((prev) => {
        const next = (prev + 1) % phases.length;
        if (prev < phases.length) {
          setCompletedPhases((p) => [...p, phases[prev].id]);
        }
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "flex flex-col items-center justify-center py-16",
        className
      )}
    >
      {/* Main generating indicator */}
      <div className="relative mb-8">
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{ filter: "blur(20px)" }}
        />
        
        {/* Icon container */}
        <div className="relative w-20 h-20 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-lg flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={phases[currentPhase].id}
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
              transition={{ duration: 0.3 }}
              className="text-[var(--text-secondary)]"
            >
              {phases[currentPhase].icon}
            </motion.div>
          </AnimatePresence>
          
          {/* Spinning border */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 80">
            <motion.circle
              cx="40"
              cy="40"
              r="38"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="200"
              strokeDashoffset="150"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "center" }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00A1E0" />
                <stop offset="50%" stopColor="#6B5ACC" />
                <stop offset="100%" stopColor="#00A1E0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Phase label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phases[currentPhase].id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="text-center mb-6"
        >
          <h3 className="text-[16px] font-medium text-[var(--text-primary)] mb-1">
            {phases[currentPhase].label}
          </h3>
          <p className="text-[13px] text-[var(--text-secondary)]">
            {phases[currentPhase].detail}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Phase indicators */}
      <div className="flex items-center gap-3">
        {phases.map((phase, i) => {
          const isCompleted = completedPhases.includes(phase.id);
          const isCurrent = i === currentPhase;
          
          return (
            <motion.div
              key={phase.id}
              className={cn(
                "w-2 h-2 rounded-full transition-colors duration-300",
                isCompleted && "bg-emerald-400",
                isCurrent && !isCompleted && "bg-blue-500",
                !isCompleted && !isCurrent && "bg-neutral-200"
              )}
              animate={isCurrent ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 1, repeat: isCurrent ? Infinity : 0 }}
            />
          );
        })}
      </div>

      {/* Building indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface-subtle)] border border-[var(--border)]"
      >
        <div className="flex -space-x-1">
          {["email", "sms", "whatsapp"].map((channel, i) => (
            <motion.div
              key={channel}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1 + i * 0.2 }}
              className={cn(
                "w-6 h-6 rounded-full border-2 border-white flex items-center justify-center",
                channel === "email" && "bg-blue-500",
                channel === "sms" && "bg-emerald-500",
                channel === "whatsapp" && "bg-green-500"
              )}
            >
              {channel === "email" && <EmailIcon className="w-3 h-3 text-white" />}
              {channel === "sms" && <SMSIcon className="w-3 h-3 text-white" />}
              {channel === "whatsapp" && <WhatsAppIcon className="w-3 h-3 text-white" />}
            </motion.div>
          ))}
        </div>
        <span className="text-[13px] text-[var(--text-secondary)]">Building 3 channel variants</span>
      </motion.div>
    </motion.div>
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

function PenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
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

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function SMSIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
