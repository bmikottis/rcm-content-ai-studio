"use client";

import { cn } from "@/lib/cn";

type Device = "desktop" | "mobile";

interface DeviceSwitcherProps {
  selected: Device;
  onChange: (device: Device) => void;
  className?: string;
  compact?: boolean;
}

const devices: { id: Device; icon: string; label: string; dimensions: string }[] = [
  { id: "desktop", icon: "🖥", label: "Desktop", dimensions: "1200 × 800" },
  { id: "mobile", icon: "📱", label: "Mobile", dimensions: "375 × 812" },
];

export function DeviceSwitcher({
  selected,
  onChange,
  className,
  compact = false,
}: DeviceSwitcherProps) {
  if (compact) {
    return (
      <div className={cn("flex gap-1", className)}>
        {devices.map((device) => (
          <button
            key={device.id}
            onClick={() => onChange(device.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg",
              "border transition-all duration-150 text-[13px] font-medium",
              selected === device.id
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-[#DDD] hover:border-[#DDD] text-neutral-500 hover:text-neutral-700"
            )}
          >
            <span className="text-sm">{device.icon}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3", className)}>
      {devices.map((device) => (
        <button
          key={device.id}
          onClick={() => onChange(device.id)}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 py-3 px-4 rounded-xl",
            "border transition-all duration-150",
            selected === device.id
              ? "border-neutral-900 bg-neutral-50"
              : "border-[#DDD] hover:border-[#DDD]"
          )}
        >
          <span className="text-xl">{device.icon}</span>
          <span className="text-[13px] text-neutral-600">
            {device.label}
          </span>
          <span className="text-[13px] text-[#7A7A7A]">
            {device.dimensions}
          </span>
        </button>
      ))}
    </div>
  );
}
