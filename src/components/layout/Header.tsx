"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/auth";
import { useContextStore } from "@/stores/context";
import { cn } from "@/lib/cn";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { isAuthenticated, openLoginModal } = useAuthStore();
  const { context } = useContextStore();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-16 flex items-center justify-between px-6",
        "bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]",
        className
      )}
    >
      <Link href="/" className="flex items-center">
        <Logo variant="light" className="h-5" />
      </Link>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            {context && (
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] hover:bg-[var(--background)] transition-colors">
                <span className="text-body-sm text-[var(--text-secondary)]">
                  {context.brand.name}
                </span>
                <ChevronDownIcon className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            )}
            <Avatar name="John Doe" size="md" />
          </>
        ) : (
          <Button
            variant="neutral"
            size="small"
            onClick={() => openLoginModal()}
          >
            Login
          </Button>
        )}
      </div>
    </header>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
