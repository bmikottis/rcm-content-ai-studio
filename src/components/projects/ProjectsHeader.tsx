"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth";
import { useContextStore } from "@/stores/context";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

interface ProjectsHeaderProps {
  className?: string;
}

export function ProjectsHeader({ className }: ProjectsHeaderProps) {
  const { logout } = useAuthStore();
  const { context, clearContext } = useContextStore();

  const handleSignOut = () => {
    clearContext();
    logout();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-16 flex items-center justify-between px-6",
        "bg-white/80 backdrop-blur-xl border-b border-[#DDD]/60",
        className
      )}
    >
      <Link href="/" className="flex items-center">
        <Logo variant="light" className="h-[18px]" />
      </Link>

      <div className="flex items-center gap-2">
        {context && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-neutral-50 border border-[#DDD]"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#00A1E0] to-[#0078A8] flex items-center justify-center shadow-sm">
              <span className="text-[13px] text-white font-semibold">
                {context.brand.name.charAt(0)}
              </span>
            </div>
            <span className="text-[13px] text-neutral-700 font-medium">
              {context.brand.name}
            </span>
            <ChevronIcon className="w-3.5 h-3.5 text-[#7A7A7A]" />
          </motion.div>
        )}
        
        <button
          onClick={handleSignOut}
          className="group relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#00A1E0] to-[#0078A8] flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
        >
          <span className="text-[11px] text-white font-semibold">JD</span>
          <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/5 transition-colors" />
        </button>
      </div>
    </header>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
