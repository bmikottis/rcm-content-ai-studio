"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useComposerStore } from "@/stores/composer";
import { Attachment } from "@/types/composer";
import { cn } from "@/lib/cn";

interface AttachmentsMenuProps {
  variant: "dark" | "light" | "glass";
  isNarrow?: boolean;
}

export function AttachmentsMenu({ variant, isNarrow = false }: AttachmentsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<"above" | "below">("above");
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { addAttachment } = useComposerStore();

  const isDark = variant === "dark";
  const isLight = !isDark;

  const calculateDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 300;
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
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleUpload = (type: Attachment["type"]) => {
    // Simulate file upload
    const mockAttachment: Attachment = {
      id: `att-${Date.now()}`,
      type,
      name: type === "pdf" ? "Campaign_Brief.pdf" : type === "image" ? "hero_image.jpg" : "Design_Spec.doc",
      size: "2.4 MB",
      source: "upload",
    };
    addAttachment(mockAttachment);
    setIsOpen(false);
  };

  const handleSalesforceSelect = () => {
    const mockAttachment: Attachment = {
      id: `att-${Date.now()}`,
      type: "asset",
      name: "Product Hero Banner",
      source: "salesforce",
      preview: "Content Builder",
    };
    addAttachment(mockAttachment);
    setIsOpen(false);
  };

  const t = {
    button: isLight
      ? "border border-white/70 bg-white/50 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] text-[var(--text-secondary)] hover:bg-white/70"
      : "border border-white/[0.22] bg-white/[0.16] backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] text-[var(--text-secondary)] hover:bg-white/[0.24]",
    menu: isLight
      ? "bg-[var(--surface)] border-[var(--border)] shadow-xl"
      : "bg-[var(--surface)] border-[var(--border)] shadow-2xl",
    menuItem: isLight
      ? "hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
      : "hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]",
    menuItemDesc: isLight ? "text-[var(--text-muted)]" : "text-[var(--text-muted)]",
    divider: isLight ? "border-[var(--border)]" : "border-[var(--border)]",
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
          "w-8 h-8 rounded-full flex items-center justify-center transition-all",
          t.button,
          isOpen && (isLight ? "bg-neutral-200" : "bg-white/[0.24]")
        )}
      >
        <PlusIcon className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: dropdownPosition === "above" ? 8 : -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropdownPosition === "above" ? 8 : -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute left-0 w-[220px]",
              "rounded-xl border overflow-hidden",
              dropdownPosition === "above" ? "bottom-full mb-2" : "top-full mt-2",
              t.menu
            )}
            style={{ zIndex: "var(--z-dropdown)" }}
          >
            <div className="p-1">
              <div className="px-3 py-2">
                <span className={cn("text-[11px] font-semibold uppercase tracking-wider", t.menuItemDesc)}>
                  Add to prompt
                </span>
              </div>

              <MenuItem
                icon={<UploadIcon />}
                label="Upload file"
                desc="PDF, Doc, Image"
                onClick={() => handleUpload("pdf")}
                theme={t}
              />
              <MenuItem
                icon={<ImageIcon />}
                label="Add image"
                desc="JPG, PNG, WebP"
                onClick={() => handleUpload("image")}
                theme={t}
              />
              <MenuItem
                icon={<FigmaIcon />}
                label="Figma board"
                desc="Import design"
                onClick={() => handleUpload("figma")}
                theme={t}
              />

              <div className={cn("my-1 mx-2 border-t", t.divider)} />

              <MenuItem
                icon={<SalesforceIcon />}
                label="From Salesforce"
                desc="Content Builder, Assets"
                onClick={handleSalesforceSelect}
                theme={t}
              />

              {isNarrow && (
                <>
                  <div className={cn("my-1 mx-2 border-t", t.divider)} />
                  <div className="px-3 py-2">
                    <span className={cn("text-[11px] font-semibold uppercase tracking-wider", t.menuItemDesc)}>
                      Settings
                    </span>
                  </div>
                  <MenuItem
                    icon={<BriefIcon />}
                    label="Brief"
                    desc="Campaign brief"
                    onClick={() => setIsOpen(false)}
                    theme={t}
                  />
                  <MenuItem
                    icon={<BrandKitIcon />}
                    label="Brand Kit"
                    desc="Styles & guidelines"
                    onClick={() => setIsOpen(false)}
                    theme={t}
                  />
                  <MenuItem
                    icon={<ChannelsIcon />}
                    label="Channels"
                    desc="Email, SMS, WhatsApp"
                    onClick={() => setIsOpen(false)}
                    theme={t}
                  />
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: () => void;
  theme: Record<string, string>;
}

function MenuItem({ icon, label, desc, onClick, theme }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
        theme.menuItem
      )}
    >
      <span className="w-5 h-5 flex items-center justify-center opacity-60">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium">{label}</p>
        <p className={cn("text-[13px]", theme.menuItemDesc)}>{desc}</p>
      </div>
    </button>
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

function UploadIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function FigmaIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 5.5A5.5 5.5 0 0 1 10.5 0H12v7.5h-1.5A5.5 5.5 0 0 1 5 5.5z" opacity="0.6" />
      <path d="M12 0h1.5a5.5 5.5 0 1 1 0 11H12V0z" opacity="0.4" />
      <path d="M5 12a5.5 5.5 0 0 1 5.5-5.5H12v11h-1.5A5.5 5.5 0 0 1 5 12z" opacity="0.8" />
      <path d="M5 18.5A5.5 5.5 0 0 0 10.5 24 5.5 5.5 0 0 0 16 18.5a5.5 5.5 0 0 0-5.5-5.5H12v5h-1.5z" />
    </svg>
  );
}

function SalesforceIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a6.5 6.5 0 0 0-5.5 3 5 5 0 0 0-4 8 5 5 0 0 0 5 5h9a6 6 0 0 0 6-6 6 6 0 0 0-4.5-5.8A6.5 6.5 0 0 0 12 2z" />
    </svg>
  );
}

function BriefIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function BrandKitIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ChannelsIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22 6 12 13 2 6" />
    </svg>
  );
}

