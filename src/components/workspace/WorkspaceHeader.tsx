"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth";
import { useContextStore } from "@/stores/context";
import { Logo } from "@/components/ui/Logo";
import { AccountDropdown } from "@/components/home/AccountDropdown";
import { cn } from "@/lib/cn";

interface WorkspaceHeaderProps {
  className?: string;
}

export function WorkspaceHeader({ className }: WorkspaceHeaderProps) {
  const { isAuthenticated, openLoginModal } = useAuthStore();
  const { context } = useContextStore();

  return (
    <header
      className={cn(
        "h-14 flex items-center justify-between px-4 border-b border-[#DDD]/80",
        "bg-white",
        className
      )}
    >
      {/* Left: Logo */}
      <Link href="/" className="flex items-center">
        <Logo variant="light" className="h-[18px]" />
      </Link>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {context && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-50 border border-[#DDD]"
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#00A1E0] to-[#0078A8] flex items-center justify-center">
              <span className="text-[8px] text-white font-semibold">
                {context.brand.name.charAt(0)}
              </span>
            </div>
            <span className="text-[13px] text-neutral-700 font-medium">
              {context.brand.name}
            </span>
          </motion.div>
        )}

        {isAuthenticated ? (
          <AccountDropdown variant="light" />
        ) : (
          <button
            onClick={() => openLoginModal()}
            className={cn(
              "px-4 py-1.5 rounded-lg text-[13px] font-medium",
              "bg-neutral-900 text-white hover:bg-neutral-800",
              "transition-colors"
            )}
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}
