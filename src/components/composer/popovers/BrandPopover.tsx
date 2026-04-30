"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useContextStore } from "@/stores/context";
import { useAuthStore } from "@/stores/auth";
import { ComposerVariant } from "../CampaignComposer";
import { cn } from "@/lib/cn";

interface BrandPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: ComposerVariant;
}

export function BrandPopover({ isOpen, onClose, variant = "dark" }: BrandPopoverProps) {
  const { isAuthenticated } = useAuthStore();
  const { context } = useContextStore();
  const [isImporting, setIsImporting] = useState(false);

  const isDark = variant === "dark";

  const handleImportFromSalesforce = async () => {
    setIsImporting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsImporting(false);
  };

  const brands = [
    { id: "aura", name: "Salesforce Palette", tone: "Modern, refined, premium", active: true },
    { id: "eco", name: "EcoLife", tone: "Sustainable, warm, friendly", active: false },
    { id: "tech", name: "TechForward", tone: "Innovative, bold, minimal", active: false },
  ];

  const theme = {
    dark: {
      container: "bg-[#161618]/95 backdrop-blur-xl border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.5)]",
      header: "border-white/[0.06]",
      title: "text-white",
      subtitle: "text-white/40",
      itemBg: "hover:bg-white/[0.04]",
      itemActiveBg: "bg-white/[0.08]",
      itemTitle: "text-white/90",
      itemSubtitle: "text-white/40",
      badge: "bg-blue-500/20 text-blue-400",
      iconBg: "bg-white/10",
      iconBgActive: "bg-[#00A1E0]/20",
      actionBg: "hover:bg-white/[0.04]",
      actionText: "text-white/60 hover:text-white/80",
      divider: "border-white/[0.06]",
    },
    light: {
      container: "bg-[var(--surface)] border-[var(--border)] shadow-xl",
      header: "border-[var(--border)]",
      title: "text-[var(--text-primary)]",
      subtitle: "text-[var(--text-secondary)]",
      itemBg: "hover:bg-[var(--surface-hover)]",
      itemActiveBg: "bg-[var(--surface-subtle)]",
      itemTitle: "text-[var(--text-primary)]",
      itemSubtitle: "text-[var(--text-secondary)]",
      badge: "bg-blue-100 text-blue-600",
      iconBg: "bg-[var(--surface-active)]",
      iconBgActive: "bg-[#00A1E0]/10",
      actionBg: "hover:bg-[var(--surface-hover)]",
      actionText: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
      divider: "border-[var(--border)]",
    },
    glass: {
      container: "bg-[var(--surface)]/90 backdrop-blur-xl border-[var(--border)] shadow-xl",
      header: "border-[var(--border)]",
      title: "text-[var(--text-primary)]",
      subtitle: "text-[var(--text-secondary)]",
      itemBg: "hover:bg-[var(--surface-hover)]",
      itemActiveBg: "bg-[var(--surface-subtle)]",
      itemTitle: "text-[var(--text-primary)]",
      itemSubtitle: "text-[var(--text-secondary)]",
      badge: "bg-blue-100 text-blue-600",
      iconBg: "bg-[var(--surface-subtle)]",
      iconBgActive: "bg-[#00A1E0]/10",
      actionBg: "hover:bg-[var(--surface-hover)]",
      actionText: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
      divider: "border-[var(--border)]",
    },
  };

  const t = theme[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className={cn(
              "absolute bottom-full left-0 mb-2 z-50 w-[300px]",
              "rounded-xl border overflow-hidden",
              t.container
            )}
          >
            {/* Header */}
            <div className={cn("px-4 py-3 border-b", t.header)}>
              <div className="flex items-center justify-between">
                <h3 className={cn("text-[14px] font-medium", t.title)}>Brand Identity</h3>
                <button onClick={onClose} className="p-1 rounded hover:bg-black/5">
                  <CloseIcon className={cn("w-3.5 h-3.5", isDark ? "text-white/50" : "text-[#7A7A7A]")} />
                </button>
              </div>
              <p className={cn("text-[13px] mt-0.5", t.subtitle)}>Select brand for generation</p>
            </div>

            {/* Brands list */}
            <div className="p-2 max-h-[220px] overflow-y-auto">
              {!isAuthenticated ? (
                <EmptyState isDark={isDark} message="Connect Salesforce" submessage="to access your brands" />
              ) : (
                brands.map((brand) => (
                  <button
                    key={brand.id}
                    className={cn(
                      "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                      brand.active ? t.itemActiveBg : t.itemBg
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", brand.active ? t.iconBgActive : t.iconBg)}>
                      <span className={cn("text-[13px] font-semibold", isDark ? "text-white/80" : "text-neutral-600")}>
                        {brand.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[13px] font-medium truncate", t.itemTitle)}>{brand.name}</span>
                        {brand.active && (
                          <span className={cn("px-1.5 py-0.5 rounded text-[11px] font-medium", t.badge)}>Active</span>
                        )}
                      </div>
                      <p className={cn("text-[13px] mt-0.5 truncate", t.itemSubtitle)}>{brand.tone}</p>
                    </div>
                    {brand.active && <CheckIcon className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>

            {/* Actions */}
            {isAuthenticated && (
              <div className={cn("p-2 border-t", t.divider)}>
                <ActionButton
                  icon={<SalesforceIcon className="w-4 h-4 text-[#00A1E0]" />}
                  label={isImporting ? "Importing..." : "Import from Salesforce"}
                  onClick={handleImportFromSalesforce}
                  disabled={isImporting}
                  theme={t}
                />
                <ActionButton
                  icon={<PlusIcon className={cn("w-4 h-4", isDark ? "text-white/60" : "text-neutral-500")} />}
                  label="Add new brand"
                  theme={t}
                />
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ActionButton({ icon, label, onClick, disabled, theme }: { 
  icon: React.ReactNode; 
  label: string; 
  onClick?: () => void;
  disabled?: boolean;
  theme: Record<string, string>;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors",
        theme.actionBg, theme.actionText,
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function EmptyState({ isDark, message, submessage }: { isDark: boolean; message: string; submessage: string }) {
  return (
    <div className="px-3 py-6 text-center">
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3", isDark ? "bg-white/5" : "bg-neutral-100")}>
        <SalesforceIcon className="w-5 h-5 text-[#00A1E0]" />
      </div>
      <p className={cn("text-[13px] mb-1", isDark ? "text-white/50" : "text-neutral-500")}>{message}</p>
      <p className={cn("text-[13px]", isDark ? "text-white/30" : "text-[#7A7A7A]")}>{submessage}</p>
    </div>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 4L4 12M4 4l8 8" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SalesforceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.1 3.2c.95-1 2.25-1.6 3.7-1.6 2.05 0 3.85 1.2 4.65 2.95.65-.3 1.35-.45 2.1-.45 2.75 0 5 2.25 5 5s-2.25 5-5 5H4.25C1.9 14.1 0 12.2 0 9.85c0-2.05 1.45-3.75 3.4-4.15.15-1.45 1.35-2.6 2.85-2.6.65 0 1.25.2 1.75.55.45-.15.95-.25 1.45-.25.25 0 .45 0 .65.05v-.25z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
