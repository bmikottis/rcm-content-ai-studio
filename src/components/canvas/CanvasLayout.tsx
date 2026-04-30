"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCanvasStore } from "@/stores/canvas";
import { AgentPanel } from "@/components/panels/AgentPanel";
import { cn } from "@/lib/cn";

interface CanvasLayoutProps {
  children: ReactNode;
  className?: string;
}

export function CanvasLayout({ children, className }: CanvasLayoutProps) {
  const { rightPanelOpen, toggleRightPanel } = useCanvasStore();

  return (
    <div className={cn("flex flex-1 overflow-hidden", className)}>
      {/* Main Canvas Area */}
      <div className="flex-1 overflow-auto dotted-grid">
        {children}
      </div>

      {/* Right Panel - Agent Chat */}
      <AnimatePresence>
        {rightPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="border-l border-white/[0.06] overflow-hidden flex-shrink-0 bg-[#0A0A0B]"
          >
            <AgentPanel className="w-[360px] h-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse button */}
      <button
        onClick={toggleRightPanel}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 z-10",
          "w-6 h-12 bg-[#0A0A0B] border border-white/[0.08]",
          "rounded-l-lg shadow-lg shadow-black/20",
          "flex items-center justify-center",
          "hover:bg-[#151517] transition-colors"
        )}
        style={{
          right: rightPanelOpen ? 360 : 0,
        }}
      >
        <ChevronIcon
          className={cn(
            "w-4 h-4 text-white/40 transition-transform",
            rightPanelOpen ? "rotate-0" : "rotate-180"
          )}
        />
      </button>
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
