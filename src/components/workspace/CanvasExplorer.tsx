"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimpleCanvasStore } from "@/stores/simple-canvas";
import { useCanvasStore } from "@/stores/canvas";
import { useBrandStore, type ToneOption } from "@/stores/brand";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ContentTypeIcon, type ContentType } from "@/components/ui/ContentTypeIcon";
import { toast } from "@/stores/toast";
import { cn } from "@/lib/cn";
import type { ChannelCard } from "@/types/simple-canvas";
import { ExplorerComplianceBar } from "@/components/regulated/ExplorerComplianceBar";

const CHANNEL_LABEL: Record<string, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

/* ── Left panel tab definitions ── */

type LeftPanelTab = "content" | "brand" | "assets" | "resources";

const panelTabs: { id: LeftPanelTab; iconSrc: string; label: string }[] = [
  { id: "content", iconSrc: "/images/blocks.png", label: "Content" },
  { id: "brand", iconSrc: "/images/brand.png", label: "Brand" },
  { id: "assets", iconSrc: "/images/assets.png", label: "Assets" },
  { id: "resources", iconSrc: "/images/link.png", label: "Grounding Documents" },
];

interface CanvasExplorerProps {
  className?: string;
  selectedChannelId?: string | null;
  onSelectChannel?: (id: string | null) => void;
}

export function CanvasExplorer({ className, selectedChannelId, onSelectChannel }: CanvasExplorerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<LeftPanelTab>("content");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const title = useCanvasStore((s) => s.title);
  const projectId = useCanvasStore((s) => s.projectId);
  const isPharmaEmailPrototype = projectId === "proj-pharma-email";
  const explorerPanelTabs = useMemo(() => panelTabs, []);
  const { selectedCardId, selectedCardIds, selectMultipleCards, zoom: zoomFn, fitToContent, resetViewport, cards } = useSimpleCanvasStore();

  useEffect(() => {
    if (!explorerPanelTabs.some((t) => t.id === activeTab)) {
      setActiveTab(explorerPanelTabs[0]!.id);
    }
  }, [explorerPanelTabs, activeTab]);

  useEffect(() => {
    if (projectId !== "proj-pharma-email") return;
    if (selectedCardId) setIsOpen(true);
  }, [projectId, selectedCardId]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const currentTab = explorerPanelTabs.find((t) => t.id === activeTab) ?? explorerPanelTabs[0]!;

  return (
    <div
      className={cn(
        "absolute left-2 top-2 flex min-w-0 max-w-[300px] flex-col pointer-events-auto",
        isPharmaEmailPrototype ? "bottom-2" : "bottom-[60px]",
        className,
      )}
      style={{
        zIndex: "var(--z-panel)",
        width: "min(300px, calc(100% - 16px))",
      }}
    >
      <div
        data-workspace-chrome="explorer"
        className={cn(
          "flex flex-col bg-[var(--surface)] rounded-xl shadow-[var(--shadow-panel)] select-none w-full",
          isOpen ? "h-full overflow-hidden" : "",
        )}
      >
        {/* Header: Cloud menu + Title */}
        <div className="flex min-w-0 items-center gap-2.5 h-[48px] pl-[7px] pr-2.5 flex-shrink-0">
          <div ref={menuRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-active)]"
              title="Menu"
            >
              <img src="/images/sf-cloud.svg" alt="Salesforce" className="h-[22px] w-[22px] dark-invert" />
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-full mt-1 w-56 rounded-lg bg-[var(--surface)] shadow-[var(--shadow-dropdown)] border border-[var(--border)] z-50 py-1 overflow-hidden">
                <CloudMenuItem label="Home" shortcut="" onClick={() => { setMenuOpen(false); window.location.href = "/"; }} />
                <CloudMenuItem label="Projects" shortcut="" onClick={() => { setMenuOpen(false); window.location.href = "/projects"; }} />
                <div className="my-1 h-px bg-[var(--border)]" />
                <CloudMenuItem label="New Project" shortcut="" onClick={() => { setMenuOpen(false); }} />
                <CloudMenuItem label="Delete Project" shortcut="" onClick={() => { setMenuOpen(false); }} />
                <CloudMenuItem label="Duplicate Project" shortcut="" onClick={() => { setMenuOpen(false); }} />
                <div className="my-1 h-px bg-[var(--border)]" />
                <CloudMenuItem label="Undo" shortcut="⌘ Z" onClick={() => { setMenuOpen(false); }} />
                <CloudMenuItem label="Redo" shortcut="⌘ ⇧ Z" onClick={() => { setMenuOpen(false); }} />
                <CloudMenuItem
                  label="Duplicate Selection"
                  shortcut="⌘ D"
                  disabled={selectedCardIds.length === 0}
                  onClick={() => { setMenuOpen(false); }}
                />
                <div className="my-1 h-px bg-[var(--border)]" />
                <CloudMenuItem label="Zoom to Fit" shortcut="⇧ 1" onClick={() => { fitToContent(); setMenuOpen(false); }} />
                <CloudMenuItem label="Zoom In" shortcut="⌘ +" onClick={() => { zoomFn(0.1); setMenuOpen(false); }} />
                <CloudMenuItem label="Zoom Out" shortcut="⌘ −" onClick={() => { zoomFn(-0.1); setMenuOpen(false); }} />
                <CloudMenuItem label="Reset Zoom" shortcut="⌘ 0" onClick={() => { resetViewport(); setMenuOpen(false); }} />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            title={title}
            className="min-w-0 flex-1 truncate text-left text-[13px] font-semibold tracking-[-0.01em] text-[var(--text-primary)] transition-colors hover:text-[var(--text-secondary)] cursor-pointer"
          >
            {title}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
              isOpen
                ? "bg-[var(--surface-active)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)]",
            )}
            title="Toggle sidebar"
          >
            <PanelIcon className="w-[18px] h-[18px]" />
          </button>
        </div>

        <ExplorerComplianceBar />

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-1 min-h-0 border-t border-[var(--border)]"
            >
              <div className="w-11 flex flex-col items-center py-2 gap-1 border-r border-[var(--border)] flex-shrink-0">
                {explorerPanelTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150",
                        isActive
                          ? "bg-[var(--surface-active)] text-[var(--text-primary)] ring-1 ring-[var(--border)]"
                          : "text-[var(--text-muted)] hover:bg-[var(--surface-active)] hover:text-[var(--text-secondary)]",
                      )}
                      title={tab.label}
                    >
                      <img src={tab.iconSrc} alt={tab.label} className={cn("w-[20px] h-[20px] dark-invert", isActive ? "opacity-100" : "opacity-40")} />
                    </button>
                  );
                })}
              </div>

              {/* Tab content area */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Tab header */}
                <div className="flex h-10 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
                  <span className="text-[13px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
                    {currentTab.label}
                  </span>
                  {activeTab === "content" ? (
                    <AddBlockDropdown />
                  ) : (
                    <button
                      type="button"
                      className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-secondary)]"
                      title={`Add ${currentTab.label.toLowerCase()}`}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {activeTab === "content" && (
                  <ChannelTreeTab
                    search={search}
                    setSearch={setSearch}
                    selectedChannelId={selectedChannelId ?? null}
                    onSelectChannel={onSelectChannel}
                  />
                )}

                {activeTab === "brand" && (
                  <div className="flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-hide p-3">
                    <BrandTabContent />
                  </div>
                )}

                {activeTab === "assets" && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <AssetsTabContent />
                  </div>
                )}


                {activeTab === "resources" && (
                  <div className="flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-hide">
                    <ResourcesTabContent />
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

/* ── Channel tree row: default shows status; hover shows delete + visibility (spec) ── */

function CardRowStatusActions({
  status,
  isHidden,
  onToggleVisibility,
  onRemove,
}: {
  status: string;
  isHidden: boolean;
  onToggleVisibility: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="relative ml-auto flex h-7 min-w-0 shrink-0 items-center justify-end">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-end gap-[4px] opacity-0 transition-opacity duration-150 group-hover/card:pointer-events-auto group-hover/card:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded p-[4px] text-[var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-400"
          title="Remove"
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className={cn(
            "rounded p-[4px] transition-colors",
            isHidden ? "text-[var(--text-secondary)] hover:text-[var(--text-secondary)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]",
          )}
          title={isHidden ? "Show on canvas" : "Hide from canvas"}
        >
          {isHidden ? <EyeOffIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div
        className={cn(
          "relative flex items-center justify-end gap-[4px] opacity-100 transition-opacity duration-150",
          "group-hover/card:pointer-events-none group-hover/card:opacity-0",
        )}
      >
        {isHidden && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility();
            }}
            className="rounded p-[4px] text-neutral-400 transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-secondary)]"
            title="Show on canvas"
          >
            <EyeOffIcon className="h-3.5 w-3.5" />
          </button>
        )}
        <StatusBadge status={status} size="xs" />
      </div>
    </div>
  );
}

/* ── Channel Tree (canvas mode) ── */

function ChannelTreeTab({
  search,
  setSearch,
  selectedChannelId,
  onSelectChannel,
}: {
  search: string;
  setSearch: (v: string) => void;
  selectedChannelId: string | null;
  onSelectChannel?: (id: string | null) => void;
}) {
  const {
    cards, selectedCardId, selectedCardIds, selectedVariantId,
    selectCard, selectVariant, toggleCardSelection, selectMultipleCards, updateCard, focusCard,
    hiddenCardIds, hiddenChannels, toggleCardVisibility, toggleChannelVisibility,
    addVariant, removeCard, duplicateCard,
    cardGroups, hiddenGroupIds, createGroup, renameGroup, removeGroup, toggleGroupVisibility, selectGroup, focusGroup,
    selectedGroupId,
  } = useSimpleCanvasStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupValue, setEditGroupValue] = useState("");

  // Auto-expand group when a card inside it is selected from the canvas
  useEffect(() => {
    if (!selectedCardId) return;
    const parentGroup = cardGroups.find((g) => g.cardIds.includes(selectedCardId));
    if (parentGroup && !expandedGroups.has(parentGroup.id)) {
      setExpandedGroups((prev) => new Set(prev).add(parentGroup.id));
    }
    // Auto-expand variants if the selected card has them
    const card = cards.find((c) => c.id === selectedCardId);
    if (card && (card.variants?.length ?? 0) > 0) {
      setExpandedVariants((prev) => {
        if (prev.has(selectedCardId)) return prev;
        return new Set([selectedCardId]);
      });
    }
  }, [selectedCardId, cardGroups, cards]);

  // Auto-expand group when selectedGroupId changes (group selected on canvas)
  useEffect(() => {
    if (selectedGroupId && !expandedGroups.has(selectedGroupId)) {
      setExpandedGroups((prev) => new Set(prev).add(selectedGroupId));
    }
  }, [selectedGroupId]);

  // Scroll the selected item into view in the left panel
  useEffect(() => {
    const id = selectedCardId || selectedGroupId;
    if (!id) return;
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-panel-id="${id}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, [selectedCardId, selectedGroupId]);

  // Context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; cardId: string } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) setContextMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [contextMenu]);

  // Cmd/Ctrl+G to group selected blocks
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "g") {
        e.preventDefault();
        const ids = useSimpleCanvasStore.getState().selectedCardIds;
        if (ids.length > 1) {
          const groups = useSimpleCanvasStore.getState().cardGroups;
          const name = `Group ${groups.length + 1}`;
          createGroup(name, ids);
          toast.success(`Created "${name}" with ${ids.length} content`);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [createGroup]);

  const [filterOpen, setFilterOpen] = useState(false);
  const [activeStatuses, setActiveStatuses] = useState<string[]>([]);
  const [activeChannels, setActiveChannels] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterOpen]);

  const allStatuses = useMemo(() => Array.from(new Set(cards.map((c) => c.status))).sort(), [cards]);
  const allChannels = useMemo(() => Array.from(new Set(cards.map((c) => c.channel))).sort(), [cards]);
  const allTags = useMemo(() => Array.from(new Set(cards.flatMap((c) => c.tags ?? []))).sort(), [cards]);

  const toggleStatus = useCallback((s: string) => {
    setActiveStatuses((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }, []);
  const toggleChannel = useCallback((c: string) => {
    setActiveChannels((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }, []);
  const toggleTag = useCallback((t: string) => {
    setActiveTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }, []);

  const hasFilters = activeStatuses.length > 0 || activeChannels.length > 0 || activeTags.length > 0;

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    return cards.filter((card) => {
      if (q && !card.title.toLowerCase().includes(q) && !card.channel.toLowerCase().includes(q)) return false;
      if (activeStatuses.length > 0 && !activeStatuses.includes(card.status)) return false;
      if (activeChannels.length > 0 && !activeChannels.includes(card.channel)) return false;
      if (activeTags.length > 0 && !activeTags.some((t) => card.tags?.includes(t))) return false;
      return true;
    });
  }, [cards, q, activeStatuses, activeChannels, activeTags]);

  return (
    <>
      {/* Search */}
      <div className="px-3 pb-2 pt-5 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="search"
              placeholder="Search content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border)] focus:bg-[var(--surface-elevated)]"
            />
          </div>
          <div ref={filterRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setFilterOpen(!filterOpen)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors flex-shrink-0",
                hasFilters
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:bg-[var(--surface-active)] hover:text-[var(--text-secondary)]",
              )}
              title="Filter"
            >
              <img src="/images/filters.png" alt="Filter" className={cn("w-3.5 h-3.5 dark-invert", hasFilters ? "opacity-100 invert" : "opacity-40")} />
            </button>
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1.5 w-[220px] rounded-lg bg-[var(--surface)] shadow-[var(--shadow-dropdown)] border border-[var(--border)] z-50 overflow-hidden"
                >
                  <div className="px-3 pt-2.5 pb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Filters</span>
                    {hasFilters && (
                      <button
                        type="button"
                        onClick={() => { setActiveStatuses([]); setActiveChannels([]); setActiveTags([]); }}
                        className="text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="px-3 pb-2">
                    <p className="text-[13px] font-semibold text-[var(--text-muted)] mb-1.5">Status</p>
                    <div className="flex flex-wrap gap-1">
                      {allStatuses.map((s) => {
                        const isActive = activeStatuses.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleStatus(s)}
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[13px] font-medium border transition-colors",
                              isActive
                                ? "bg-neutral-900 text-white border-neutral-900"
                                : "bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-active)]",
                            )}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="h-px bg-[var(--border)]" />

                  <div className="px-3 pt-2 pb-2">
                    <p className="text-[13px] font-semibold text-[var(--text-muted)] mb-1.5">Content Type</p>
                    <div className="flex flex-wrap gap-1">
                      {allChannels.map((c) => {
                        const isActive = activeChannels.includes(c);
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => toggleChannel(c)}
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[13px] font-medium border transition-colors",
                              isActive
                                ? "bg-neutral-900 text-white border-neutral-900"
                                : "bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-active)]",
                            )}
                          >
                            {CHANNEL_LABEL[c] ?? c}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="h-px bg-[var(--border)]" />

                  <div className="px-3 pt-2 pb-2.5">
                    <p className="text-[13px] font-semibold text-[var(--text-muted)] mb-1.5">Tags</p>
                    <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto">
                      {allTags.map((t) => {
                        const isActive = activeTags.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleTag(t)}
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[13px] font-medium border transition-colors",
                              isActive
                                ? "bg-neutral-900 text-white border-neutral-900"
                                : "bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-active)]",
                            )}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {hasFilters && (
          <div className="px-3 pt-1.5 pb-1 flex flex-wrap gap-1">
            {activeStatuses.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--surface-active)] text-[13px] font-medium text-[var(--text-secondary)]">
                {s.charAt(0).toUpperCase() + s.slice(1)}
                <button type="button" onClick={() => toggleStatus(s)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">&times;</button>
              </span>
            ))}
            {activeChannels.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--surface-active)] text-[13px] font-medium text-[var(--text-secondary)]">
                {CHANNEL_LABEL[c] ?? c}
                <button type="button" onClick={() => toggleChannel(c)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">&times;</button>
              </span>
            ))}
            {activeTags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--surface-active)] text-[13px] font-medium text-[var(--text-secondary)]">
                #{t}
                <button type="button" onClick={() => toggleTag(t)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Channel list — grouped by channel type */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        {cards.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[13px] text-[var(--text-muted)]">No channels on the canvas yet.</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-[var(--text-muted)]">No results match your search.</p>
        ) : (
          <div className="space-y-[4px] p-[4px]">
            {/* ── User-defined groups ── */}
            {cardGroups.filter((g) => g.cardIds.some((cid) => filtered.some((c) => c.id === cid))).map((group) => {
              const groupCards = group.cardIds.map((cid) => filtered.find((c) => c.id === cid)).filter(Boolean) as typeof filtered;
              if (groupCards.length === 0) return null;
              const isGroupHidden = hiddenGroupIds.has(group.id);
              const visibleCount = groupCards.filter((c) => !hiddenCardIds.has(c.id)).length;
              const isGroupEditing = editingGroupId === group.id;
              const isGroupExpanded = expandedGroups.has(group.id);
              const isGroupSelected = selectedGroupId === group.id;

              return (
                <div key={group.id} className="mb-1" data-panel-id={group.id}>
                  <div
                    className={cn(
                      "group/section flex cursor-pointer items-center gap-[4px] rounded-lg p-[4px] transition-colors",
                      isGroupSelected ? "bg-[var(--surface-active)] shadow-sm" : "hover:bg-[var(--surface-hover)]",
                    )}
                    onClick={() => {
                      setExpandedGroups((prev) => {
                        const next = new Set(prev);
                        if (next.has(group.id)) next.delete(group.id);
                        else next.add(group.id);
                        return next;
                      });
                      selectGroup(group.id);
                      focusGroup(group.id);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      selectGroup(group.id);
                    }}
                  >
                    <ChevronRightIcon className={cn("w-3 h-3 text-[var(--text-muted)] flex-shrink-0 transition-transform", isGroupExpanded && "rotate-90")} />
                    <FolderIcon className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />
                    {isGroupEditing ? (
                      <input
                        autoFocus
                        type="text"
                        value={editGroupValue}
                        onChange={(e) => setEditGroupValue(e.target.value)}
                        onBlur={() => {
                          if (editGroupValue.trim()) renameGroup(group.id, editGroupValue.trim());
                          setEditingGroupId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { if (editGroupValue.trim()) renameGroup(group.id, editGroupValue.trim()); setEditingGroupId(null); }
                          else if (e.key === "Escape") setEditingGroupId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-0 h-5 px-1 rounded bg-[var(--surface)] border border-[var(--border)] text-[13px] font-semibold text-[var(--text-secondary)] outline-none focus:border-[var(--border)]"
                      />
                    ) : (
                      <span
                        className="text-[13px] font-semibold text-[var(--text-secondary)] flex-1 cursor-pointer truncate"
                        onDoubleClick={(e) => { e.stopPropagation(); setEditingGroupId(group.id); setEditGroupValue(group.name); }}
                      >
                        {group.name}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleGroupVisibility(group.id); }}
                      className={cn(
                        "p-0.5 rounded transition-colors",
                        isGroupHidden
                          ? "text-neutral-300 hover:text-[var(--text-secondary)]"
                          : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] opacity-0 group-hover/section:opacity-100",
                        isGroupHidden && "opacity-100",
                      )}
                      title={isGroupHidden ? "Show group" : "Hide group"}
                    >
                      {isGroupHidden ? <EyeOffIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeGroup(group.id); }}
                      className="p-0.5 rounded text-neutral-300 hover:text-[var(--text-secondary)] opacity-0 group-hover/section:opacity-100 transition-colors"
                      title="Ungroup"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="8" height="8" rx="1" />
                        <rect x="14" y="14" width="8" height="8" rx="1" />
                        <path d="M14 2h6a2 2 0 0 1 2 2v6" />
                        <path d="M2 14v6a2 2 0 0 0 2 2h6" />
                      </svg>
                    </button>
                  </div>

                  {isGroupExpanded && (
                    <div className="ml-1 mt-1 space-y-[4px] border-l-2 border-[var(--border)] pl-1">
                        {groupCards.map((card) => {
                          const isCardActive = selectedCardIds.includes(card.id) || selectedChannelId === card.id;
                          const isHidden = hiddenCardIds.has(card.id);
                          return (
                            <div
                              key={card.id}
                              data-panel-id={card.id}
                              className={cn(isHidden && "opacity-40")}
                            >
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (e.metaKey || e.ctrlKey) toggleCardSelection(card.id);
                                  else { selectCard(card.id); focusCard(card.id); }
                                  onSelectChannel?.(card.id);
                                }}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  if (!selectedCardIds.includes(card.id)) selectCard(card.id);
                                  setContextMenu({ x: e.clientX, y: e.clientY, cardId: card.id });
                                }}
                                className={cn(
                                  "group/card flex w-full cursor-pointer items-center gap-[4px] rounded-lg p-[4px] text-left transition-colors duration-150",
                                  isCardActive ? "bg-[var(--surface-active)] shadow-sm" : "hover:bg-[var(--surface-hover)]",
                                )}
                              >
                                <ContentTypeIcon type={card.channel} size="sm" />
                                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--text-primary)]">
                                  {card.title}
                                </span>
                                <CardRowStatusActions
                                  status={card.status}
                                  isHidden={isHidden}
                                  onToggleVisibility={() => toggleCardVisibility(card.id)}
                                  onRemove={() => removeCard(card.id)}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}

            {(() => {
              const groupedCardIds = new Set(cardGroups.flatMap((g) => g.cardIds));
              const ungroupedFiltered = filtered.filter((c) => !groupedCardIds.has(c.id));

              return ungroupedFiltered.map((card) => {
                          const isCardActive = selectedCardIds.includes(card.id) || selectedChannelId === card.id;
                          const isEditing = editingId === card.id;
                          const isHidden = hiddenCardIds.has(card.id);
                          const subtitle = card.channel === "email" ? card.subjectLine : undefined;
                          const hasVariants = (card.variants?.length ?? 0) > 0;
                          const isExpanded = expandedVariants.has(card.id);

                          const handleCardClick = (e: React.MouseEvent) => {
                            if (e.shiftKey) {
                              const lastId = selectedCardIds.length > 0 ? selectedCardIds[selectedCardIds.length - 1] : null;
                              const allCards = filtered;
                              const lastIdx = lastId ? allCards.findIndex((c) => c.id === lastId) : -1;
                              const curIdx = allCards.findIndex((c) => c.id === card.id);
                              if (lastIdx >= 0 && curIdx >= 0) {
                                const from = Math.min(lastIdx, curIdx);
                                const to = Math.max(lastIdx, curIdx);
                                const rangeIds = allCards.slice(from, to + 1).map((c) => c.id);
                                const merged = Array.from(new Set([...selectedCardIds, ...rangeIds]));
                                selectMultipleCards(merged);
                              } else {
                                toggleCardSelection(card.id);
                              }
                            } else if (e.metaKey || e.ctrlKey) {
                              toggleCardSelection(card.id);
                            } else {
                              selectCard(card.id);
                              focusCard(card.id);
                              setExpandedVariants(hasVariants ? new Set([card.id]) : new Set());
                            }
                            onSelectChannel?.(card.id);
                          };

                          return (
                            <div key={card.id} data-panel-id={card.id} className={cn(isHidden && "opacity-40")}>
                              <div
                                onClick={handleCardClick}
                                onDoubleClick={() => {
                                  setEditingId(card.id);
                                  setEditValue(card.title);
                                }}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  if (!selectedCardIds.includes(card.id)) selectCard(card.id);
                                  setContextMenu({ x: e.clientX, y: e.clientY, cardId: card.id });
                                }}
                                className={cn(
                                  "group/card flex w-full cursor-pointer items-center gap-[4px] rounded-lg p-[4px] text-left transition-colors duration-150",
                                  isCardActive
                                    ? "bg-[var(--surface-active)] shadow-sm"
                                    : "hover:bg-[var(--surface-hover)]",
                                )}
                              >
                                <div
                                  className="relative flex-shrink-0 mt-0.5 self-start"
                                  onClick={hasVariants ? (e) => {
                                    e.stopPropagation();
                                    setExpandedVariants((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(card.id)) next.delete(card.id);
                                      else next.add(card.id);
                                      return next;
                                    });
                                  } : undefined}
                                  style={hasVariants ? { cursor: "pointer" } : undefined}
                                >
                                  <ContentTypeIcon type={card.channel} size="sm" />
                                  {hasVariants && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[#0F8EFF] text-white text-[11px] font-bold leading-none px-1">
                                      {card.variants!.length + 1}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  {isEditing ? (
                                    <input
                                      autoFocus
                                      type="text"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onBlur={() => {
                                        if (editValue.trim()) updateCard(card.id, { title: editValue.trim() });
                                        setEditingId(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          if (editValue.trim()) updateCard(card.id, { title: editValue.trim() });
                                          setEditingId(null);
                                        } else if (e.key === "Escape") {
                                          setEditingId(null);
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-full h-6 px-1 -ml-1 rounded bg-[var(--surface)] border border-[var(--border)] text-[13px] font-medium text-[var(--text-primary)] outline-none focus:border-[var(--border)]"
                                    />
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <span className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                                        {card.title}
                                      </span>
                                    </div>
                                  )}
                                  {subtitle && !isEditing && (
                                    <span className="block truncate text-[13px] text-[var(--text-secondary)]">{subtitle}</span>
                                  )}
                                </div>
                                <CardRowStatusActions
                                  status={card.status}
                                  isHidden={isHidden}
                                  onToggleVisibility={() => toggleCardVisibility(card.id)}
                                  onRemove={() => removeCard(card.id)}
                                />
                              </div>

                              {hasVariants && isExpanded && (
                                <div className="ml-1 mt-1 mb-1 space-y-[4px] border-l-2 border-[var(--border)] pl-1">
                                  <div
                                    className={cn(
                                      "flex cursor-pointer items-center gap-[4px] rounded-md p-[4px] text-[13px] transition-colors",
                                      isCardActive && !selectedVariantId ? "selected-row font-medium" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]",
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      selectCard(card.id);
                                      focusCard(card.id);
                                      onSelectChannel?.(card.id);
                                    }}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F8EFF] flex-shrink-0" />
                                    <span className="truncate flex-1">Default</span>
                                    <StatusBadge status={card.status} size="xs" className="ml-auto" />
                                  </div>
                                  {card.variants!.map((v) => {
                                    const isVariantActive = isCardActive && selectedVariantId === v.id;
                                    return (
                                      <div
                                        key={v.id}
                                        className={cn(
                                          "flex cursor-pointer items-center gap-[4px] rounded-md p-[4px] text-[13px] transition-colors",
                                          isVariantActive ? "selected-row font-medium" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]",
                                        )}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          selectVariant(card.id, v.id);
                                          focusCard(card.id);
                                          onSelectChannel?.(card.id);
                                        }}
                                      >
                                        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", isVariantActive ? "bg-[#0F8EFF]" : "bg-neutral-300")} />
                                        <span className="truncate flex-1">{v.label}</span>
                                        <StatusBadge status={v.status} size="xs" className="ml-auto" />
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
              });
            })()}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-[300] min-w-[180px] rounded-lg bg-[var(--surface)] shadow-[var(--shadow-dropdown)] border border-[var(--border)] py-1 overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <ContextMenuItem
            label="Rename"
            shortcut="Dbl-click"
            onClick={() => {
              const card = cards.find((c) => c.id === contextMenu.cardId);
              if (card) { setEditingId(card.id); setEditValue(card.title); }
              setContextMenu(null);
            }}
          />
          <ContextMenuItem
            label="Duplicate"
            shortcut="⌘D"
            onClick={() => {
              duplicateCard(contextMenu.cardId);
              setContextMenu(null);
            }}
          />
          <ContextMenuItem
            label="Add Variant"
            onClick={() => {
              addVariant(contextMenu.cardId);
              setExpandedVariants((prev) => new Set(prev).add(contextMenu.cardId));
              setContextMenu(null);
            }}
          />
          <div className="mx-2 my-1 border-t border-[var(--border)]" />
          {selectedCardIds.length > 1 && (
            <ContextMenuItem
              label={`Group ${selectedCardIds.length} Content`}
              shortcut="⌘G"
              onClick={() => {
                const name = `Group ${cardGroups.length + 1}`;
                createGroup(name, selectedCardIds);
                toast.success(`Created "${name}" with ${selectedCardIds.length} content`);
                setContextMenu(null);
              }}
            />
          )}
          {(() => {
            const group = cardGroups.find((g) => g.cardIds.includes(contextMenu.cardId));
            if (group) return (
              <ContextMenuItem
                label={`Remove from "${group.name}"`}
                onClick={() => {
                  useSimpleCanvasStore.getState().removeFromGroup(group.id, [contextMenu.cardId]);
                  setContextMenu(null);
                }}
              />
            );
            return null;
          })()}
          <ContextMenuItem
            label="Delete"
            destructive
            onClick={() => {
              removeCard(contextMenu.cardId);
              setContextMenu(null);
            }}
          />
        </div>
      )}
    </>
  );
}

/* ── Add Block Dropdown (header button) ── */

function AddBlockDropdown() {
  const { cards, addCard, selectCard, focusCard } = useSimpleCanvasStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAdd = (channel: "email" | "sms") => {
    const id = `${channel}-blank-${Date.now()}`;
    const channelCards = cards.filter((c) => c.channel === channel);
    const maxX = channelCards.reduce((mx, c) => Math.max(mx, c.position.x + c.size.width), 80);
    const avgY = channelCards.length > 0
      ? channelCards.reduce((sum, c) => sum + c.position.y, 0) / channelCards.length
      : 80;

    const emailElements = [
      { id: `${id}-logo`, type: "image" as const, content: "Logo", imageData: { src: "/images/ws/logo.png", alt: "Williams Sonoma", fit: "contain" as const } },
      { id: `${id}-hero`, type: "image" as const, content: "Add Image", imageData: { src: "", alt: "Hero image placeholder", fit: "cover" as const } },
      { id: `${id}-h1`, type: "headline" as const, content: "Your Headline Here" },
      { id: `${id}-body`, type: "body" as const, content: "Write your email copy here. Describe your offer, tell a story, or share an update with your audience." },
      { id: `${id}-cta`, type: "cta" as const, content: "Call to Action" },
    ];

    const smsElements = [
      { id: `${id}-body`, type: "body" as const, content: "WILLIAMS SONOMA: Your SMS message here. Keep it short and include a clear call to action with a link." },
      { id: `${id}-cta`, type: "cta" as const, content: "Reply STOP to opt out" },
    ];

    const emailCount = cards.filter((c) => c.channel === "email").length;
    const smsCount = cards.filter((c) => c.channel === "sms").length;

    addCard({
      id,
      channel,
      title: channel === "email" ? `New Email ${emailCount + 1}` : `New SMS ${smsCount + 1}`,
      status: "draft",
      position: { x: maxX + 40, y: avgY },
      size: channel === "email" ? { width: 360, height: 480 } : { width: 320, height: 280 },
      elements: channel === "email" ? emailElements : smsElements,
    });
    selectCard(id);
    focusCard(id);
    setOpen(false);
    toast.success(`New ${channel === "email" ? "Email" : "SMS"} added to canvas`);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-secondary)]"
        title="Add block"
      >
        <PlusIcon className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 rounded-lg bg-[var(--surface)] shadow-[var(--shadow-dropdown)] border border-[var(--border)] z-20 py-1 overflow-hidden">
          <button
            type="button"
            onClick={() => handleAdd("email")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--surface-hover)] transition-colors"
          >
            <ContentTypeIcon type="email" size="sm" />
            <span className="text-[13px] font-medium text-[var(--text-primary)]">Email</span>
          </button>
          <button
            type="button"
            onClick={() => handleAdd("sms")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--surface-hover)] transition-colors"
          >
            <ContentTypeIcon type="sms" size="sm" />
            <span className="text-[13px] font-medium text-[var(--text-primary)]">SMS</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Cloud Menu Item ── */

function CloudMenuItem({ label, shortcut, onClick, disabled }: { label: string; shortcut: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 text-left transition-colors",
        disabled ? "opacity-40 cursor-default" : "hover:bg-[var(--surface-hover)]",
      )}
    >
      <span className="text-[13px] font-medium text-[var(--text-primary)]">{label}</span>
      {shortcut && <span className="text-[13px] text-[var(--text-muted)] ml-4 flex-shrink-0">{shortcut}</span>}
    </button>
  );
}


/* ── Context Menu Item ── */

function ContextMenuItem({ label, shortcut, onClick, destructive }: { label: string; shortcut?: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors",
        destructive ? "text-red-400 hover:bg-red-500/10" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]",
      )}
    >
      <span className="text-[13px] font-medium">{label}</span>
      {shortcut && <span className="text-[13px] text-[var(--text-muted)] ml-4 flex-shrink-0">{shortcut}</span>}
    </button>
  );
}

/* ── Icons ── */

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function SalesforceCloudIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 16" fill="currentColor" aria-hidden>
      <path d="M10.05 1.4a5.07 5.07 0 0 1 4.45 2.63 4.2 4.2 0 0 1 1.82-.42 4.28 4.28 0 0 1 4.28 4.28c0 .14 0 .28-.02.42A3.35 3.35 0 0 1 22.8 11a3.36 3.36 0 0 1-3.37 3.36H5.28a3.93 3.93 0 0 1-3.93-3.93 3.93 3.93 0 0 1 2.7-3.74 4.5 4.5 0 0 1-.05-.66A4.63 4.63 0 0 1 8.63 1.4c.49 0 .97.08 1.42.22z" />
    </svg>
  );
}

function PanelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}


/* ── Tab Icons ── */

function BlocksTabIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="5" rx="1.5" />
      <rect x="4" y="10" width="16" height="5" rx="1.5" />
      <rect x="4" y="16" width="16" height="5" rx="1.5" />
    </svg>
  );
}

function BrandBrushIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10a3 3 0 0 1-3-3c0-.78.3-1.5.8-2.03a1 1 0 0 0-.8-1.97H7a8 8 0 0 1-5-14.7A9.94 9.94 0 0 1 12 2z" />
      <circle cx="7.5" cy="11.5" r="1.5" />
    </svg>
  );
}

function AssetsImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function LanguageTabIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  );
}

function LinkTabIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

/* ── Tab Content ── */

const TONE_OPTIONS: { value: ToneOption; label: string; icon: string }[] = [
  { value: "professional", label: "Professional", icon: "💼" },
  { value: "friendly", label: "Friendly", icon: "😊" },
  { value: "playful", label: "Playful", icon: "✨" },
  { value: "luxury", label: "Luxury", icon: "👑" },
  { value: "bold", label: "Bold", icon: "🔥" },
  { value: "minimal", label: "Minimal", icon: "◻️" },
  { value: "warm", label: "Warm", icon: "☀️" },
  { value: "editorial", label: "Editorial", icon: "📰" },
];

const FONT_PRESETS = [
  "Salesforce Sans",
  "Poppins",
  "Inter",
  "Playfair Display",
  "Georgia",
  "Merriweather",
  "Roboto",
  "Lato",
  "Montserrat",
  "DM Sans",
];

function BrandTabContent() {
  const { colors, fonts, tones, addColor, removeColor, updateColor, addFont, removeFont, updateFont, toggleTone } = useBrandStore();
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [editingFontId, setEditingFontId] = useState<string | null>(null);

  const [showComplianceDetails, setShowComplianceDetails] = useState(false);

  const complianceScore = 95;
  const complianceIssues = [
    { id: "1", block: "Limited Time Sale", issue: "CTA button uses non-brand color (#FF5733)", severity: "high" as const },
    { id: "2", block: "Pantry Essentials", issue: "Body font falls back to system sans-serif", severity: "medium" as const },
    { id: "3", block: "SMS — Flash Sale", issue: "Tone is more aggressive than brand guidelines", severity: "low" as const },
  ];

  return (
    <div className="space-y-4">
      {/* ── Brand Compliance ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Brand Compliance</p>
          <span className={cn(
            "text-[13px] font-bold tabular-nums",
            complianceScore >= 90 ? "text-emerald-500" : complianceScore >= 70 ? "text-amber-500" : "text-red-500",
          )}>
            {complianceScore}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[var(--surface-active)] overflow-hidden mb-2">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              complianceScore >= 90 ? "bg-emerald-500" : complianceScore >= 70 ? "bg-amber-500" : "bg-red-500",
            )}
            style={{ width: `${complianceScore}%` }}
          />
        </div>
        <p className="text-[13px] text-[var(--text-muted)] mb-3">
          {complianceIssues.length} inconsistenc{complianceIssues.length === 1 ? "y" : "ies"} found
        </p>

        <button
          type="button"
          onClick={() => setShowComplianceDetails(true)}
          className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Inspect &amp; Fix
        </button>

        {/* Compliance popup */}
        <AnimatePresence>
          {showComplianceDetails && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-[500]"
                onClick={() => setShowComplianceDetails(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-h-[80vh] bg-[var(--surface)] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-[var(--border)] z-[501] flex flex-col overflow-hidden"
              >
                {/* Popup header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
                  <div>
                    <h3 className="text-[15px] font-bold text-[var(--text-primary)]">Brand Compliance</h3>
                    <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
                      {complianceIssues.length} inconsistenc{complianceIssues.length === 1 ? "y" : "ies"} to review
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[15px] font-bold tabular-nums",
                      complianceScore >= 90 ? "text-emerald-500" : complianceScore >= 70 ? "text-amber-500" : "text-red-500",
                    )}>
                      {complianceScore}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowComplianceDetails(false)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="px-5 pt-4 pb-2 shrink-0">
                  <div className="w-full h-2 rounded-full bg-[var(--surface-active)] overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        complianceScore >= 90 ? "bg-emerald-500" : complianceScore >= 70 ? "bg-amber-500" : "bg-red-500",
                      )}
                      style={{ width: `${complianceScore}%` }}
                    />
                  </div>
                </div>

                {/* Issues list */}
                <div className="flex-1 overflow-y-auto min-h-0 px-5 py-3 space-y-1">
                  {complianceIssues.map((issue) => (
                    <div key={issue.id} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface-active)] transition-colors">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0",
                        issue.severity === "high" ? "bg-red-500" : issue.severity === "medium" ? "bg-amber-500" : "bg-neutral-400",
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[13px] font-semibold text-[var(--text-primary)]">{issue.block}</p>
                          <span className={cn(
                            "text-[11px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full",
                            issue.severity === "high" ? "bg-red-500/10 text-red-400" : issue.severity === "medium" ? "bg-amber-500/10 text-amber-400" : "bg-[var(--surface-active)] text-[var(--text-secondary)]",
                          )}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-[13px] text-[var(--text-muted)] leading-snug">{issue.issue}</p>
                      </div>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg bg-[#0F8EFF] text-[13px] font-semibold text-white hover:bg-[#0D7DE6] transition-colors flex-shrink-0"
                      >
                        Fix
                      </button>
                    </div>
                  ))}
                </div>

                {/* Popup footer */}
                <div className="px-5 py-3 border-t border-[var(--border)] shrink-0 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowComplianceDetails(false)}
                    className="px-4 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="px-4 h-9 rounded-lg bg-[#0F8EFF] text-[13px] font-semibold text-white hover:bg-[#0D7DE6] transition-colors"
                  >
                    Fix All Issues
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-[var(--border)]" />

      {/* ── Brand Colors ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Colors</p>
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            {showColorPicker ? "Done" : "+ Add"}
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {colors.map((c) => (
            <div key={c.id} className="relative group">
              <button
                type="button"
                onClick={() => setEditingColorId(editingColorId === c.id ? null : c.id)}
                className={cn(
                  "w-8 h-8 rounded-lg border-2 transition-all shadow-sm",
                  editingColorId === c.id ? "border-neutral-900 scale-110" : "border-white hover:scale-105",
                )}
                style={{ backgroundColor: c.hex }}
                title={`${c.label} — ${c.hex}`}
              />
              {editingColorId === c.id && (
                <div className="absolute top-full left-0 mt-1 w-36 bg-[var(--surface)] rounded-lg shadow-lg border border-[var(--border)] z-20 p-2 space-y-1.5">
                  <input
                    type="color"
                    value={c.hex}
                    onChange={(e) => updateColor(c.id, e.target.value)}
                    className="w-full h-7 rounded cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={c.label}
                    onChange={(e) => updateColor(c.id, c.hex, e.target.value)}
                    className="w-full h-6 px-1.5 rounded bg-[var(--surface-subtle)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border)]"
                  />
                  <button
                    type="button"
                    onClick={() => { removeColor(c.id); setEditingColorId(null); }}
                    className="w-full h-6 rounded bg-red-500/10 text-red-400 text-[13px] font-medium hover:bg-red-500/20 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {showColorPicker && (
          <div className="mt-2 flex items-center gap-2">
            <label
              className="w-8 h-8 rounded-lg border-2 border-white shadow-sm cursor-pointer flex-shrink-0 relative overflow-hidden"
              style={{ backgroundColor: newColorHex }}
            >
              <input
                type="color"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
            <input
              type="text"
              value={newColorHex}
              onChange={(e) => setNewColorHex(e.target.value)}
              className="flex-1 h-7 px-2 rounded bg-[var(--surface-subtle)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--border)]"
              placeholder="#000000"
            />
            <button
              type="button"
              onClick={() => { addColor(newColorHex); setNewColorHex("#000000"); }}
              className="h-7 px-2.5 rounded-lg bg-[#0F8EFF] text-white text-[13px] font-medium hover:bg-[#0D7DE6] transition-colors flex-shrink-0"
            >
              Add
            </button>
          </div>
        )}
      </div>

      <div className="h-px bg-[var(--border)]" />

      {/* ── Typography ── */}
      <div>
        <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Typography</p>
        <div className="space-y-3">
          {(["headline", "body"] as const).map((role) => {
            const font = fonts.find((f) => f.role === role);
            return (
              <div key={role}>
                <label className="text-[13px] font-medium text-[var(--text-secondary)] mb-1 block capitalize">{role}</label>
                <select
                  value={font?.name ?? ""}
                  onChange={(e) => {
                    const name = e.target.value;
                    if (font) {
                      updateFont(font.id, { name });
                    } else {
                      addFont(name, role);
                    }
                  }}
                  className="w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--border)] hover:border-[var(--border)] cursor-pointer appearance-none"
                  style={{
                    fontFamily: font?.name,
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 8px center",
                  }}
                >
                  {FONT_PRESETS.map((fp) => (
                    <option key={fp} value={fp} style={{ fontFamily: fp }}>{fp}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-[var(--border)]" />

      {/* ── Tone of Voice ── */}
      <div>
        <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Tone of Voice</p>
        <div className="flex flex-wrap gap-1.5">
          {TONE_OPTIONS.map((t) => {
            const isActive = tones.includes(t.value);
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => toggleTone(t.value)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[13px] font-medium border transition-colors",
                  isActive
                    ? "bg-[var(--surface-active)] text-[var(--accent)] border-[var(--accent)]/20"
                    : "bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-active)]",
                )}
              >
                <span className="mr-1">{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>
        {tones.length > 0 && (
          <p className="mt-2 text-[13px] text-[var(--text-muted)]">
            Active: {tones.map((t) => TONE_OPTIONS.find((o) => o.value === t)?.label).filter(Boolean).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

type AssetElementType = "image" | "headline" | "body" | "cta" | "divider";

const ASSET_TYPE_LABELS: Record<AssetElementType, string> = {
  image: "Image",
  headline: "Headline",
  body: "Copy",
  cta: "CTA",
  divider: "Divider",
};

interface ProjectAsset {
  elementId: string;
  cardId: string;
  cardTitle: string;
  type: AssetElementType;
  content: string;
  imageData?: { src: string; alt: string };
  usedIn: string[]; // card titles sharing same element type+content
}

function AssetsTabContent() {
  const { cards, removeElement } = useSimpleCanvasStore();
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<AssetElementType[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const toggleType = useCallback((t: AssetElementType) => {
    setActiveTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }, []);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterOpen]);

  const assets = useMemo<ProjectAsset[]>(() => {
    const result: ProjectAsset[] = [];
    const seen = new Set<string>();

    for (const card of cards) {
      const allElements = [
        ...card.elements.map((el) => ({ ...el, fromVariant: false })),
        ...(card.variants ?? []).flatMap((v) => v.elements.map((el) => ({ ...el, fromVariant: true }))),
      ];

      for (const el of allElements) {
        if (el.type === "divider") continue;
        const dedupeKey = `${el.type}::${el.content}::${el.imageData?.src ?? ""}`;
        if (seen.has(dedupeKey)) {
          const existing = result.find((a) => `${a.type}::${a.content}::${a.imageData?.src ?? ""}` === dedupeKey);
          if (existing && !existing.usedIn.includes(card.title)) {
            existing.usedIn.push(card.title);
          }
          continue;
        }
        seen.add(dedupeKey);

        result.push({
          elementId: el.id,
          cardId: card.id,
          cardTitle: card.title,
          type: el.type as AssetElementType,
          content: el.content,
          imageData: el.imageData ? { src: el.imageData.src, alt: el.imageData.alt } : undefined,
          usedIn: [card.title],
        });
      }
    }

    return result;
  }, [cards]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: assets.length };
    for (const a of assets) counts[a.type] = (counts[a.type] ?? 0) + 1;
    return counts;
  }, [assets]);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (activeTypes.length > 0 && !activeTypes.includes(a.type)) return false;
      if (q) {
        const haystack = [a.content, a.cardTitle, a.type, ASSET_TYPE_LABELS[a.type], a.imageData?.alt ?? ""].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [assets, activeTypes, q]);

  const hasFilters = activeTypes.length > 0;

  const handleDragStart = useCallback((e: React.DragEvent, asset: ProjectAsset) => {
    e.dataTransfer.setData("application/x-asset-element", JSON.stringify({
      type: asset.type,
      content: asset.content,
      imageData: asset.imageData,
    }));
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  return (
    <>
      {/* Search + Filter button */}
      <div className="px-3 pb-2 pt-5 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="search"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border)] focus:bg-[var(--surface-elevated)]"
            />
          </div>
          <div ref={filterRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setFilterOpen(!filterOpen)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors flex-shrink-0",
                hasFilters
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:bg-[var(--surface-active)] hover:text-[var(--text-secondary)]",
              )}
              title="Filter"
            >
              <img src="/images/filters.png" alt="Filter" className={cn("w-3.5 h-3.5 dark-invert", hasFilters ? "opacity-100 invert" : "opacity-40")} />
            </button>
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1.5 w-[220px] rounded-lg bg-[var(--surface)] shadow-[var(--shadow-dropdown)] border border-[var(--border)] z-50 overflow-hidden"
                >
                  <div className="px-3 pt-2.5 pb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Filters</span>
                    {hasFilters && (
                      <button type="button" onClick={() => setActiveTypes([])} className="text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="px-3 pb-2.5">
                    <p className="text-[13px] font-semibold text-[var(--text-muted)] mb-1.5">Element Type</p>
                    <div className="flex flex-wrap gap-1">
                      {(["image", "headline", "body", "cta"] as AssetElementType[]).map((t) => {
                        const isActive = activeTypes.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleType(t)}
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[13px] font-medium border transition-colors",
                              isActive
                                ? "bg-neutral-900 text-white border-neutral-900"
                                : "bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-active)]",
                            )}
                          >
                            {ASSET_TYPE_LABELS[t]} <span className="opacity-60">{typeCounts[t] ?? 0}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {hasFilters && (
          <div className="pt-1.5 flex flex-wrap gap-1">
            {activeTypes.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--surface-active)] text-[13px] font-medium text-[var(--text-secondary)]">
                {ASSET_TYPE_LABELS[t]}
                <button type="button" onClick={() => toggleType(t)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Asset list — grouped by type */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-[var(--text-muted)]">No assets match your filter.</p>
        ) : (
          <div className="p-2 space-y-0.5">
            {filtered.map((asset) => {
              const preview = asset.type === "image"
                ? asset.imageData?.alt || asset.content
                : asset.content;
              const truncatedPreview = preview.length > 60 ? preview.slice(0, 60) + "…" : preview;

              return (
                <div
                  key={asset.elementId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, asset)}
                  className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors cursor-grab active:cursor-grabbing group"
                >
                  <ContentTypeIcon type={asset.type} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{ASSET_TYPE_LABELS[asset.type]}</p>
                    <p className="text-[13px] text-[var(--text-muted)] line-clamp-2 leading-tight">{truncatedPreview}</p>
                    {asset.usedIn.length > 1 && (
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Used in {asset.usedIn.length} content
                      </p>
                    )}
                  </div>
                  {asset.type === "image" && asset.imageData ? (
                    <div className="relative w-8 h-8 flex-shrink-0 self-center">
                      <div className="w-8 h-8 rounded bg-[var(--surface-active)] overflow-hidden group-hover:opacity-0 transition-opacity">
                        <img src={asset.imageData.src} alt={asset.imageData.alt} className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); if (asset.cardId) removeElement(asset.cardId, asset.elementId); }}
                        className="absolute inset-0 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete asset"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); if (asset.cardId) removeElement(asset.cardId, asset.elementId); }}
                      className="w-5 h-5 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0 self-center"
                      title="Delete asset"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </>
  );
}

function LanguagesTabContent() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Language Variants
        </p>
        <div className="space-y-2">
          {[
            { code: "en-US", name: "English (US)", status: "Primary" },
            { code: "es-MX", name: "Spanish (MX)", status: "Complete" },
            { code: "fr-FR", name: "French (FR)", status: "Draft" },
          ].map((lang) => (
            <div
              key={lang.code}
              className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface-active)] transition-colors cursor-pointer"
            >
              <div>
                <p className="text-[13px] font-medium text-[var(--text-primary)]">{lang.name}</p>
                <p className="text-[13px] text-[var(--text-muted)]">{lang.code}</p>
              </div>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-md text-[13px] font-medium",
                  lang.status === "Primary" && "bg-blue-500/10 text-blue-400",
                  lang.status === "Complete" && "bg-emerald-500/10 text-emerald-400",
                  lang.status === "Draft" && "bg-amber-500/10 text-amber-400",
                )}
              >
                {lang.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-[var(--border)] text-[13px] text-[var(--text-muted)] font-medium hover:border-[var(--border)] hover:text-[var(--text-secondary)] transition-all"
      >
        + Add language variant
      </button>

      <div>
        <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Personalization Tokens
        </p>
        <div className="flex flex-wrap gap-1.5">
          {["{{first_name}}", "{{company}}", "{{product}}"].map((token) => (
            <span
              key={token}
              className="px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-[13px] font-mono cursor-pointer hover:bg-orange-100 transition-colors"
            >
              {token}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

type ResourceType = "all" | "document" | "brief";

const RESOURCE_TYPE_LABELS: Record<Exclude<ResourceType, "all">, string> = {
  document: "Document",
  brief: "Brief",
};

interface Resource {
  id: string;
  type: Exclude<ResourceType, "all">;
  title: string;
  detail: string;
  timestamp: string;
}

const MOCK_RESOURCES: Resource[] = [
  { id: "r1", type: "brief", title: "Q4 Campaign Brief", detail: "Goals, audience segments, and KPIs for the Q4 email + SMS campaign", timestamp: "1 hr ago" },
  { id: "r2", type: "document", title: "Brand Guidelines v3.2", detail: "Williams Sonoma brand guidelines — tone, colors, typography, and imagery standards", timestamp: "15 min ago" },
  { id: "r3", type: "document", title: "Email A/B Test Results", detail: "Performance comparison of subject lines from the spring campaign", timestamp: "2 hr ago" },
];

function ResourcesTabContent() {
  const [search, setSearch] = useState("");
  const [activeResourceTypes, setActiveResourceTypes] = useState<Exclude<ResourceType, "all">[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [collapsedResourceSections, setCollapsedResourceSections] = useState<Set<string>>(new Set());

  const toggleResourceType = useCallback((t: Exclude<ResourceType, "all">) => {
    setActiveResourceTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }, []);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterOpen]);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    return MOCK_RESOURCES.filter((r) => {
      if (activeResourceTypes.length > 0 && !activeResourceTypes.includes(r.type)) return false;
      if (q && !r.title.toLowerCase().includes(q) && !r.detail.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeResourceTypes, q]);

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { all: MOCK_RESOURCES.length };
    for (const r of MOCK_RESOURCES) c[r.type] = (c[r.type] ?? 0) + 1;
    return c;
  }, []);

  const hasFilters = activeResourceTypes.length > 0;

  return (
    <>
      {/* Search + Filter button */}
      <div className="px-3 pb-2 pt-5 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="search"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border)] focus:bg-[var(--surface-elevated)]"
            />
          </div>
          <div ref={filterRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setFilterOpen(!filterOpen)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors flex-shrink-0",
                hasFilters
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:bg-[var(--surface-active)] hover:text-[var(--text-secondary)]",
              )}
              title="Filter"
            >
              <img src="/images/filters.png" alt="Filter" className={cn("w-3.5 h-3.5 dark-invert", hasFilters ? "opacity-100 invert" : "opacity-40")} />
            </button>
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1.5 w-[220px] rounded-lg bg-[var(--surface)] shadow-[var(--shadow-dropdown)] border border-[var(--border)] z-50 overflow-hidden"
                >
                  <div className="px-3 pt-2.5 pb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Filters</span>
                    {hasFilters && (
                      <button type="button" onClick={() => setActiveResourceTypes([])} className="text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="px-3 pb-2.5">
                    <p className="text-[13px] font-semibold text-[var(--text-muted)] mb-1.5">Type</p>
                    <div className="flex flex-wrap gap-1">
                      {(["document", "brief"] as Exclude<ResourceType, "all">[]).map((t) => {
                        const isActive = activeResourceTypes.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleResourceType(t)}
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[13px] font-medium border transition-colors",
                              isActive
                                ? "bg-neutral-900 text-white border-neutral-900"
                                : "bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-active)]",
                            )}
                          >
                            {RESOURCE_TYPE_LABELS[t]} <span className="opacity-60">{typeCounts[t] ?? 0}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {hasFilters && (
          <div className="pt-1.5 flex flex-wrap gap-1">
            {activeResourceTypes.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--surface-active)] text-[13px] font-medium text-[var(--text-secondary)]">
                {RESOURCE_TYPE_LABELS[t]}
                <button type="button" onClick={() => toggleResourceType(t)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* List — grouped by type */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-[var(--text-muted)]">No documents match your filter.</p>
        ) : (
          <div className="p-2 space-y-0.5">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group"
              >
                <ContentTypeIcon type={r.type} size="md" />
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">{r.title}</span>
                  <p className="text-[13px] text-[var(--text-muted)] line-clamp-2 leading-tight mt-0.5">{r.detail}</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{r.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </>
  );
}

