"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useContextStore } from "@/stores/context";
import { useAuthStore } from "@/stores/auth";
import { PlanningFlow } from "@/components/planning/PlanningFlow";
import { Button } from "@/components/ui/Button";
import { AccountDropdown } from "@/components/home/AccountDropdown";
import { Suspense } from "react";

function PlanningPageContent() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt") || "";
  const { context } = useContextStore();
  const { isAuthenticated } = useAuthStore();

  if (!prompt) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <p className="text-body text-[var(--text-muted)] mb-4">
            No prompt provided
          </p>
          <Link href="/projects">
            <Button variant="brand">Go back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--background)]">
      {/* Sub-header with back navigation and brand context */}
      <header className="h-12 flex items-center justify-between px-5 bg-white border-b border-[#DDD]/60">
        <Link
          href="/projects"
          className="flex items-center gap-2 text-[#7A7A7A] hover:text-neutral-900 transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          <span className="text-[13px] font-medium">Back to Projects</span>
        </Link>

        <div className="flex items-center gap-3">
          {context && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-50 border border-[#DDD]">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#00A1E0] to-[#0078A8] flex items-center justify-center">
                <span className="text-[8px] text-white font-semibold">
                  {context.brand.name.charAt(0)}
                </span>
              </div>
              <span className="text-[13px] text-neutral-700 font-medium">
                {context.brand.name}
              </span>
            </div>
          )}

          {isAuthenticated && <AccountDropdown variant="light" />}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PlanningFlow initialPrompt={prompt} />
        </motion.div>
      </main>
    </div>
  );
}

export default function PlanningPage() {
  return (
    <Suspense fallback={<PlanningPageLoading />}>
      <PlanningPageContent />
    </Suspense>
  );
}

function PlanningPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="flex items-center gap-2 text-[var(--text-muted)]">
        <span className="animate-spin">◯</span>
        <span>Loading...</span>
      </div>
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
