"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCanvasStore } from "@/stores/canvas";
import { useBrandStore, type ToneOption } from "@/stores/brand";
import { useToolsStore } from "@/stores/tools";
import { ToolType } from "@/types/tools";
import { cn } from "@/lib/cn";
import { BlocksLayersTree } from "./sidebar/BlocksLayersTree";
import { AssetsPanel } from "./sidebar/AssetsPanel";
import { LanguageSidebarSection } from "./sidebar/LanguageSidebarSection";
import { LinkPanel } from "./tools/LinkPanel";
import { SidebarDrillChevron } from "./sidebar/SidebarDrilldownHeader";

type LeftPanelTab = "content" | "brand" | "assets" | "languages" | "links";

const panelTabs: {
  id: LeftPanelTab;
  toolId: ToolType;
  /** When false, switching tab does not clear inspector (Blocks / Brand / Assets). */
  closeInspectorOnToolChange: boolean;
  icon: React.FC<{ className?: string }>;
  label: string;
}[] = [
  { id: "content", toolId: "select", closeInspectorOnToolChange: false, icon: BlocksIcon, label: "Content" },
  { id: "brand", toolId: "select", closeInspectorOnToolChange: false, icon: BrandBrushIcon, label: "Brand" },
  { id: "assets", toolId: "select", closeInspectorOnToolChange: false, icon: ImageIcon, label: "Assets" },
  { id: "languages", toolId: "language", closeInspectorOnToolChange: true, icon: LanguageIcon, label: "Languages" },
  { id: "links", toolId: "link", closeInspectorOnToolChange: true, icon: LinkIcon, label: "Links" },
];

interface CanvasLeftPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function CanvasLeftPanel({ isOpen, onToggle }: CanvasLeftPanelProps) {
  const { title, setTitle } = useCanvasStore();
  const { setActiveTool } = useToolsStore();
  const [activeTab, setActiveTab] = useState<LeftPanelTab>("content");
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [blocksSearch, setBlocksSearch] = useState("");

  const handleSave = () => {
    setTitle(editValue);
    setIsEditing(false);
  };

  const handleTabClick = (tab: (typeof panelTabs)[number]) => {
    setActiveTab(tab.id);
    setActiveTool(tab.toolId, { closeInspector: tab.closeInspectorOnToolChange });
  };

  const currentTab = panelTabs.find((t) => t.id === activeTab)!;

  return (
    <div
      className="absolute left-2 top-2 bottom-2 flex flex-col pointer-events-auto"
      style={{ zIndex: "var(--z-panel)" }}
    >
      <div
        className={cn(
          "flex flex-col bg-[var(--surface)] border border-[var(--border)] overflow-hidden rounded",
          isOpen && "h-full w-[320px]",
          !isOpen && "w-[320px]"
        )}
      >
        <div className="flex items-center gap-2 h-[44px] px-3 border-b border-[#E5E5E5] flex-shrink-0">
          <Link
            href="/projects"
            className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-muted)] transition-colors hover:bg-[var(--background)] hover:text-[var(--text-primary)]"
            aria-label="Back to projects"
          >
            <SidebarDrillChevron className="h-4 w-4" />
          </Link>

          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="text-[13px] font-bold text-[var(--text-primary)] bg-transparent border-b border-[#0F8EFF] focus:outline-none py-0.5 min-w-0 flex-1"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-[13px] font-bold text-[var(--text-primary)] hover:text-[#0F8EFF] transition-colors truncate text-left"
            >
              {title}
            </button>
          )}

          <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] text-[13px] font-bold flex-shrink-0">
            Draft
          </span>

          <div className="flex-1 min-w-0" />

          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "w-7 h-7 rounded flex items-center justify-center transition-colors flex-shrink-0",
              isOpen
                ? "bg-[var(--background)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--text-primary)]",
            )}
            title="Toggle sidebar"
          >
            <SidebarIcon className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="flex flex-1 min-h-0"
            >
              <div className="w-10 flex flex-col items-center py-2 gap-1 border-r border-[#E5E5E5] flex-shrink-0 bg-[#FAFAFA]">
                {panelTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabClick(tab)}
                      className={cn(
                        "w-7 h-7 rounded flex items-center justify-center transition-colors",
                        isActive
                          ? "bg-[#EBF5FE] text-[#0F8EFF]"
                          : "text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--text-primary)]",
                      )}
                      title={tab.label}
                    >
                      <tab.icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="flex h-10 shrink-0 items-center border-b border-[#E5E5E5] px-3">
                  <span className="text-[13px] font-bold text-[var(--text-primary)]">
                    {currentTab.label}
                  </span>
                </div>

                {activeTab === "content" && (
                  <>
                    <div className="px-3 py-2 border-b border-[#E5E5E5] shrink-0">
                      <div className="relative">
                        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                        <input
                          type="search"
                          placeholder="Search…"
                          value={blocksSearch}
                          onChange={(e) => setBlocksSearch(e.target.value)}
                          className="w-full h-8 pl-8 pr-2 rounded bg-[var(--surface)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#0F8EFF] focus:shadow-[0_0_3px_#0F8EFF]"
                        />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3 pt-2">
                      <BlocksLayersTree searchQuery={blocksSearch} />
                    </div>
                  </>
                )}

                {activeTab === "brand" && (
                  <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3">
                    <BrandTabContent />
                  </div>
                )}

                {activeTab === "assets" && <AssetsPanel />}

                {activeTab === "languages" && (
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3">
                    <LanguageSidebarSection />
                  </div>
                )}

                {activeTab === "links" && (
                  <div className="flex-1 min-h-0 overflow-y-auto p-3 pt-2">
                    <LinkPanel />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const LP_TONE_OPTIONS: { value: ToneOption; label: string; icon: string }[] = [
  { value: "professional", label: "Professional", icon: "💼" },
  { value: "friendly", label: "Friendly", icon: "😊" },
  { value: "playful", label: "Playful", icon: "✨" },
  { value: "luxury", label: "Luxury", icon: "👑" },
  { value: "bold", label: "Bold", icon: "🔥" },
  { value: "minimal", label: "Minimal", icon: "◻️" },
  { value: "warm", label: "Warm", icon: "☀️" },
  { value: "editorial", label: "Editorial", icon: "📰" },
];

const LP_FONT_PRESETS = [
  "Salesforce Sans", "Poppins", "Inter", "Playfair Display",
  "Georgia", "Merriweather", "Roboto", "Lato", "Montserrat", "DM Sans",
];

function BrandTabContent() {
  const { colors, fonts, tones, addColor, removeColor, updateColor, addFont, removeFont, updateFont, toggleTone } = useBrandStore();
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [editingFontId, setEditingFontId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Colors</p>
          <button type="button" onClick={() => setShowColorPicker(!showColorPicker)} className="text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            {showColorPicker ? "Done" : "+ Add"}
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {colors.map((c) => (
            <div key={c.id} className="relative group">
              <button
                type="button"
                onClick={() => setEditingColorId(editingColorId === c.id ? null : c.id)}
                className={cn("w-8 h-8 rounded-lg border-2 transition-all shadow-sm", editingColorId === c.id ? "border-neutral-900 scale-110" : "border-white hover:scale-105")}
                style={{ backgroundColor: c.hex }}
                title={`${c.label} — ${c.hex}`}
              />
              {editingColorId === c.id && (
                <div className="absolute top-full left-0 mt-1 w-36 bg-[var(--surface)] rounded-lg shadow-lg border border-[var(--border)] z-20 p-2 space-y-1.5">
                  <input type="color" value={c.hex} onChange={(e) => updateColor(c.id, e.target.value)} className="w-full h-7 rounded cursor-pointer border-0" />
                  <input type="text" value={c.label} onChange={(e) => updateColor(c.id, c.hex, e.target.value)} className="w-full h-6 px-1.5 rounded bg-[var(--surface-subtle)] border border-[var(--border)] text-[13px] text-neutral-800 focus:outline-none focus:border-[var(--border)]" />
                  <button type="button" onClick={() => { removeColor(c.id); setEditingColorId(null); }} className="w-full h-6 rounded bg-red-50 text-red-500 text-[13px] font-medium hover:bg-red-100 transition-colors">Remove</button>
                </div>
              )}
            </div>
          ))}
        </div>
        {showColorPicker && (
          <div className="mt-2 flex items-center gap-2">
            <input type="color" value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 flex-shrink-0" />
            <input type="text" value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)} className="flex-1 h-7 px-2 rounded bg-[var(--surface-subtle)] border border-[var(--border)] text-[13px] text-neutral-800 font-mono focus:outline-none focus:border-[var(--border)]" placeholder="#000000" />
            <button type="button" onClick={() => { addColor(newColorHex); setNewColorHex("#000000"); }} className="h-7 px-2.5 rounded bg-neutral-900 text-white text-[13px] font-medium hover:bg-neutral-800 transition-colors flex-shrink-0">Add</button>
          </div>
        )}
      </div>

      <div className="h-px bg-[var(--surface-active)]" />

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Typography</p>
          <button type="button" onClick={() => setShowFontPicker(!showFontPicker)} className="text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            {showFontPicker ? "Done" : "+ Add"}
          </button>
        </div>
        <div className="space-y-1.5">
          {fonts.map((f) => (
            <div key={f.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--surface-subtle)] group">
              <div className="flex-1 min-w-0">
                {editingFontId === f.id ? (
                  <select value={f.name} onChange={(e) => { updateFont(f.id, { name: e.target.value }); setEditingFontId(null); }} onBlur={() => setEditingFontId(null)} autoFocus className="w-full h-6 px-1 rounded border border-[var(--border)] text-[13px] text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:border-[var(--border)]">
                    {LP_FONT_PRESETS.map((fp) => <option key={fp} value={fp}>{fp}</option>)}
                  </select>
                ) : (
                  <button type="button" onClick={() => setEditingFontId(f.id)} className="text-[13px] font-medium text-neutral-800 hover:text-[var(--text-secondary)] truncate block text-left w-full" style={{ fontFamily: f.name }}>{f.name}</button>
                )}
              </div>
              <select value={f.role} onChange={(e) => updateFont(f.id, { role: e.target.value as "headline" | "body" | "accent" })} className="h-5 px-1 rounded bg-[var(--surface)] border border-[var(--border)] text-[11px] font-semibold text-[var(--text-secondary)] uppercase focus:outline-none flex-shrink-0">
                <option value="headline">Headline</option>
                <option value="body">Body</option>
                <option value="accent">Accent</option>
              </select>
              <button type="button" onClick={() => removeFont(f.id)} className="w-4 h-4 flex items-center justify-center rounded text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">×</button>
            </div>
          ))}
        </div>
        {showFontPicker && (
          <div className="mt-2 grid grid-cols-2 gap-1">
            {LP_FONT_PRESETS.filter((fp) => !fonts.some((f) => f.name === fp)).map((fp) => (
              <button key={fp} type="button" onClick={() => { addFont(fp, "body"); setShowFontPicker(false); }} className="px-2 py-1.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-active)] hover:border-[var(--border)] transition-colors text-left truncate" style={{ fontFamily: fp }}>{fp}</button>
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-[var(--surface-active)]" />

      <div>
        <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Tone of Voice</p>
        <div className="flex flex-wrap gap-1.5">
          {LP_TONE_OPTIONS.map((t) => {
            const isActive = tones.includes(t.value);
            return (
              <button key={t.value} type="button" onClick={() => toggleTone(t.value)} className={cn("px-2.5 py-1 rounded-full text-[13px] font-medium border transition-all", isActive ? "bg-neutral-900 text-white border-neutral-900" : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-[var(--border)]")}>
                <span className="mr-1">{t.icon}</span>{t.label}
              </button>
            );
          })}
        </div>
        {tones.length > 0 && (
          <p className="mt-2 text-[13px] text-[var(--text-muted)]">
            Active: {tones.map((t) => LP_TONE_OPTIONS.find((o) => o.value === t)?.label).filter(Boolean).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

function SidebarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

function BlocksIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="4" width="16" height="5" rx="1.5" />
      <rect x="4" y="10" width="16" height="5" rx="1.5" />
      <rect x="4" y="16" width="16" height="5" rx="1.5" />
    </svg>
  );
}

function BrandBrushIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
      <path d="M7.86 16.26l-3.79 3.8a2 2 0 0 1-2.83-2.83l3.8-3.79" />
      <path d="m15.06 7.94-7.12 7.12" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function LanguageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
