"use client";

import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth";
import { useContextStore } from "@/stores/context";
import { cn } from "@/lib/cn";

interface ContextIndicatorsProps {
  className?: string;
}

export function ContextIndicators({ className }: ContextIndicatorsProps) {
  const { isAuthenticated } = useAuthStore();
  const { context, isLoaded } = useContextStore();

  const indicators = [
    { 
      label: "Brand", 
      loaded: isAuthenticated && isLoaded && !!context?.brand,
      detail: context?.brand?.name 
    },
    { 
      label: "Assets", 
      loaded: isAuthenticated && isLoaded && !!context?.assets,
      detail: `${context?.assets?.products?.length || 0} products` 
    },
    { 
      label: "Audience", 
      loaded: isAuthenticated && isLoaded && (context?.audiences?.length ?? 0) > 0,
      detail: context?.audiences?.[0]?.name 
    },
  ];

  return (
    <div className={cn("flex items-center justify-center gap-8", className)}>
      {indicators.map((indicator, index) => (
        <motion.div
          key={indicator.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
          className="group relative"
        >
          <div
            className={cn(
              "flex items-center gap-2 text-[13px] font-light transition-colors duration-200",
              indicator.loaded
                ? "text-white/70"
                : "text-white/25"
            )}
          >
            {indicator.loaded ? (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center"
              >
                <CheckIcon className="w-2.5 h-2.5 text-emerald-400" />
              </motion.span>
            ) : (
              <span className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              </span>
            )}
            <span>{indicator.label}</span>
          </div>
          
          {/* Tooltip for loaded state */}
          {indicator.loaded && indicator.detail && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-white/10 backdrop-blur-xl text-white/90 text-[13px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 border border-white/10">
              {indicator.detail}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white/10" />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
