"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface DeviceFrameProps {
  device: "desktop" | "mobile";
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

export function DeviceFrame({ device, children, className, compact = false }: DeviceFrameProps) {
  if (device === "desktop") {
    return <DesktopFrame className={className} compact={compact}>{children}</DesktopFrame>;
  }
  return <MobileFrame className={className} compact={compact}>{children}</MobileFrame>;
}

function DesktopFrame({
  children,
  className,
  compact = false,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-[#F5F5F5] rounded-xl overflow-hidden content-card-light",
        className
      )}
    >
      {/* Browser chrome */}
      <div className={cn(
        "flex items-center gap-2 bg-[#E5E5E5] border-b border-[#D4D4D4]",
        compact ? "px-3 py-2" : "px-4 py-3"
      )}>
        <div className="flex gap-1">
          <div className={cn("rounded-full bg-[#EF4444]", compact ? "w-2 h-2" : "w-3 h-3")} />
          <div className={cn("rounded-full bg-[#F59E0B]", compact ? "w-2 h-2" : "w-3 h-3")} />
          <div className={cn("rounded-full bg-[#22C55E]", compact ? "w-2 h-2" : "w-3 h-3")} />
        </div>
        <div className="flex-1 flex justify-center">
          <div className={cn(
            "bg-white rounded text-[#7A7A7A]",
            compact ? "px-2 py-0.5 text-[11px]" : "px-4 py-1 text-[13px]"
          )}>
            inbox.email.com
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className={cn(
        "bg-white",
        compact ? "p-2" : "p-4 min-h-[400px]"
      )}>{children}</div>
    </div>
  );
}

function MobileFrame({
  children,
  className,
  compact = false,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className={cn("bg-[#1A1A1A] rounded-[24px] p-2 w-full mx-auto content-card-light", className)}>
        <div className="bg-[#1A1A1A] flex items-center justify-center h-5 rounded-t-[18px]">
          <div className="bg-[#0A0A0A] rounded-full w-16 h-4" />
        </div>
        <div className="bg-white overflow-hidden rounded-[18px]">
          <div className="bg-[#F5F5F5] flex items-center justify-between text-[#7A7A7A] h-4 px-4 text-[8px]">
            <span>9:41</span>
            <div className="flex items-center gap-1"><span>5G</span><span>100%</span></div>
          </div>
          <div className="p-2">{children}</div>
          <div className="flex items-center justify-center h-4">
            <div className="bg-[#D4D4D4] rounded-full w-20 h-0.5" />
          </div>
        </div>
      </div>
    );
  }

  // Full-size iPhone 15 Pro-style frame — content-driven height, scrolls in outer container
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[380px] content-card-light",
        className,
      )}
    >
      {/* Titanium bezel with subtle gradient */}
      <div
        className="relative rounded-[48px] p-[8px]"
        style={{
          background: "linear-gradient(145deg, #3a3a3c 0%, #2c2c2e 30%, #1c1c1e 70%, #0a0a0a 100%)",
        }}
      >
        {/* Inner bezel highlight */}
        <div className="absolute inset-[1px] rounded-[47px] pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 40%)" }} />

        {/* Screen */}
        <div
          className="relative rounded-[40px] overflow-hidden bg-white"
        >
          {/* Status bar + Dynamic Island — single row */}
          <div className="relative z-20 flex items-center justify-between h-[44px] px-6">
            <span className="text-[14px] font-semibold text-black tracking-tight" style={{ fontFeatureSettings: "'tnum'" }}>9:41</span>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-[100px] h-[20px] bg-black rounded-full" />
            </div>
            <div className="flex items-center gap-[5px]">
              <CellBarsIcon className="w-[18px] h-[12px] text-black" />
              <WifiIcon className="w-[16px] h-[12px] text-black" />
              <BatteryIcon className="w-[27px] h-[13px] text-black" />
            </div>
          </div>

          {/* Content — flows naturally so the frame grows with it */}
          <div className="px-3 pb-[34px]">
            {children}
          </div>

          {/* Home indicator */}
          <div className="flex items-center justify-center h-[34px]">
            <div className="w-[134px] h-[5px] bg-black/20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Status bar icons ── */

function CellBarsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 17 12" fill="currentColor">
      <rect x="0" y="9" width="3" height="3" rx="0.5" />
      <rect x="4.5" y="6" width="3" height="6" rx="0.5" />
      <rect x="9" y="3" width="3" height="9" rx="0.5" />
      <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
    </svg>
  );
}

function WifiIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 15 12" fill="currentColor">
      <path d="M7.5 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM7.5 6.75c1.97 0 3.75.85 5 2.2l-1.25 1.3A5.15 5.15 0 0 0 7.5 8.5c-1.4 0-2.7.6-3.75 1.75L2.5 8.95c1.25-1.35 3.03-2.2 5-2.2zM7.5 3c2.9 0 5.5 1.2 7.35 3.15l-1.25 1.3A8.3 8.3 0 0 0 7.5 4.8 8.3 8.3 0 0 0 1.4 7.45L.15 6.15A10.4 10.4 0 0 1 7.5 3z" />
    </svg>
  );
}

function BatteryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 25 12" fill="none">
      <rect x="0.5" y="0.5" width="21" height="11" rx="2" stroke="currentColor" strokeWidth="1" />
      <rect x="2" y="2" width="17" height="8" rx="1" fill="currentColor" />
      <path d="M23 4v4a2 2 0 0 0 0-4z" fill="currentColor" opacity="0.4" />
    </svg>
  );
}
