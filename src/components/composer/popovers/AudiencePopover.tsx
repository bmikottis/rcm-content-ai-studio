"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth";
import { ComposerVariant } from "../CampaignComposer";
import { cn } from "@/lib/cn";

interface AudiencePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: ComposerVariant;
}

interface Segment {
  id: string;
  name: string;
  size: string;
  description: string;
  selected: boolean;
}

export function AudiencePopover({ isOpen, onClose, variant = "dark" }: AudiencePopoverProps) {
  const { isAuthenticated } = useAuthStore();
  const isDark = variant === "dark";
  const [activeTab, setActiveTab] = useState<"segments" | "targeting">("segments");
  const [segments, setSegments] = useState<Segment[]>([
    { id: "1", name: "Urban Professionals", size: "2.4M", description: "Ages 25-45, high income", selected: true },
    { id: "2", name: "Eco-conscious Families", size: "1.8M", description: "Sustainability focused", selected: true },
    { id: "3", name: "Tech Early Adopters", size: "890K", description: "Innovation seekers", selected: false },
  ]);

  const regions = [
    { id: "na", name: "North America", selected: true },
    { id: "eu", name: "Europe", selected: true },
    { id: "apac", name: "Asia Pacific", selected: false },
  ];

  const languages = [
    { id: "en", name: "English", selected: true },
    { id: "es", name: "Spanish", selected: false },
    { id: "fr", name: "French", selected: false },
  ];

  const toggleSegment = (id: string) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  const theme = {
    dark: {
      container: "bg-[#161618]/95 backdrop-blur-xl border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.5)]",
      header: "border-white/[0.06]",
      title: "text-white",
      subtitle: "text-white/40",
      tabActive: "bg-white/10 text-white",
      tabInactive: "text-white/50 hover:text-white/70 hover:bg-white/5",
      itemBg: "hover:bg-white/[0.04]",
      itemActiveBg: "bg-white/[0.06]",
      itemText: "text-white/90",
      itemMeta: "text-white/40",
      checkboxActive: "bg-[#00A1E0] border-[#00A1E0]",
      checkboxInactive: "border-white/20",
      pillActive: "bg-[#00A1E0]/20 text-[#00A1E0] border-[#00A1E0]/30",
      pillInactive: "bg-white/5 text-white/50 border-white/10 hover:bg-white/10",
      sectionLabel: "text-white/50",
      divider: "border-white/[0.06]",
      actionText: "text-white/60 hover:text-white/80",
      summary: "text-white/40",
      summaryHighlight: "text-white/60",
    },
    light: {
      container: "bg-[var(--surface)] border-[var(--border)] shadow-xl shadow-neutral-200/50",
      header: "border-[var(--border)]",
      title: "text-[var(--text-primary)]",
      subtitle: "text-[var(--text-secondary)]",
      tabActive: "bg-[var(--surface-active)] text-[var(--text-primary)]",
      tabInactive: "text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]",
      itemBg: "hover:bg-[var(--surface-hover)]",
      itemActiveBg: "bg-[var(--surface-subtle)]",
      itemText: "text-[var(--text-primary)]",
      itemMeta: "text-[var(--text-secondary)]",
      checkboxActive: "bg-[#00A1E0] border-[#00A1E0]",
      checkboxInactive: "border-[var(--border)]",
      pillActive: "bg-blue-50 text-blue-600 border-blue-200",
      pillInactive: "bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-active)]",
      sectionLabel: "text-[var(--text-secondary)]",
      divider: "border-[var(--border)]",
      actionText: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
      summary: "text-[var(--text-secondary)]",
      summaryHighlight: "text-[var(--text-secondary)]",
    },
    glass: {
      container: "bg-white/90 backdrop-blur-xl border-white/60 shadow-xl shadow-neutral-200/30",
      header: "border-[#DDD]/50",
      title: "text-[var(--text-primary)]",
      subtitle: "text-[var(--text-secondary)]",
      tabActive: "bg-white/80 text-[var(--text-primary)]",
      tabInactive: "text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:bg-white/50",
      itemBg: "hover:bg-white/50",
      itemActiveBg: "bg-white/60",
      itemText: "text-[var(--text-primary)]",
      itemMeta: "text-[var(--text-secondary)]",
      checkboxActive: "bg-[#00A1E0] border-[#00A1E0]",
      checkboxInactive: "border-[var(--border)]",
      pillActive: "bg-blue-50 text-blue-600 border-blue-200",
      pillInactive: "bg-white/50 text-[var(--text-secondary)] border-[#DDD]/50 hover:bg-white/80",
      sectionLabel: "text-[var(--text-secondary)]",
      divider: "border-[#DDD]/50",
      actionText: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
      summary: "text-[var(--text-secondary)]",
      summaryHighlight: "text-[var(--text-secondary)]",
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
              "absolute bottom-full right-0 mb-2 z-50 w-[320px]",
              "rounded-xl border overflow-hidden",
              t.container
            )}
          >
            {/* Header */}
            <div className={cn("px-4 py-3 border-b", t.header)}>
              <div className="flex items-center justify-between">
                <h3 className={cn("text-[14px] font-medium", t.title)}>Audience Targeting</h3>
                <button onClick={onClose} className="p-1 rounded hover:bg-black/5">
                  <CloseIcon className={cn("w-3.5 h-3.5", isDark ? "text-white/50" : "text-[var(--text-muted)]")} />
                </button>
              </div>
              <p className={cn("text-[13px] mt-0.5", t.subtitle)}>Define who receives your content</p>
            </div>

            {/* Tabs */}
            <div className={cn("px-3 py-2 border-b flex gap-1", t.divider)}>
              <button
                onClick={() => setActiveTab("segments")}
                className={cn("px-2.5 py-1 rounded-md text-[13px] font-medium transition-colors", activeTab === "segments" ? t.tabActive : t.tabInactive)}
              >
                Segments
              </button>
              <button
                onClick={() => setActiveTab("targeting")}
                className={cn("px-2.5 py-1 rounded-md text-[13px] font-medium transition-colors", activeTab === "targeting" ? t.tabActive : t.tabInactive)}
              >
                Targeting
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[220px] overflow-y-auto">
              {!isAuthenticated ? (
                <div className="px-4 py-8 text-center">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3", isDark ? "bg-white/5" : "bg-[var(--surface-active)]")}>
                    <UsersIcon className={cn("w-6 h-6", isDark ? "text-white/30" : "text-[var(--text-muted)]")} />
                  </div>
                  <p className={cn("text-[13px] mb-1", isDark ? "text-white/50" : "text-[var(--text-secondary)]")}>Connect to Data Cloud</p>
                  <p className={cn("text-[13px]", isDark ? "text-white/30" : "text-[var(--text-muted)]")}>to access audience segments</p>
                </div>
              ) : activeTab === "segments" ? (
                <div className="p-2">
                  {segments.map((segment) => (
                    <button
                      key={segment.id}
                      onClick={() => toggleSegment(segment.id)}
                      className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors", segment.selected ? t.itemActiveBg : t.itemBg)}
                    >
                      <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors", segment.selected ? t.checkboxActive : t.checkboxInactive)}>
                        {segment.selected && <CheckIcon className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[13px] font-medium", t.itemText)}>{segment.name}</span>
                          <span className={cn("text-[13px]", t.itemMeta)}>{segment.size}</span>
                        </div>
                        <p className={cn("text-[13px] mt-0.5", t.itemMeta)}>{segment.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 space-y-4">
                  <div>
                    <p className={cn("text-[11px] font-medium uppercase tracking-wider px-1 mb-2", t.sectionLabel)}>Regions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {regions.map((region) => (
                        <button
                          key={region.id}
                          className={cn("px-2.5 py-1 rounded-full text-[13px] font-medium border transition-colors", region.selected ? t.pillActive : t.pillInactive)}
                        >
                          {region.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className={cn("text-[11px] font-medium uppercase tracking-wider px-1 mb-2", t.sectionLabel)}>Languages</p>
                    <div className="flex flex-wrap gap-1.5">
                      {languages.map((lang) => (
                        <button
                          key={lang.id}
                          className={cn("px-2.5 py-1 rounded-full text-[13px] font-medium border transition-colors", lang.selected ? t.pillActive : t.pillInactive)}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className={cn("p-2 border-t", t.divider)}>
              <button className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors hover:bg-black/5", t.actionText)}>
                <DataCloudIcon className="w-3.5 h-3.5 text-[#00A1E0]" />
                <span>Browse Data Cloud segments</span>
              </button>
            </div>

            {/* Summary */}
            {isAuthenticated && (
              <div className={cn("px-4 py-2 border-t", t.divider, isDark ? "bg-white/[0.02]" : "bg-[var(--surface-subtle)]")}>
                <p className={cn("text-[13px]", t.summary)}>
                  <span className={t.summaryHighlight}>{segments.filter(s => s.selected).length} segments</span>
                  {" · "}
                  <span className={t.summaryHighlight}>~4.2M reach</span>
                  {" · "}
                  <span>2 regions</span>
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4L4 12M4 4l8 8" /></svg>;
}

function CheckIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}

function UsersIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}

function DataCloudIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" /></svg>;
}
