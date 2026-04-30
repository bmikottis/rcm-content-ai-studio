"use client";

import { ChannelType } from "@/types/canvas";
import { cn } from "@/lib/cn";

interface ChannelSwitcherProps {
  selected: ChannelType;
  onChange: (channel: ChannelType) => void;
  className?: string;
  compact?: boolean;
}

const channels: { id: ChannelType; icon: string; label: string }[] = [
  { id: "email", icon: "📧", label: "Email" },
  { id: "sms", icon: "💬", label: "SMS" },
  { id: "whatsapp", icon: "💚", label: "WhatsApp" },
];

export function ChannelSwitcher({
  selected,
  onChange,
  className,
  compact = false,
}: ChannelSwitcherProps) {
  if (compact) {
    return (
      <div className={cn("flex gap-1", className)}>
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onChange(channel.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg",
              "border transition-all duration-150 text-[13px] font-medium",
              selected === channel.id
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-[#DDD] hover:border-[#DDD] text-neutral-500 hover:text-neutral-700"
            )}
          >
            <span className="text-sm">{channel.icon}</span>
            <span className="hidden sm:inline">{channel.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3", className)}>
      {channels.map((channel) => (
        <button
          key={channel.id}
          onClick={() => onChange(channel.id)}
          className={cn(
            "flex-1 flex flex-col items-center gap-2 py-3 px-4 rounded-xl",
            "border transition-all duration-150",
            selected === channel.id
              ? "border-neutral-900 bg-neutral-50"
              : "border-[#DDD] hover:border-[#DDD]"
          )}
        >
          <span className="text-xl">{channel.icon}</span>
          <span className="text-[13px] text-neutral-600">
            {channel.label}
          </span>
        </button>
      ))}
    </div>
  );
}
