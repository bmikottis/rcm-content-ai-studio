"use client";

import { usePathname } from "next/navigation";
import { GlobalHeader, GLOBAL_HEADER_HEIGHT } from "@/components/layout/GlobalHeader";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Canvas pages: /projects/[id] (but not /projects, /projects/new)
  const isCanvasPage = /^\/projects\/(?!new$)[^/]+$/.test(pathname);

  if (isCanvasPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex-1 flex flex-col force-light bg-[var(--color-background)]">
      <GlobalHeader />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
