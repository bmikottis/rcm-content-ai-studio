"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth";
import { useContextStore } from "@/stores/context";
import { Logo } from "@/components/ui/Logo";
import { AccountDropdown } from "@/components/home/AccountDropdown";
import { cn } from "@/lib/cn";

interface HomeHeaderProps {
  className?: string;
}

export function HomeHeader({ className }: HomeHeaderProps) {
  const { isAuthenticated, openLoginModal } = useAuthStore();
  const { context } = useContextStore();

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "h-[72px] flex items-center justify-between px-8",
        className
      )}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center group">
        <Logo variant="dark" className="h-6 opacity-85 group-hover:opacity-100 transition-opacity" />
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            {context && (
              <Link
                href="/projects"
                className={cn(
                  "px-4 py-2 rounded-xl text-[13px] font-medium",
                  "text-white/60 hover:text-white",
                  "hover:bg-white/[0.06] transition-all duration-200"
                )}
              >
                My Projects
              </Link>
            )}
            <AccountDropdown />
          </>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openLoginModal()}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[13px] font-medium",
              "bg-white/10 text-white border border-white/15",
              "hover:bg-white/15 hover:border-white/20",
              "backdrop-blur-sm transition-all duration-200"
            )}
          >
            Login
          </motion.button>
        )}
      </div>
    </motion.header>
  );
}
