"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

interface ChannelsMenuProps {
  variant?: "dark" | "light" | "glass";
  /** Called only on manual user clicks, not on external sync */
  onManualToggle?: (channelIds: Set<string>) => void;
  /** Push channel selections from outside (e.g. brief auto-select) */
  externalChannelIds?: Set<string>;
}

interface ChannelOption {
  id: string;
  name: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}

const channels: ChannelOption[] = [
  { id: "email", name: "Email", description: "Marketing emails", icon: EmailIcon },
  { id: "landing-page", name: "Landing page", description: "Web pages", icon: LandingPageIcon },
  { id: "sms", name: "SMS", description: "Text messages", icon: SMSIcon },
  { id: "push", name: "Push Notification", description: "Mobile alerts", icon: PushIcon },
  { id: "whatsapp", name: "WhatsApp", description: "Chat messages", icon: WhatsAppIcon },
  { id: "in-app", name: "In-App Message", description: "App notifications", icon: InAppIcon },
];

export function ChannelsMenu({ variant = "dark", onManualToggle, externalChannelIds }: ChannelsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [dropdownPosition, setDropdownPosition] = useState<"above" | "below">("above");
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isDark = variant === "dark";

  const calculateDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 350;
    const spaceAbove = buttonRect.top;
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    
    if (spaceAbove < dropdownHeight && spaceBelow > spaceAbove) {
      setDropdownPosition("below");
    } else {
      setDropdownPosition("above");
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  useEffect(() => {
    if (externalChannelIds !== undefined) {
      setSelectedChannels(externalChannelIds);
    }
  }, [externalChannelIds]);

  const toggleChannel = (channelId: string) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }
      onManualToggle?.(next);
      return next;
    });
  };

  const getButtonLabel = () => {
    if (selectedChannels.size === 0) return "Channels";
    if (selectedChannels.size === 1) {
      const channel = channels.find(c => selectedChannels.has(c.id));
      return channel?.name || "Channels";
    }
    return `${selectedChannels.size} channels`;
  };

  const t = {
    button: isDark
      ? selectedChannels.size > 0
        ? "bg-blue-500/10 border-blue-500/15 text-blue-400/90 hover:bg-blue-500/15"
        : "bg-white/[0.03] border-white/[0.05] text-white/30 hover:bg-white/[0.05] hover:text-white/45"
      : selectedChannels.size > 0
        ? "bg-blue-50 text-blue-600 border border-blue-200/80 hover:bg-blue-100"
        : "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
    buttonOpen: isDark ? "ring-1 ring-white/15" : "ring-1 ring-neutral-300",
    menu: isDark
      ? "bg-[#1a1a1c] border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
      : "bg-[var(--surface)] border border-[var(--border)] shadow-xl",
    sectionTitle: isDark ? "text-white/30" : "text-[var(--text-muted)]",
    itemLabel: isDark ? "text-white/70" : "text-[var(--text-secondary)]",
    itemDesc: isDark ? "text-white/30" : "text-[var(--text-muted)]",
    item: isDark
      ? "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
      : "bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-hover)]",
    itemSelected: isDark
      ? "bg-blue-500/10 border-blue-500/20"
      : "bg-blue-50 border-blue-200",
  };

  return (
    <div ref={menuRef} className="relative" data-popover>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!isOpen) calculateDropdownPosition();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full",
          "text-[13px] font-medium",
          "transition-all duration-150 border",
          t.button,
          isOpen && t.buttonOpen
        )}
      >
        {selectedChannels.size > 0 ? (
          <CheckIcon className="w-3 h-3 flex-shrink-0" />
        ) : (
          <ChannelsIcon className="w-3 h-3 flex-shrink-0" />
        )}
        <span className="relative">
          <span className="invisible whitespace-nowrap">Channels</span>
          <span className="absolute inset-0 truncate">{getButtonLabel()}</span>
        </span>
        <ChevronIcon className={cn("w-3 h-3 flex-shrink-0 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: dropdownPosition === "above" ? 8 : -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropdownPosition === "above" ? 8 : -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute left-0 w-[300px] rounded-xl overflow-hidden",
              dropdownPosition === "above" ? "bottom-full mb-2" : "top-full mt-2",
              t.menu
            )}
            style={{ zIndex: "var(--z-dropdown)" }}
          >
            <div className="p-3 space-y-2">
              <p className={cn("text-[11px] font-medium uppercase tracking-wider px-1", t.sectionTitle)}>
                Channels
              </p>
              <p className={cn("text-[13px] px-1 -mt-1", t.itemDesc)}>
                Select where and how you want to reach your audience.
              </p>

              <div className="grid grid-cols-2 gap-2 mt-3">
                {channels.map((channel) => {
                  const isSelected = selectedChannels.has(channel.id);
                  const Icon = channel.icon;
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => toggleChannel(channel.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center",
                        isSelected ? t.itemSelected : t.item
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        isSelected
                          ? isDark ? "bg-blue-500/20" : "bg-blue-100"
                          : isDark ? "bg-white/[0.06]" : "bg-[var(--surface-active)]"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          isSelected
                            ? isDark ? "text-blue-400" : "text-blue-600"
                            : isDark ? "text-white/50" : "text-[var(--text-secondary)]"
                        )} />
                      </div>
                      <span className={cn("text-[13px] font-medium", t.itemLabel)}>
                        {channel.name}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                          <CheckIcon className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChannelsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function LandingPageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}

function SMSIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function PushIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function InAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}
