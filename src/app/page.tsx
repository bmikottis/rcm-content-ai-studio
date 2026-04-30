"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { WorkspaceMain } from "@/components/workspace";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, pendingPrompt, clearPendingPrompt } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && pendingPrompt) {
      const prompt = pendingPrompt;
      clearPendingPrompt();
      router.push(`/projects/new?prompt=${encodeURIComponent(prompt)}`);
    }
  }, [isAuthenticated, pendingPrompt, clearPendingPrompt, router]);

  return (
    <div className="flex-1 flex flex-col">
      <WorkspaceMain />
    </div>
  );
}
