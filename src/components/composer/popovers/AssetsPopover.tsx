"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth";
import { ComposerVariant } from "../CampaignComposer";
import { cn } from "@/lib/cn";

interface AssetsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: ComposerVariant;
  onAssetSelect?: (asset: { id: string; name: string; type: string; size?: string; source: string }) => void;
}

type AssetCategory = "all" | "images" | "documents" | "fragments";

interface UploadedAsset {
  id: string;
  name: string;
  type: "image" | "pdf" | "document" | "fragment";
  size?: string;
  source: "upload" | "salesforce" | "dam";
}

export function AssetsPopover({ isOpen, onClose, variant = "dark", onAssetSelect }: AssetsPopoverProps) {
  const { isAuthenticated } = useAuthStore();
  const isDark = variant === "dark";
  const [activeCategory, setActiveCategory] = useState<AssetCategory>("all");
  const [assets] = useState<UploadedAsset[]>([
    { id: "1", name: "hero-banner.jpg", type: "image", size: "2.4 MB", source: "salesforce" },
    { id: "2", name: "product-specs.pdf", type: "pdf", size: "1.1 MB", source: "upload" },
    { id: "3", name: "Summer collection", type: "image", size: "12 files", source: "dam" },
  ]);

  const categories: { id: AssetCategory; label: string }[] = [
    { id: "all", label: "All" },
    { id: "images", label: "Images" },
    { id: "documents", label: "Docs" },
    { id: "fragments", label: "Content" },
  ];

  const theme = {
    dark: {
      container: "bg-[#161618]/95 backdrop-blur-xl border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.5)]",
      header: "border-white/[0.06]",
      title: "text-white",
      subtitle: "text-white/40",
      tabActive: "bg-white/10 text-white",
      tabInactive: "text-white/50 hover:text-white/70 hover:bg-white/5",
      itemBg: "hover:bg-white/[0.04]",
      itemText: "text-white/80",
      itemMeta: "text-white/40",
      divider: "border-white/[0.06]",
      actionText: "text-white/60 hover:text-white/80",
    },
    light: {
      container: "bg-[var(--surface)] border-[var(--border)] shadow-xl",
      header: "border-[var(--border)]",
      title: "text-[var(--text-primary)]",
      subtitle: "text-[var(--text-secondary)]",
      tabActive: "bg-[var(--surface-active)] text-[var(--text-primary)]",
      tabInactive: "text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]",
      itemBg: "hover:bg-[var(--surface-hover)]",
      itemText: "text-[var(--text-primary)]",
      itemMeta: "text-[var(--text-secondary)]",
      divider: "border-[var(--border)]",
      actionText: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
    },
    glass: {
      container: "bg-[var(--surface)]/90 backdrop-blur-xl border-[var(--border)] shadow-xl",
      header: "border-[var(--border)]",
      title: "text-[var(--text-primary)]",
      subtitle: "text-[var(--text-secondary)]",
      tabActive: "bg-[var(--surface-active)] text-[var(--text-primary)]",
      tabInactive: "text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]",
      itemBg: "hover:bg-[var(--surface-hover)]",
      itemText: "text-[var(--text-primary)]",
      itemMeta: "text-[var(--text-secondary)]",
      divider: "border-[var(--border)]",
      actionText: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
    },
  };

  const t = theme[variant];

  const filteredAssets = activeCategory === "all" 
    ? assets 
    : assets.filter(a => {
        if (activeCategory === "images") return a.type === "image";
        if (activeCategory === "documents") return a.type === "pdf" || a.type === "document";
        if (activeCategory === "fragments") return a.type === "fragment";
        return true;
      });

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
              "absolute bottom-full left-0 mb-2 z-50 w-[340px]",
              "rounded-xl border overflow-hidden",
              t.container
            )}
          >
            {/* Header */}
            <div className={cn("px-4 py-3 border-b", t.header)}>
              <div className="flex items-center justify-between">
                <h3 className={cn("text-[14px] font-medium", t.title)}>Assets & Content</h3>
                <button onClick={onClose} className="p-1 rounded hover:bg-black/5">
                  <CloseIcon className={cn("w-3.5 h-3.5", isDark ? "text-white/50" : "text-[#7A7A7A]")} />
                </button>
              </div>
              <p className={cn("text-[13px] mt-0.5", t.subtitle)}>Attach files to your campaign</p>
            </div>

            {/* Category tabs */}
            <div className={cn("px-3 py-2 border-b flex gap-1", t.divider)}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[13px] font-medium transition-colors",
                    activeCategory === cat.id ? t.tabActive : t.tabInactive
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Assets list */}
            <div className="h-[160px] overflow-y-auto px-2 pb-2">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    onAssetSelect?.(asset);
                    onClose();
                  }}
                  className={cn("w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors group text-left", t.itemBg)}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    asset.type === "image" ? (isDark ? "bg-purple-500/20" : "bg-purple-100") : 
                    asset.type === "pdf" ? (isDark ? "bg-red-500/20" : "bg-red-100") : 
                    (isDark ? "bg-blue-500/20" : "bg-blue-100")
                  )}>
                    {asset.type === "image" ? (
                      <ImageIcon className={cn("w-3.5 h-3.5", isDark ? "text-purple-400" : "text-purple-500")} />
                    ) : (
                      <FileIcon className={cn("w-3.5 h-3.5", asset.type === "pdf" ? (isDark ? "text-red-400" : "text-red-500") : (isDark ? "text-blue-400" : "text-blue-500"))} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[13px] truncate", t.itemText)}>{asset.name}</p>
                    <p className={cn("text-[13px]", t.itemMeta)}>{asset.size} · {asset.source}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className={cn("p-2 border-t", t.divider)}>
              <button className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors hover:bg-black/5", t.actionText)}>
                <DatabaseIcon className="w-3.5 h-3.5" />
                <span>Browse DAM / CMS</span>
              </button>
              <button className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors hover:bg-black/5", t.actionText)}>
                <SalesforceIcon className="w-3.5 h-3.5 text-[#00A1E0]" />
                <span>Import from Salesforce</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4L4 12M4 4l8 8" /></svg>;
}

function ImageIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
}

function FileIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
}

function DatabaseIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>;
}

function SalesforceIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M10.1 3.2c.95-1 2.25-1.6 3.7-1.6 2.05 0 3.85 1.2 4.65 2.95.65-.3 1.35-.45 2.1-.45 2.75 0 5 2.25 5 5s-2.25 5-5 5H4.25C1.9 14.1 0 12.2 0 9.85c0-2.05 1.45-3.75 3.4-4.15.15-1.45 1.35-2.6 2.85-2.6.65 0 1.25.2 1.75.55.45-.15.95-.25 1.45-.25.25 0 .45 0 .65.05v-.25z" /></svg>;
}
