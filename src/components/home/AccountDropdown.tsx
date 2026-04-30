"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth";
import { useContextStore } from "@/stores/context";
import { useThemeStore, type ThemeOption } from "@/stores/theme";
import { cn } from "@/lib/cn";

interface AccountDropdownProps {
  className?: string;
  variant?: "light" | "dark";
  /** Use with floating toolbars so the trigger matches bar corner radius (e.g. rounded-xl). */
  avatarRadius?: "full" | "xl";
}

export function AccountDropdown({ className, variant = "dark", avatarRadius = "full" }: AccountDropdownProps) {
  const isLight = variant === "light";
  const avatarRound = avatarRadius === "xl" ? "rounded-xl" : "rounded-full";
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"main" | "settings">("main");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuthStore();
  const { context, clearContext } = useContextStore();
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setView("main");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleSignOut = () => {
    clearContext();
    logout();
    setIsOpen(false);
  };

  // Theme-aware styles
  const t = {
    dropdown: isLight
      ? "bg-white border border-[#DDD] shadow-xl"
      : "bg-[#1a1a1c] border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.4)]",
    border: isLight ? "border-[#DDD]" : "border-white/[0.06]",
    text: isLight ? "text-neutral-900" : "text-white",
    textSecondary: isLight ? "text-neutral-500" : "text-white/45",
    textMuted: isLight ? "text-[#7A7A7A]" : "text-white/25",
    itemBg: isLight ? "bg-neutral-50" : "bg-white/[0.06]",
    itemHover: isLight ? "hover:bg-neutral-50" : "hover:bg-white/[0.05]",
    itemIcon: isLight ? "text-[#7A7A7A]" : "text-white/50",
    itemText: isLight ? "text-neutral-600" : "text-white/60",
    footer: isLight ? "bg-neutral-50 border-[#DDD]" : "bg-white/[0.02] border-white/[0.04]",
    close: isLight ? "hover:bg-neutral-100" : "hover:bg-white/10",
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Avatar button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-9 h-9 flex items-center justify-center",
          avatarRound,
          "bg-gradient-to-br from-[#00A1E0] to-[#0070E0]",
          isLight ? "shadow-md" : "shadow-lg shadow-[#0070E0]/20 border border-white/10",
          "transition-all duration-150",
          isOpen && (isLight ? "ring-2 ring-[#00A1E0]/30" : "ring-2 ring-white/20")
        )}
      >
        <span className="text-[13px] text-white font-semibold">JD</span>
      </motion.button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className={cn(
              "absolute top-full right-0 mt-2 w-[260px]",
              t.dropdown,
              "rounded-xl overflow-hidden"
            )}
            style={{ zIndex: "var(--z-dropdown)" }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {view === "settings" ? (
                <motion.div
                  key="settings"
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 30, opacity: 0 }}
                  transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  {/* Theme header */}
                  <div className={cn("px-3 py-3 border-b flex items-center gap-2", t.border)}>
                    <button
                      onClick={() => setView("main")}
                      className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors", t.close)}
                    >
                      <BackIcon className={cn("w-3.5 h-3.5", t.textSecondary)} />
                    </button>
                    <span className={cn("text-[14px] font-semibold", t.text)}>Theme</span>
                  </div>

                  {/* Appearance */}
                  <div className="px-4 py-3">
                    <p className={cn("text-[11px] font-semibold uppercase tracking-wide mb-2.5", t.textMuted)}>Appearance</p>
                    <div className="flex gap-2">
                      {(["light", "dark", "system"] as ThemeOption[]).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setTheme(opt)}
                          className={cn(
                            "flex-1 flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-lg border transition-all text-center",
                            theme === opt
                              ? isLight
                                ? "border-[#0F8EFF] bg-blue-50/60 ring-1 ring-[#0F8EFF]/20"
                                : "border-[#4DA6FF] bg-[#4DA6FF]/10 ring-1 ring-[#4DA6FF]/20"
                              : cn("border-transparent", t.itemHover),
                          )}
                        >
                          <ThemePreviewIcon mode={opt} isLight={isLight} isActive={theme === opt} />
                          <span className={cn(
                            "text-[12px] font-medium capitalize",
                            theme === opt
                              ? isLight ? "text-[#0F8EFF]" : "text-[#4DA6FF]"
                              : t.itemText,
                          )}>
                            {opt}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="main"
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -30, opacity: 0 }}
                  transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  {/* User identity header */}
                  <div className={cn("px-4 py-4 border-b", t.border)}>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 bg-gradient-to-br from-[#00A1E0] to-[#0070E0] flex items-center justify-center flex-shrink-0",
                          avatarRadius === "xl" ? "rounded-xl" : "rounded-full",
                        )}
                      >
                        <span className="text-[14px] text-white font-semibold">JD</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[14px] font-medium truncate", t.text)}>
                          John Doe
                        </p>
                        <p className={cn("text-[13px] truncate", t.textSecondary)}>
                          jdoe@salesforce.com
                        </p>
                      </div>
                      <button
                        onClick={() => { setIsOpen(false); setView("main"); }}
                        className={cn("w-6 h-6 rounded-md flex items-center justify-center transition-colors flex-shrink-0", t.close)}
                      >
                        <CloseIcon className={cn("w-3 h-3", t.textMuted)} />
                      </button>
                    </div>
                  </div>

                  {/* Connected org */}
                  {context && (
                    <div className={cn("px-2 py-1.5 border-b", t.border)}>
                      <button className={cn("w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors text-left", t.itemHover)}>
                        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", t.itemBg)}>
                          <BuildingIcon className={cn("w-3.5 h-3.5", t.itemIcon)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-[13px] font-medium truncate", isLight ? "text-neutral-700" : "text-white/70")}>
                            {context.brand.name}
                          </p>
                          <p className={cn("text-[13px]", t.textMuted)}>Connected org</p>
                        </div>
                        <ChevronIcon className={cn("w-3.5 h-3.5", t.textMuted)} />
                      </button>
                    </div>
                  )}

                  {/* Menu items */}
                  <div className={cn("px-2 py-1.5 border-b", t.border)}>
                    <MenuItem icon={SettingsIcon} label="Settings" theme={t} />
                    <MenuItem icon={ThemeIcon} label="Theme" onClick={() => setView("settings")} theme={t} />
                    <MenuItem icon={UserIcon} label="Manage Account" theme={t} />
                    <MenuItem icon={SwitchIcon} label="Switch Account" theme={t} />
                  </div>

                  {/* Sign out */}
                  <div className="px-2 py-1.5">
                    <button
                      onClick={handleSignOut}
                      className={cn("w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors text-left group", t.itemHover)}
                    >
                      <div className={cn("w-7 h-7 rounded-md flex items-center justify-center group-hover:bg-red-500/10 transition-colors", t.itemBg)}>
                        <SignOutIcon className={cn("w-3.5 h-3.5 group-hover:text-red-500 transition-colors", t.itemIcon)} />
                      </div>
                      <span className={cn("text-[13px] group-hover:text-red-500 transition-colors", t.itemText)}>
                        Sign out
                      </span>
                    </button>
                  </div>

                  {/* Footer */}
                  <div className={cn("px-4 py-2.5 border-t", t.footer)}>
                    <div className="flex items-center justify-center gap-3">
                      <button className={cn("text-[13px] hover:opacity-70 transition-opacity", t.textMuted)}>
                        Privacy
                      </button>
                      <span className={t.textMuted}>·</span>
                      <button className={cn("text-[13px] hover:opacity-70 transition-opacity", t.textMuted)}>
                        Terms
                      </button>
                      <span className={t.textMuted}>·</span>
                      <button className={cn("text-[13px] hover:opacity-70 transition-opacity", t.textMuted)}>
                        Help
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MenuItemProps {
  icon: React.FC<{ className?: string }>;
  label: string;
  onClick?: () => void;
  theme: Record<string, string>;
}

function MenuItem({ icon: Icon, label, onClick, theme }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn("w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors text-left", theme.itemHover)}
    >
      <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", theme.itemBg)}>
        <Icon className={cn("w-3.5 h-3.5", theme.itemIcon)} />
      </div>
      <span className={cn("text-[13px]", theme.itemText)}>{label}</span>
    </button>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 4L4 12M4 4l8 8" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ThemeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SwitchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function SignOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ThemePreviewIcon({ mode, isLight, isActive }: { mode: ThemeOption; isLight: boolean; isActive: boolean }) {
  const borderColor = isActive
    ? isLight ? "#0F8EFF" : "#4DA6FF"
    : isLight ? "#DDD" : "rgba(255,255,255,0.12)";

  if (mode === "light") {
    return (
      <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
        <rect x="0.5" y="0.5" width="31" height="23" rx="3.5" fill="#FFFFFF" stroke={borderColor} />
        <rect x="3" y="3" width="8" height="18" rx="1.5" fill="#F3F3F3" />
        <rect x="13" y="5" width="16" height="3" rx="1" fill="#E5E5E5" />
        <rect x="13" y="10" width="12" height="2" rx="0.5" fill="#E5E5E5" />
        <rect x="13" y="14" width="14" height="2" rx="0.5" fill="#E5E5E5" />
      </svg>
    );
  }

  if (mode === "dark") {
    return (
      <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
        <rect x="0.5" y="0.5" width="31" height="23" rx="3.5" fill="#1c1c1e" stroke={borderColor} />
        <rect x="3" y="3" width="8" height="18" rx="1.5" fill="#2a2a2c" />
        <rect x="13" y="5" width="16" height="3" rx="1" fill="#333336" />
        <rect x="13" y="10" width="12" height="2" rx="0.5" fill="#333336" />
        <rect x="13" y="14" width="14" height="2" rx="0.5" fill="#333336" />
      </svg>
    );
  }

  return (
    <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
      <rect x="0.5" y="0.5" width="31" height="23" rx="3.5" fill="#FFFFFF" stroke={borderColor} />
      <clipPath id="sys-right"><rect x="16" y="0" width="16" height="24" /></clipPath>
      <rect x="0.5" y="0.5" width="31" height="23" rx="3.5" fill="#1c1c1e" clipPath="url(#sys-right)" />
      <rect x="3" y="3" width="8" height="18" rx="1.5" fill="#F3F3F3" />
      <rect x="13" y="5" width="8" height="3" rx="1" fill="#E5E5E5" />
      <rect x="21" y="5" width="8" height="3" rx="1" fill="#333336" />
      <rect x="13" y="10" width="6" height="2" rx="0.5" fill="#E5E5E5" />
      <rect x="19" y="10" width="6" height="2" rx="0.5" fill="#333336" />
    </svg>
  );
}
