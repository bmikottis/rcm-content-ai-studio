"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimpleCanvasStore } from "@/stores/simple-canvas";
import { usePreviewStore } from "@/stores/preview";
import { cardToHtml } from "@/lib/card-to-preview";
import { ContentTypeIcon } from "@/components/ui/ContentTypeIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { toast } from "@/stores/toast";
import { usePublishStore } from "@/stores/publish";
import { useCanvasStore } from "@/stores/canvas";
import { InlineClaimsSuggestions } from "@/components/regulated/InlineClaimsSuggestions";
import { RegulatedContentProfilePanel } from "@/components/regulated/RegulatedContentProfilePanel";
import { scanCardsForCompliance, type ComplianceIssue } from "@/lib/compliance-scan";
import { regulatedEmailChromeAnchors } from "@/lib/regulated-email-anchors";
import { useRegulatedContentStore, elementKey } from "@/stores/regulated-content";
import { ComplianceFlagIcon } from "@/components/regulated/ComplianceFlagIcon";
import { cn } from "@/lib/cn";
import type { ChannelCard, CardVariant, ContentElement, CardStatus } from "@/types/simple-canvas";

const REGULATED_FLAG_VIOLATION_TITLE = "Potential compliance violation";

/** Short copy for the inspector flag row — scanner rule + optional handoff flag. */
function complianceFlagGuidance(onElement: ComplianceIssue[], hasCreator: boolean): string {
  const scan = onElement.filter((i) => i.ruleId !== "CR-CREATOR-01");
  const parts: string[] = [];
  for (const issue of scan.slice(0, 2)) {
    const line = issue.hint?.trim()
      ? `${issue.message.trim()} — ${issue.hint.trim()}`
      : issue.message.trim();
    if (line) parts.push(line);
  }
  if (hasCreator) {
    parts.push(
      "A handoff flag means this section was queued for compliance before MLR: verify claims, citations, and ISI / fair balance, then clear the flag when fixed.",
    );
  }
  return (
    parts.join(" ") ||
    "Check this block against your approved claims, label language, and any required safety or disclosure text."
  );
}

type CardAction = "rename" | "duplicate" | "createVariant" | "delete";
type InspectorMode = "design" | "code";

const ELEMENT_TYPES: { type: ContentElement["type"]; label: string }[] = [
  { type: "headline", label: "Headline" },
  { type: "body", label: "Copy" },
  { type: "cta", label: "CTA" },
  { type: "image", label: "Image" },
  { type: "divider", label: "Divider" },
];

const MIN_WIDTH = 240;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 300;

export function ChannelInspector() {
  const projectId = useCanvasStore((s) => s.projectId);
  const regulatedCanvas = projectId === "proj-pharma-email";
  const { selectedCardId, selectedCardIds, selectedElement, selectedVariantId, cards, removeCard, clearSelection, updateCard, addCard, selectElement, addElement, removeElement, updateVariantElement, addVariantElement, removeVariantElement, reorderVariantElements, removeVariant, addVariant, selectVariant, createGroup, cardGroups, selectedGroupId, renameGroup, removeGroup, duplicateGroup, addGroupTag, removeGroupTag, removeFromGroup, focusCard, pulseComplianceOnElement } =
    useSimpleCanvasStore();

  const selectedCards = useMemo(
    () => cards.filter((c) => selectedCardIds.includes(c.id)),
    [selectedCardIds, cards],
  );
  const { setViewMode } = usePreviewStore();

  const card = useMemo(
    () => (selectedCardId ? cards.find((c) => c.id === selectedCardId) ?? null : null),
    [selectedCardId, cards],
  );

  const element = useMemo(() => {
    if (!card || !selectedElement) return null;
    return card.elements.find((e) => e.id === selectedElement.elementId) ?? null;
  }, [card, selectedElement]);

  const selectedVariant = useMemo(() => {
    if (!card || !selectedVariantId) return null;
    return card.variants?.find((v) => v.id === selectedVariantId) ?? null;
  }, [card, selectedVariantId]);

  const profile = useRegulatedContentStore((s) => s.profile);
  const creatorFlags = useRegulatedContentStore((s) => s.creatorComplianceFlags);
  const toggleCreatorComplianceFlag = useRegulatedContentStore((s) => s.toggleCreatorComplianceFlag);

  const cardComplianceIssues = useMemo(() => {
    if (!card || card.channel !== "email") return [];
    return scanCardsForCompliance(cards, profile, creatorFlags).filter((i) => i.cardId === card.id);
  }, [card, cards, profile, creatorFlags]);

  const regulatedFlagRows = useMemo(() => {
    if (!card || card.channel !== "email") return [];
    const { flagIds } = regulatedEmailChromeAnchors(card.elements);
    const bodies = card.elements.filter((e) => e.type === "body");
    const firstBodyId = bodies[0]?.id;
    const lastBodyId = bodies[bodies.length - 1]?.id;
    const rows: { elementId: string; blockLabel: string; detail: string; hasCreator: boolean }[] = [];
    for (const elementId of flagIds) {
      const el = card.elements.find((e) => e.id === elementId);
      if (!el) continue;
      const onElement = cardComplianceIssues.filter((i) => i.elementId === elementId);
      const hasCreator = Boolean(creatorFlags[elementKey(card.id, elementId)]);
      if (onElement.length === 0 && !hasCreator) continue;
      const blockLabel =
        el.type === "body"
          ? el.id === firstBodyId
            ? "Intro copy"
            : el.id === lastBodyId
              ? "Closing copy"
              : "Body"
          : el.type === "headline"
            ? "Headline"
            : el.type.charAt(0).toUpperCase() + el.type.slice(1);
      rows.push({
        elementId,
        blockLabel,
        detail: complianceFlagGuidance(onElement, hasCreator),
        hasCreator,
      });
    }
    return rows;
  }, [card, cardComplianceIssues, creatorFlags]);

  const regulatedFlagRowsForSelectedElement = useMemo(() => {
    if (!element) return [];
    return regulatedFlagRows.filter((r) => r.elementId === element.id);
  }, [element, regulatedFlagRows]);

  const regulatedFlagRowsInContentDetails = useMemo(() => {
    if (!element) return regulatedFlagRows;
    return regulatedFlagRows.filter((r) => r.elementId !== element.id);
  }, [element, regulatedFlagRows]);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [isEditingHeaderTitle, setIsEditingHeaderTitle] = useState(false);
  const [headerTitleDraft, setHeaderTitleDraft] = useState("");
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>("design");
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const userWidthRef = useRef(DEFAULT_WIDTH);
  const isResizing = useRef(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [groupNameDraft, setGroupNameDraft] = useState("");
  const groupMenuRef = useRef<HTMLDivElement>(null);
  const [regulatedContentDetailsOpen, setRegulatedContentDetailsOpen] = useState(true);
  const { isPublishing: isPublishingGlobal, publishCards } = usePublishStore();

  // Close actions menu on outside click
  useEffect(() => {
    if (!showActionsMenu) return;
    const handler = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showActionsMenu]);

  // Close group actions menu on outside click
  useEffect(() => {
    if (!showGroupMenu) return;
    const handler = (e: MouseEvent) => {
      if (groupMenuRef.current && !groupMenuRef.current.contains(e.target as Node)) {
        setShowGroupMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showGroupMenu]);

  useEffect(() => {
    setIsEditingHeaderTitle(false);
  }, [selectedCardId]);

  const commitHeaderTitle = useCallback(() => {
    if (!card) return;
    const t = headerTitleDraft.trim();
    if (t) updateCard(card.id, { title: t });
    setIsEditingHeaderTitle(false);
  }, [card, headerTitleDraft, updateCard]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = panelWidth;
    let latestWidth = startWidth;

    const onMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = startX - ev.clientX;
      latestWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta));
      setPanelWidth(latestWidth);
    };
    const onUp = () => {
      isResizing.current = false;
      userWidthRef.current = latestWidth;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [panelWidth]);

  const handleReorder = useCallback(() => {
    if (dragItem.current === null || dragOverItem.current === null || !card) return;
    if (dragItem.current === dragOverItem.current) return;
    const reordered = [...card.elements];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, moved);
    updateCard(card.id, { elements: reordered });
    dragItem.current = null;
    dragOverItem.current = null;
  }, [card, updateCard]);

  const handleAddElement = useCallback((type: ContentElement["type"]) => {
    if (!card) return;
    const id = `${type}-${Date.now()}`;
    const content = type === "divider" ? "" : type === "image" ? "New image" : `New ${type}`;
    addElement(card.id, { id, type, content });
    setShowAddMenu(false);
    selectElement(card.id, id);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} element added`);
  }, [card, addElement, selectElement]);

  const handleRemoveElement = useCallback((elId: string) => {
    if (!card) return;
    const el = card.elements.find((e) => e.id === elId);
    removeElement(card.id, elId);
    toast.info(`${el ? el.type.charAt(0).toUpperCase() + el.type.slice(1) : "Element"} removed`);
  }, [card, removeElement]);

  const handleJumpToComplianceFlag = useCallback(
    (elementId: string) => {
      if (!card) return;
      selectElement(card.id, elementId);
      focusCard(card.id);
      pulseComplianceOnElement(card.id, elementId);
    },
    [card, selectElement, focusCard, pulseComplianceOnElement],
  );

  // Group inspector panel
  const selectedGroup = selectedGroupId ? cardGroups.find((g) => g.id === selectedGroupId) ?? null : null;
  if (selectedGroup && selectedCards.length > 0) {
    const emailCount = selectedCards.filter((c) => c.channel === "email").length;
    const smsCount = selectedCards.filter((c) => c.channel === "sms").length;

    return (
      <AnimatePresence initial={false}>
        <motion.div
          key="group-inspector"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto absolute right-3 top-[68px] bottom-3 flex flex-col overflow-hidden rounded-xl bg-[var(--surface)] shadow-[var(--shadow-panel)]"
          style={{ zIndex: "var(--z-panel)", width: DEFAULT_WIDTH }}
        >
          {/* Header */}
          <div className="flex h-[44px] shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <GroupIcon className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
              {isEditingGroupName ? (
                <input
                  autoFocus
                  type="text"
                  value={groupNameDraft}
                  onChange={(e) => setGroupNameDraft(e.target.value)}
                  onBlur={() => {
                    if (groupNameDraft.trim()) renameGroup(selectedGroup.id, groupNameDraft.trim());
                    setIsEditingGroupName(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { if (groupNameDraft.trim()) renameGroup(selectedGroup.id, groupNameDraft.trim()); setIsEditingGroupName(false); }
                    if (e.key === "Escape") setIsEditingGroupName(false);
                  }}
                  className="text-[13px] font-semibold text-[var(--text-primary)] bg-transparent outline-none border-b border-[#0F8EFF] flex-1 min-w-0"
                />
              ) : (
                <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                  {selectedGroup.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <div ref={groupMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowGroupMenu(!showGroupMenu)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
                  aria-label="Group actions"
                >
                  <MoreIcon className="h-4 w-4" />
                </button>
                {showGroupMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-lg bg-[var(--surface)] shadow-[var(--shadow-dropdown)] border border-[var(--border)] z-20 py-1 overflow-hidden">
                    <MenuAction
                      icon={<DesignIcon className="w-3.5 h-3.5" />}
                      label="Rename"
                      onClick={() => { setGroupNameDraft(selectedGroup.name); setIsEditingGroupName(true); setShowGroupMenu(false); }}
                    />
                    <MenuAction
                      icon={<DuplicateIcon className="w-3.5 h-3.5" />}
                      label="Duplicate"
                      onClick={() => { duplicateGroup(selectedGroup.id); toast.success("Group duplicated"); setShowGroupMenu(false); }}
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
                aria-label="Close"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
            {/* Summary */}
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">Group</p>
              <div className="flex gap-3">
                <span className="text-[13px] text-[var(--text-secondary)]">{selectedCards.length} block{selectedCards.length !== 1 ? "s" : ""}</span>
                {emailCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <ContentTypeIcon type="email" size="sm" />
                    <span className="text-[13px] text-[var(--text-secondary)]">{emailCount}</span>
                  </div>
                )}
                {smsCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <ContentTypeIcon type="sms" size="sm" />
                    <span className="text-[13px] text-[var(--text-secondary)]">{smsCount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Status</label>
              {selectedCards.every((c) => c.status === "published") ? (
                <div className="w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] text-[13px] font-medium text-[var(--text-secondary)] flex items-center cursor-not-allowed">
                  Published
                </div>
              ) : (
                <select
                  value={
                    (() => {
                      const nonPublished = selectedCards.filter((c) => c.status !== "published");
                      const allSame = nonPublished.every((c) => c.status === nonPublished[0].status) ? nonPublished[0].status : null;
                      return allSame || "";
                    })()
                  }
                  onChange={(e) => {
                    const status = e.target.value as CardStatus;
                    for (const c of selectedCards) {
                      if (c.status !== "published") updateCard(c.id, { status });
                    }
                  }}
                  className={cn(
                    "w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium outline-none transition-colors focus:border-neutral-400 hover:border-[var(--border)] cursor-pointer appearance-none",
                    "text-[var(--text-primary)]",
                  )}
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
                >
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="approved">Approved</option>
                </select>
              )}
              <div className="mt-2 space-y-1">
                {Object.entries(
                  selectedCards.reduce<Record<string, number>>((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {})
                ).map(([st, count]) => (
                  <div key={st} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        st === "ready" ? "bg-emerald-500" : st === "published" ? "bg-blue-500" : st === "generating" ? "bg-amber-500" : "bg-neutral-300",
                      )} />
                      <span className="text-[13px] text-[var(--text-secondary)] capitalize">{st}</span>
                    </div>
                    <span className="text-[13px] tabular-nums text-[var(--text-muted)]">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Tags</label>
              <TagsEditor
                tags={selectedGroup.tags}
                onChange={(tags) => {
                  const current = selectedGroup.tags;
                  const added = tags.filter((t) => !current.includes(t));
                  const removed = current.filter((t) => !tags.includes(t));
                  for (const t of added) addGroupTag(selectedGroup.id, t);
                  for (const t of removed) removeGroupTag(selectedGroup.id, t);
                }}
                allTags={Array.from(new Set(cardGroups.flatMap((g) => g.tags)))}
              />
            </div>

            {/* Blocks in group */}
            <div className="px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">Content</p>
              <div className="space-y-1">
                {selectedCards.map((c) => (
                  <div key={c.id} className="group/block flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--surface-subtle)]">
                    <ContentTypeIcon type={c.channel} size="sm" />
                    <span className="text-[13px] text-[var(--text-secondary)] truncate flex-1">{c.title}</span>
                    <button
                      type="button"
                      onClick={() => {
                        removeFromGroup(selectedGroup.id, [c.id]);
                        toast.info(`Removed "${c.title}" from group`);
                      }}
                      className="w-5 h-5 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover/block:opacity-100 flex-shrink-0"
                      title="Remove from group"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                    <StatusBadge status={c.status} size="xs" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions footer */}
          <div className="shrink-0 px-4 py-3 border-t border-[var(--border)] bg-[var(--surface)] space-y-2">
            <button
              type="button"
              onClick={() => {
                removeGroup(selectedGroup.id);
                clearSelection();
                toast.info("Group ungrouped");
              }}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="8" height="8" rx="1" />
                <rect x="14" y="14" width="8" height="8" rx="1" />
                <path d="M14 2h6a2 2 0 0 1 2 2v6" />
                <path d="M2 14v6a2 2 0 0 0 2 2h6" />
              </svg>
              Ungroup
            </button>
          </div>

          {/* Publish footer */}
          <div className="shrink-0 px-4 pb-3 bg-[var(--surface)]">
            {(() => {
              const allPublished = selectedCards.every((c) => c.status === "published");
              const unpublished = selectedCards.filter((c) => c.status !== "published");

              if (allPublished) return null;

              return (
                <button
                  type="button"
                  disabled={isPublishingGlobal}
                  onClick={() => publishCards(unpublished.map((c) => c.id))}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-[#0F8EFF] text-[13px] font-semibold text-white hover:bg-[#0D7DE6] transition-colors disabled:opacity-70"
                >
                  {regulatedCanvas
                    ? unpublished.length < selectedCards.length
                      ? `Submit for review (${unpublished.length})`
                      : "Submit for review"
                    : `Publish${unpublished.length < selectedCards.length ? ` ${unpublished.length}` : " All"}`}
                </button>
              );
            })()}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Multi-selection panel
  if (selectedCards.length > 1) {
    const emailCount = selectedCards.filter((c) => c.channel === "email").length;
    const smsCount = selectedCards.filter((c) => c.channel === "sms").length;
    const allSameStatus = selectedCards.every((c) => c.status === selectedCards[0].status)
      ? selectedCards[0].status
      : null;
    const statusCounts: Record<string, number> = {};
    for (const c of selectedCards) statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;

    const setAllStatus = (status: CardStatus) => {
      for (const c of selectedCards) updateCard(c.id, { status });
    };

    return (
      <AnimatePresence initial={false}>
        <motion.div
          key="multi"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto absolute right-3 top-[68px] bottom-3 flex flex-col overflow-hidden rounded-xl bg-[var(--surface)] shadow-[var(--shadow-panel)]"
          style={{ zIndex: "var(--z-panel)", width: DEFAULT_WIDTH }}
        >
          {/* Header */}
          <div className="flex h-[44px] shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">
              {selectedCards.length} Selected
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-[13px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
            {/* Summary */}
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">Selection</p>
              <div className="flex gap-3">
                {emailCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <ContentTypeIcon type="email" size="sm" />
                    <span className="text-[13px] text-[var(--text-secondary)]">{emailCount} Email{emailCount > 1 ? "s" : ""}</span>
                  </div>
                )}
                {smsCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <ContentTypeIcon type="sms" size="sm" />
                    <span className="text-[13px] text-[var(--text-secondary)]">{smsCount} SMS</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Status</label>
              {selectedCards.every((c) => c.status === "published") ? (
                <div className="w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] text-[13px] font-medium text-[var(--text-secondary)] flex items-center cursor-not-allowed">
                  Published
                </div>
              ) : (
                <select
                  value={
                    (() => {
                      const nonPublished = selectedCards.filter((c) => c.status !== "published");
                      const allSameDraftReady = nonPublished.every((c) => c.status === nonPublished[0].status) ? nonPublished[0].status : null;
                      return allSameDraftReady || "";
                    })()
                  }
                  onChange={(e) => {
                    const status = e.target.value as CardStatus;
                    for (const c of selectedCards) {
                      if (c.status !== "published") updateCard(c.id, { status });
                    }
                  }}
                  className={cn(
                    "w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium outline-none transition-colors focus:border-neutral-400 hover:border-[var(--border)] cursor-pointer appearance-none",
                    "text-[var(--text-primary)]",
                  )}
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
                >
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="approved">Approved</option>
                </select>
              )}
              <div className="mt-2 space-y-1">
                {Object.entries(statusCounts).map(([st, count]) => (
                  <div key={st} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        st === "ready" ? "bg-emerald-500" : st === "published" ? "bg-blue-500" : st === "generating" ? "bg-amber-500" : "bg-neutral-300",
                      )} />
                      <span className="text-[13px] text-[var(--text-secondary)] capitalize">{st}</span>
                    </div>
                    <span className="text-[13px] tabular-nums text-[var(--text-muted)]">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected items list */}
            <div className="px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">Content Selected</p>
              <div className="space-y-1">
                {selectedCards.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--surface-subtle)]">
                    <ContentTypeIcon type={c.channel} size="sm" />
                    <span className="text-[13px] text-[var(--text-secondary)] truncate flex-1">{c.title}</span>
                    <StatusBadge status={c.status} size="xs" className="ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Group action */}
          <div className="shrink-0 px-4 py-3 border-t border-[var(--border)] bg-[var(--surface)]">
            {(() => {
              const ids = selectedCards.map((c) => c.id);
              const existingGroup = cardGroups.find(
                (g) => ids.length > 0 && ids.every((id) => g.cardIds.includes(id)) && g.cardIds.length === ids.length,
              );
              return existingGroup ? (
                <button
                  type="button"
                  onClick={() => {
                    removeGroup(existingGroup.id);
                    toast.info("Group removed");
                  }}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <GroupIcon className="w-4 h-4" />
                  Ungroup
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const name = `Group ${cardGroups.length + 1}`;
                    createGroup(name, ids);
                    toast.success(`Grouped ${ids.length} content`);
                  }}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <GroupIcon className="w-4 h-4" />
                  Group
                </button>
              );
            })()}
          </div>

          {/* Sticky publish footer */}
          <div className="shrink-0 px-4 pb-3 px-4 bg-[var(--surface)]">
            {(() => {
              const allPublished = selectedCards.every((c) => c.status === "published");
              const unpublished = selectedCards.filter((c) => c.status !== "published");

              if (allPublished) return null;

              return (
                <button
                  type="button"
                  disabled={isPublishingGlobal}
                  onClick={() => publishCards(unpublished.map((c) => c.id))}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-[#0F8EFF] text-[13px] font-semibold text-white hover:bg-[#0D7DE6] transition-colors disabled:opacity-70"
                >
                  {regulatedCanvas
                    ? unpublished.length < selectedCards.length
                      ? `Submit for review (${unpublished.length})`
                      : "Submit for review"
                    : `Publish${unpublished.length < selectedCards.length ? ` ${unpublished.length}` : " All"}`}
                </button>
              );
            })()}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!card) return null;

  // ── Variant Inspector Panel ──
  if (selectedVariant && card) {
    const handleVariantStatusChange = (status: CardStatus) => {
      const updatedVariants = (card.variants ?? []).map((v) =>
        v.id === selectedVariant.id ? { ...v, status } : v
      );
      updateCard(card.id, { variants: updatedVariants });
    };

    const handleVariantLabelChange = (label: string) => {
      const updatedVariants = (card.variants ?? []).map((v) =>
        v.id === selectedVariant.id ? { ...v, label } : v
      );
      updateCard(card.id, { variants: updatedVariants });
    };

    return (
      <AnimatePresence initial={false}>
        <motion.div
          key={`variant-${selectedVariant.id}`}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto absolute right-3 top-[68px] bottom-3 flex flex-col overflow-hidden rounded-xl bg-[var(--surface)] shadow-[var(--shadow-panel)]"
          style={{ zIndex: "var(--z-panel)", width: DEFAULT_WIDTH }}
        >
          {/* Header */}
          <div className="flex h-[44px] shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
            <div className="flex items-center gap-2 min-w-0">
              <ContentTypeIcon type={card.channel} size="sm" />
              <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{selectedVariant.label}</span>
              <span className="text-[13px] font-medium text-[var(--text-muted)] bg-[var(--surface-active)] px-1.5 py-0.5 rounded flex-shrink-0">Variant</span>
            </div>
            <button
              type="button"
              onClick={() => clearSelection()}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
              aria-label="Close"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
            {/* Parent card */}
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Parent Block</label>
              <p className="text-[13px] font-medium text-[var(--text-secondary)]">{card.title}</p>
            </div>

            {/* Variant Label */}
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Label</label>
              <input
                type="text"
                value={selectedVariant.label}
                onChange={(e) => handleVariantLabelChange(e.target.value)}
                placeholder="Variant label…"
                className="w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--text-primary)] placeholder:text-neutral-300 outline-none transition-colors focus:border-neutral-400 hover:border-[var(--border)]"
              />
            </div>

            {/* Status */}
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Status</label>
              <select
                value={selectedVariant.status}
                onChange={(e) => handleVariantStatusChange(e.target.value as CardStatus)}
                className="w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--text-primary)] outline-none transition-colors focus:border-neutral-400 hover:border-[var(--border)] cursor-pointer appearance-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
              >
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="approved">Approved</option>
              </select>
            </div>

            {/* Elements list */}
            <VariantElementsList
              card={card}
              variant={selectedVariant}
              cards={cards}
              addVariantElement={addVariantElement}
              removeVariantElement={removeVariantElement}
              reorderVariantElements={reorderVariantElements}
              selectElement={selectElement}
              selectedElement={selectedElement}
            />
          </div>

          {/* Delete variant footer */}
          <div className="shrink-0 px-4 py-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => { const label = selectedVariant.label; removeVariant(card.id, selectedVariant.id); clearSelection(); toast.info(`Variant "${label}" deleted`); }}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-red-400/30 text-[13px] font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <DeleteIcon className="w-3.5 h-3.5" />
              Delete Variant
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const handleAction = (action: CardAction) => {
    setShowActionsMenu(false);
    switch (action) {
      case "rename":
        setHeaderTitleDraft(card.title);
        setIsEditingHeaderTitle(true);
        break;
      case "duplicate": {
        const newCard: ChannelCard = {
          ...card,
          id: `${card.id}-copy-${Date.now()}`,
          title: `${card.title} (Copy)`,
          status: "draft",
          position: { x: card.position.x + 40, y: card.position.y + 40 },
          elements: card.elements.map((el) => ({
            ...el,
            id: `${el.id}-copy-${Date.now()}`,
          })),
        };
        addCard(newCard);
        toast.success(`"${card.title}" duplicated`);
        break;
      }
      case "createVariant": {
        addVariant(card.id);
        const updated = useSimpleCanvasStore.getState().cards.find((c) => c.id === card.id);
        const variants = updated?.variants ?? [];
        const last = variants[variants.length - 1];
        if (last) selectVariant(card.id, last.id);
        toast.success(`New variant for "${card.title}"`);
        break;
      }
      case "delete":
        if (!confirmDelete) {
          setConfirmDelete(true);
          setShowActionsMenu(true);
          return;
        }
        { const title = card.title; removeCard(card.id); clearSelection(); setConfirmDelete(false); toast.info(`"${title}" deleted`); }
        break;
    }
  };

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={card.id}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto absolute right-3 top-[68px] bottom-3 flex flex-col overflow-hidden rounded-xl bg-[var(--surface)] shadow-[var(--shadow-panel)]"
        style={{ zIndex: "var(--z-panel)", width: panelWidth }}
      >
        {/* Resize handle — left edge */}
        <div
          onMouseDown={handleResizeStart}
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 group"
        >
          <div className="absolute left-0 top-0 bottom-0 w-px bg-transparent group-hover:bg-neutral-300 transition-colors" />
        </div>

        {/* Header */}
        <div className="flex h-[44px] shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <ContentTypeIcon type={card.channel} size="sm" />
            {isEditingHeaderTitle ? (
              <input
                autoFocus
                type="text"
                value={headerTitleDraft}
                onChange={(e) => setHeaderTitleDraft(e.target.value)}
                onBlur={commitHeaderTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitHeaderTitle();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setIsEditingHeaderTitle(false);
                  }
                }}
                className="min-w-0 flex-1 h-7 px-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-semibold text-[var(--text-primary)] outline-none focus:border-neutral-400"
              />
            ) : (
              <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{card.title}</span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* 3-dot actions menu */}
            <div ref={actionsRef} className="relative">
              <button
                type="button"
                onClick={() => { setShowActionsMenu(!showActionsMenu); setConfirmDelete(false); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
                aria-label="Actions"
              >
                <MoreIcon className="h-4 w-4" />
              </button>
              {showActionsMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 rounded-lg bg-[var(--surface)] shadow-[var(--shadow-dropdown)] border border-[var(--border)] z-20 py-1 overflow-hidden">
                  <MenuAction icon={<DesignIcon className="w-3.5 h-3.5" />} label="Rename" onClick={() => handleAction("rename")} />
                  <MenuAction icon={<DuplicateIcon className="w-3.5 h-3.5" />} label="Duplicate" onClick={() => handleAction("duplicate")} />
                  <MenuAction icon={<VariantIcon className="w-3.5 h-3.5" />} label="Create variant" onClick={() => handleAction("createVariant")} />
                  <div className="h-px bg-[var(--surface-active)] my-1" />
                  {confirmDelete ? (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <p className="text-[13px] text-red-400 font-semibold flex-1">Delete?</p>
                      <button
                        type="button"
                        onClick={() => handleAction("delete")}
                        className="px-2 py-1 rounded-lg bg-red-600 text-white text-[13px] font-semibold hover:bg-red-700 transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => { setConfirmDelete(false); setShowActionsMenu(false); }}
                        className="px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <MenuAction icon={<DeleteIcon className="w-3.5 h-3.5" />} label="Delete" onClick={() => handleAction("delete")} variant="danger" />
                  )}
                </div>
              )}
            </div>
            {/* Close */}
            <button
              type="button"
              onClick={() => clearSelection()}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-active)] hover:text-[var(--text-primary)]"
              aria-label="Close"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Design / Code toggle — only for email blocks */}
        {card.channel === "email" && (
          <div className="flex items-center gap-0 px-3 py-2 border-b border-[var(--border)] shrink-0">
            {(["design", "code"] as const).map((mode) => {
              const isActive = inspectorMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setInspectorMode(mode);
                    setPanelWidth(mode === "code" ? MAX_WIDTH : userWidthRef.current);
                  }}
                  className={cn(
                    "relative flex-1 flex items-center justify-center gap-2 h-8 rounded-lg text-[13px] font-medium transition-colors",
                    isActive ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="inspectorModeIndicator"
                      className="absolute inset-0 bg-[var(--surface-active)] rounded-lg"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    {mode === "design" ? <DesignIcon className="w-3.5 h-3.5" /> : <CodeIcon className="w-3.5 h-3.5" />}
                    {mode === "design" ? "Edit" : "Code"}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Body — SMS always shows design mode since there's no code view */}
        <div className={cn("flex-1 min-h-0", (card.channel !== "email" || inspectorMode === "design") ? "overflow-y-auto scrollbar-hide" : "flex flex-col")}>
          {(card.channel !== "email" || inspectorMode === "design") ? (
            <>
            {regulatedCanvas && !selectedVariantId ? (
            <>
              {element && regulatedFlagRowsForSelectedElement.length > 0 && (
                <div className="shrink-0 border-b border-[var(--border)] px-4 pb-3 pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                    Compliance flags
                  </p>
                  <ul className="space-y-3">
                    {regulatedFlagRowsForSelectedElement.map((row) => (
                      <li key={row.elementId} className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleJumpToComplianceFlag(row.elementId)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-amber-500 bg-amber-50 text-amber-800 shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                          title="Show this area on the canvas"
                          aria-label={`Focus canvas on ${row.blockLabel}`}
                        >
                          <ComplianceFlagIcon className="h-4 w-4" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-[var(--text-primary)]">{REGULATED_FLAG_VIOLATION_TITLE}</p>
                          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                            {row.blockLabel}
                          </p>
                          <p className="mt-1 text-[11px] leading-snug text-[var(--text-muted)]">{row.detail}</p>
                          {row.hasCreator && (
                            <button
                              type="button"
                              className="mt-1.5 text-[11px] font-semibold text-amber-900 underline decoration-amber-400/80 hover:text-amber-950"
                              onClick={() => toggleCreatorComplianceFlag(elementKey(card.id, row.elementId))}
                            >
                              Clear handoff flag
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {element && (
                <InlineClaimsSuggestions card={card} element={element} />
              )}
              <div className="shrink-0 border-b border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setRegulatedContentDetailsOpen((o) => !o)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors hover:bg-[var(--surface-hover)]"
                  aria-expanded={regulatedContentDetailsOpen}
                >
                  <div className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                      Content details
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-[var(--text-muted)]">
                      Status, fields, audience context & compliance flags
                    </span>
                  </div>
                  <InspectorChevronIcon
                    className={cn(
                      "h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200",
                      regulatedContentDetailsOpen && "rotate-180",
                    )}
                  />
                </button>
                {regulatedContentDetailsOpen && (
                  <div className="border-t border-[var(--border)]">
                    <div className="px-4 py-3 border-b border-[var(--border)]">
                      <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Status</label>
                      {card.status === "published" ? (
                        <div className="w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] text-[13px] font-medium text-[var(--text-secondary)] flex items-center cursor-not-allowed">
                          Published
                        </div>
                      ) : (
                        <select
                          value={card.status}
                          onChange={(e) => updateCard(card.id, { status: e.target.value as CardStatus })}
                          className="w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--text-primary)] outline-none transition-colors focus:border-neutral-400 hover:border-[var(--border)] cursor-pointer appearance-none"
                          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
                        >
                          <option value="draft">Draft</option>
                          <option value="ready">Ready</option>
                          <option value="approved">Approved</option>
                        </select>
                      )}
                    </div>
                    <div className="px-4 py-3 border-b border-[var(--border)]">
                      <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Title</label>
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => updateCard(card.id, { title: e.target.value })}
                        placeholder="Enter title…"
                        className="w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--text-primary)] placeholder:text-neutral-300 outline-none transition-colors focus:border-neutral-400 hover:border-[var(--border)]"
                      />
                    </div>
                    {card.channel === "email" && (
                      <div className="px-4 py-3 border-b border-[var(--border)]">
                        <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Subject Line</label>
                        <input
                          type="text"
                          value={card.subjectLine ?? ""}
                          onChange={(e) => updateCard(card.id, { subjectLine: e.target.value })}
                          placeholder="Enter subject line…"
                          className="w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--text-primary)] placeholder:text-neutral-300 outline-none transition-colors focus:border-neutral-400 hover:border-[var(--border)]"
                        />
                      </div>
                    )}
                    <div className="px-4 py-3 border-b border-[var(--border)]">
                      <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Tags</label>
                      <TagsEditor
                        tags={card.tags ?? []}
                        onChange={(tags) => updateCard(card.id, { tags })}
                        allTags={Array.from(new Set(cards.flatMap((c) => c.tags ?? [])))}
                      />
                    </div>
                    {card.channel === "sms" && (() => {
                      const bodyEl = card.elements.find((e) => e.type === "body");
                      const charCount = bodyEl?.content.length ?? 0;
                      const maxSingle = 160;
                      const segmentSize = 153;
                      const segments = charCount === 0 ? 0 : charCount <= maxSingle ? 1 : Math.ceil(charCount / segmentSize);
                      const ratio = Math.min(charCount / maxSingle, 1);
                      return (
                        <div className="px-4 py-3 border-b border-[var(--border)]">
                          <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2 block">Character Count</label>
                          <div className="flex items-center gap-3">
                            <SmsCharRing ratio={ratio} over={charCount > maxSingle} />
                            <div>
                              <div className="flex items-baseline gap-1">
                                <span className={cn("text-[16px] font-bold tabular-nums", charCount > maxSingle ? "text-amber-500" : charCount >= 140 ? "text-orange-500" : "text-[var(--text-primary)]")}>
                                  {charCount}
                                </span>
                                <span className="text-[13px] text-[var(--text-muted)]">/ {maxSingle}</span>
                              </div>
                              <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
                                {segments === 0 ? "Empty message" : segments === 1 ? "Single SMS segment" : `${segments} segments (concatenated)`}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="px-4 pb-3 pt-2">
                      <RegulatedContentProfilePanel hideHeading />
                    </div>
                    <div className="border-t border-[var(--border)] px-4 pb-3 pt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">Compliance flags</p>
                      {regulatedFlagRowsInContentDetails.length === 0 ? (
                        <p className="text-[12px] text-[var(--text-muted)]">No open issues on other intro or closing blocks.</p>
                      ) : (
                        <ul className="space-y-3">
                          {regulatedFlagRowsInContentDetails.map((row) => (
                            <li key={row.elementId} className="flex gap-2.5">
                              <button
                                type="button"
                                onClick={() => handleJumpToComplianceFlag(row.elementId)}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-amber-500 bg-amber-50 text-amber-800 shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                                title="Show this area on the canvas"
                                aria-label={`Focus canvas on ${row.blockLabel}`}
                              >
                                <ComplianceFlagIcon className="h-4 w-4" />
                              </button>
                              <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-semibold text-[var(--text-primary)]">{REGULATED_FLAG_VIOLATION_TITLE}</p>
                                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                                  {row.blockLabel}
                                </p>
                                <p className="mt-1 text-[11px] leading-snug text-[var(--text-muted)]">{row.detail}</p>
                                {row.hasCreator && (
                                  <button
                                    type="button"
                                    className="mt-1.5 text-[11px] font-semibold text-amber-900 underline decoration-amber-400/80 hover:text-amber-950"
                                    onClick={() => toggleCreatorComplianceFlag(elementKey(card.id, row.elementId))}
                                  >
                                    Clear handoff flag
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
            ) : (
            <>
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Status</label>
                {card.status === "published" ? (
                  <div className="w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] text-[13px] font-medium text-[var(--text-secondary)] flex items-center cursor-not-allowed">
                    Published
                  </div>
                ) : (
                  <select
                    value={card.status}
                    onChange={(e) => updateCard(card.id, { status: e.target.value as CardStatus })}
                    className="w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--text-primary)] outline-none transition-colors focus:border-neutral-400 hover:border-[var(--border)] cursor-pointer appearance-none"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
                  >
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="approved">Approved</option>
                  </select>
                )}
              </div>
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Title</label>
                <input
                  type="text"
                  value={card.title}
                  onChange={(e) => updateCard(card.id, { title: e.target.value })}
                  placeholder="Enter title…"
                  className="w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--text-primary)] placeholder:text-neutral-300 outline-none transition-colors focus:border-neutral-400 hover:border-[var(--border)]"
                />
              </div>
              {card.channel === "email" && (
                <>
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Subject Line</label>
                    <input
                      type="text"
                      value={card.subjectLine ?? ""}
                      onChange={(e) => updateCard(card.id, { subjectLine: e.target.value })}
                      placeholder="Enter subject line…"
                      className="w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--text-primary)] placeholder:text-neutral-300 outline-none transition-colors focus:border-neutral-400 hover:border-[var(--border)]"
                    />
                  </div>
                </>
              )}
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Tags</label>
                <TagsEditor
                  tags={card.tags ?? []}
                  onChange={(tags) => updateCard(card.id, { tags })}
                  allTags={Array.from(new Set(cards.flatMap((c) => c.tags ?? [])))}
                />
              </div>
              {card.channel === "sms" && (() => {
                const bodyEl = card.elements.find((e) => e.type === "body");
                const charCount = bodyEl?.content.length ?? 0;
                const maxSingle = 160;
                const segmentSize = 153;
                const segments = charCount === 0 ? 0 : charCount <= maxSingle ? 1 : Math.ceil(charCount / segmentSize);
                const ratio = Math.min(charCount / maxSingle, 1);
                return (
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2 block">Character Count</label>
                    <div className="flex items-center gap-3">
                      <SmsCharRing ratio={ratio} over={charCount > maxSingle} />
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className={cn("text-[16px] font-bold tabular-nums", charCount > maxSingle ? "text-amber-500" : charCount >= 140 ? "text-orange-500" : "text-[var(--text-primary)]")}>
                            {charCount}
                          </span>
                          <span className="text-[13px] text-[var(--text-muted)]">/ {maxSingle}</span>
                        </div>
                        <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
                          {segments === 0 ? "Empty message" : segments === 1 ? "Single SMS segment" : `${segments} segments (concatenated)`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
              {regulatedCanvas && element && (
                <InlineClaimsSuggestions card={card} element={element} />
              )}
            </>
            )}

              {/* Elements list */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Assets</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAddMenu(!showAddMenu)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-active)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      <PlusIcon className="w-3 h-3" />
                      Add
                    </button>
                    {showAddMenu && (
                      <div className="absolute right-0 top-full mt-1 w-36 rounded-lg bg-[var(--surface)] shadow-[var(--shadow-dropdown)] border border-[var(--border)] z-20 py-1 overflow-hidden">
                        {ELEMENT_TYPES.map(({ type, label }) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleAddElement(type)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[var(--surface-hover)] transition-colors"
                          >
                            <ContentTypeIcon type={type} size="sm" />
                            <span className="text-[13px] font-medium text-[var(--text-secondary)]">{label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {card.elements.length === 0 ? (
                  <p className="text-[13px] text-[var(--text-muted)] py-3 text-center">No elements yet</p>
                ) : (
                  <div className="space-y-0.5">
                    {card.elements.map((el, idx) => {
                      const isActive = selectedElement?.elementId === el.id;
                      return (
                        <div
                          key={el.id}
                          draggable
                          onDragStart={() => { dragItem.current = idx; }}
                          onDragEnter={() => { dragOverItem.current = idx; }}
                          onDragEnd={handleReorder}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => selectElement(card.id, el.id)}
                          className={cn(
                            "group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
                            isActive ? "bg-[var(--surface-active)] shadow-sm" : "hover:bg-[var(--surface-hover)]",
                          )}
                        >
                          <div className="relative flex-shrink-0 w-4 h-4 flex items-center justify-center">
                            <ContentTypeIcon type={el.type} size="sm" className="group-hover:opacity-0 transition-opacity" />
                            <GripIcon className="w-4 h-4 text-[var(--text-primary)] absolute inset-0 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <span className={cn("text-[13px] font-medium truncate flex-1 min-w-0", isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>
                            {ELEMENT_TYPES.find((t) => t.type === el.type)?.label ?? el.type}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveElement(el.id); }}
                            className="w-5 h-5 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                            title="Delete element"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                          <ElementLinkButton cardId={card.id} elementType={el.type} cards={cards} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Variants */}
              {(card.variants?.length ?? 0) > 0 && (
                <div className="px-4 py-3 border-b border-[var(--border)]">
                  <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2 block">Variants</label>
                  <div className="space-y-1">
                    <div
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] cursor-pointer transition-colors",
                        !selectedVariantId ? "selected-row font-medium" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]",
                      )}
                      onClick={() => selectVariant(card.id, null)}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", !selectedVariantId ? "bg-[#0F8EFF]" : "bg-neutral-300")} />
                      <span className="truncate flex-1">Default</span>
                      <StatusBadge status={card.status} size="xs" />
                    </div>
                    {card.variants!.map((v) => {
                      const isActive = selectedVariantId === v.id;
                      return (
                        <div
                          key={v.id}
                          className={cn(
                            "group/variant flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] cursor-pointer transition-colors",
                            isActive ? "selected-row font-medium" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]",
                          )}
                          onClick={() => selectVariant(card.id, v.id)}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", isActive ? "bg-[#0F8EFF]" : "bg-neutral-300")} />
                          <span className="truncate flex-1">{v.label}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeVariant(card.id, v.id); if (isActive) selectVariant(card.id, null); }}
                            className="w-5 h-5 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover/variant:opacity-100 flex-shrink-0"
                            title="Delete variant"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                          <StatusBadge status={v.status} size="xs" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </>
          ) : (
            /* Code mode — full syntax-highlighted editor */
            <InlineCodeEditor card={card} selectedElement={element} />
          )}
        </div>

        {/* Sticky publish footer — email only */}
        {card.channel === "email" && card.status !== "published" && (
          <div className="shrink-0 px-4 py-3 border-t border-[var(--border)] bg-[var(--surface)]">
            <button
              type="button"
              disabled={isPublishingGlobal}
              onClick={() => publishCards([card.id])}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-[#0F8EFF] text-[13px] font-semibold text-white hover:bg-[#0D7DE6] transition-colors disabled:opacity-70"
            >
              {regulatedCanvas ? "Submit for review" : "Publish"}
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Element Link Button ── */

function ElementLinkButton({ cardId, elementType, cards }: { cardId: string; elementType: string; cards: ChannelCard[] }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isUnlinked, setIsUnlinked] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  const linkedCards = useMemo(() => {
    if (isUnlinked) return [];
    return cards.filter((c) => c.id !== cardId && c.elements.some((el) => el.type === elementType));
  }, [cards, cardId, elementType, isUnlinked]);

  const hasLinks = linkedCards.length > 0;

  const estimatedHeight = hasLinks
    ? 32 + Math.min(linkedCards.length, 8) * 28
    : 68;

  const positionPopover = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const screenH = window.innerHeight;
    const screenW = window.innerWidth;
    const tooltipW = 192;
    const gap = 6;
    const margin = 8;
    const minPopoverH = 120;

    let left = rect.right + gap;
    if (left + tooltipW > screenW - margin) {
      left = rect.left - tooltipW - gap;
    }
    if (left < margin) left = margin;

    const spaceBelow = screenH - rect.bottom - gap - margin;
    const spaceAbove = rect.top - gap - margin;

    let top: number;
    let maxH: number;

    if (spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove) {
      top = rect.bottom + gap;
      maxH = Math.max(spaceBelow, minPopoverH);
      if (top + maxH > screenH - margin) {
        top = Math.max(margin, screenH - margin - maxH);
      }
    } else {
      maxH = Math.max(Math.min(spaceAbove, estimatedHeight), minPopoverH);
      top = rect.top - gap - maxH;
      if (top < margin) {
        top = margin;
        maxH = rect.top - gap - margin;
      }
    }

    setTooltipStyle({ top, left, maxHeight: maxH });
  }, [estimatedHeight]);

  useEffect(() => {
    if (!showTooltip) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setShowTooltip(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTooltip]);

  const togglePopover = () => {
    if (isUnlinked) return;
    if (showTooltip) {
      setShowTooltip(false);
    } else {
      positionPopover();
      setShowTooltip(true);
    }
  };

  const handleUnlink = () => {
    setIsUnlinked(true);
    setShowTooltip(false);
  };

  return (
    <div
      className="flex-shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={btnRef}
        type="button"
        onClick={togglePopover}
        className={cn(
          "w-5 h-5 flex items-center justify-center rounded transition-all",
          isUnlinked
            ? "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            : hasLinks
              ? "text-[#0F8EFF] hover:bg-blue-50"
              : "text-neutral-300 hover:text-[var(--text-muted)] hover:bg-[var(--surface-hover)]",
        )}
        title={isUnlinked ? "Unlinked" : hasLinks ? "Linked — click to see details" : "Not linked"}
      >
        {isUnlinked ? <BrokenLinkIcon className="w-3 h-3" /> : <LinkChainIcon className="w-3 h-3" />}
      </button>

      {showTooltip && !isUnlinked && (
        <div
          ref={popoverRef}
          className="fixed w-48 rounded-lg bg-[var(--surface)] shadow-[var(--shadow-dropdown)] border border-[var(--border)] z-[100] flex flex-col overflow-hidden"
          style={tooltipStyle}
        >
          <div className="px-3 py-2 border-b border-[var(--border)] shrink-0 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
              {hasLinks ? "Also used in" : "Not linked"}
            </span>
            {hasLinks && (
              <button
                type="button"
                onClick={handleUnlink}
                className="flex items-center gap-1 text-[13px] font-medium text-[#0A6DC9] hover:text-[#085BAA] transition-colors"
              >
                <BrokenLinkIcon className="w-3 h-3" />
                Unlink
              </button>
            )}
          </div>
          {hasLinks ? (
            <div className="py-1 overflow-y-auto min-h-0 flex-1">
              {linkedCards.map((c) => (
                <div key={c.id} className="px-3 py-1.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F8EFF] flex-shrink-0" />
                  <span className="text-[13px] text-[var(--text-secondary)] truncate">{c.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2">
              <p className="text-[13px] text-[var(--text-muted)]">This element is not shared with other content.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LinkChainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function UnlinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l1.72-1.71" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function BrokenLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 17H7A5 5 0 0 1 7 7" />
      <path d="M15 7h2a5 5 0 0 1 4 8" />
      <line x1="8" y1="12" x2="12" y2="12" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

/* ── Subcomponents ── */

function MenuAction({
  icon,
  label,
  onClick,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}) {
  const isDanger = variant === "danger";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
        isDanger ? "hover:bg-red-500/10" : "hover:bg-[var(--surface-hover)]",
      )}
    >
      <span className={cn("flex-shrink-0", isDanger ? "text-red-400" : "text-[var(--text-secondary)]")}>
        {icon}
      </span>
      <span className={cn("text-[13px] font-medium", isDanger ? "text-red-400" : "text-[var(--text-primary)]")}>
        {label}
      </span>
    </button>
  );
}

function SmsCharRing({ ratio, over }: { ratio: number; over: boolean }) {
  const size = 36;
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - ratio * c;
  const color = over ? "#f59e0b" : ratio >= 0.875 ? "#f97316" : ratio > 0 ? "#3b82f6" : "#e5e7eb";
  return (
    <svg width={size} height={size} className="-rotate-90 flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-200" />
    </svg>
  );
}

/* ── Tags Editor ── */

function TagsEditor({ tags, onChange, allTags = [] }: { tags: string[]; onChange: (tags: string[]) => void; allTags?: string[] }) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const q = input.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (!q) return [];
    return allTags.filter((t) => t.toLowerCase().includes(q) && !tags.includes(t));
  }, [q, allTags, tags]);

  const noMatches = q.length > 0 && suggestions.length === 0;

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) {
      onChange([...tags, t]);
    }
    setInput("");
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        addTag(suggestions[0]);
      } else if (q) {
        addTag(q);
      }
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapperRef}>
      {/* Input field + dropdown anchor */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search or create tag…"
          className="w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text-primary)] placeholder:text-neutral-300 outline-none transition-colors focus:border-neutral-400 hover:border-[var(--border)]"
        />

        {/* Typeahead dropdown */}
        {showSuggestions && q && (
          <div className="absolute left-0 right-0 top-full mt-1 rounded-lg bg-[var(--surface)] shadow-[var(--shadow-dropdown)] border border-[var(--border)] z-20 overflow-hidden">
            {suggestions.length > 0 ? (
              <div className="py-1 max-h-32 overflow-y-auto">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addTag(s)}
                    className="w-full flex items-center px-3 py-1.5 text-left hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <span className="text-[13px] font-medium text-[var(--text-secondary)]">{s}</span>
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => addTag(q)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--surface-hover)] transition-colors"
              >
                <PlusIcon className="w-3 h-3 text-[var(--text-muted)]" />
                <span className="text-[13px] font-medium text-[var(--text-secondary)]">Create &ldquo;{q}&rdquo;</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tags below input */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--surface-active)] text-[13px] font-medium text-[var(--text-secondary)]"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <CloseIcon className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Inline Code Editor ── */

type CodeSection = "image" | "headline" | "body" | "cta" | "footer" | null;

/** Maps each line of the generated HTML to the element ID it belongs to (via data-eid). */
function mapLineElementIds(html: string): (string | null)[] {
  const lines = html.split("\n");
  const ids: (string | null)[] = new Array(lines.length).fill(null);
  let currentEid: string | null = null;
  let inBody = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!inBody) {
      if (l.includes("<body")) inBody = true;
      continue;
    }
    // Check if this line opens an element with data-eid
    const eidMatch = l.match(/data-eid="([^"]+)"/);
    if (eidMatch) {
      currentEid = eidMatch[1];
      ids[i] = currentEid;
      // Self-closing tags (img, hr) — single line
      if (l.includes("/>")) { currentEid = null; }
      continue;
    }
    // End of a section div — still belongs to the current element
    if (currentEid && l.trim() === "</div>") {
      ids[i] = currentEid;
      currentEid = null;
      continue;
    }
    if (currentEid) ids[i] = currentEid;
    // Footer
    if (l.includes('class="email-footer"')) { currentEid = null; }
  }
  return ids;
}

function mapLineSections(html: string): CodeSection[] {
  const lines = html.split("\n");
  const sections: CodeSection[] = new Array(lines.length).fill(null);
  let inBody = false;
  let current: CodeSection = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!inBody) {
      if (l.includes("<body")) inBody = true;
      continue;
    }
    if (l.includes('class="hero-image"') || l.includes('class="logo"')) { sections[i] = "image"; continue; }
    if (l.includes('class="section-padded"') && l.includes("data-eid")) {
      // Could be headline or cta — check next lines
      current = "headline";
    }
    if (l.includes('class="section"') && l.includes("data-eid")) { current = "body"; }
    if (l.includes('class="cta-button"')) { sections[i] = "cta"; if (current === "headline") current = null; continue; }
    if (l.includes('class="email-footer"')) { current = "footer"; }
    if (l.includes("</div>") && current) {
      sections[i] = current; current = null; continue;
    }
    if (current) sections[i] = current;
  }
  return sections;
}

function tokenizeHtmlLine(line: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const re = /(<\/?)([\w-]+)((?:\s+[\w-]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]*))?)*)\s*(\/?>)|(&[\w#]+;)|([^<&]+)/g;
  let m: RegExpExecArray | null;
  let key = 0;
  const attrRe = /([\w-]+)(=)("[^"]*"|'[^']*')/g;
  while ((m = re.exec(line)) !== null) {
    if (m[1] !== undefined && m[2] !== undefined) {
      tokens.push(<span key={key++} className="text-[var(--text-secondary)]">{m[1]}</span>);
      tokens.push(<span key={key++} className="text-rose-500">{m[2]}</span>);
      if (m[3]) {
        const attrStr = m[3];
        let am: RegExpExecArray | null;
        let lastIdx = 0;
        attrRe.lastIndex = 0;
        while ((am = attrRe.exec(attrStr)) !== null) {
          if (am.index > lastIdx) {
            tokens.push(<span key={key++} className="text-[var(--text-primary)]">{attrStr.slice(lastIdx, am.index)}</span>);
          }
          tokens.push(<span key={key++} className="text-emerald-600">{am[1]}</span>);
          tokens.push(<span key={key++} className="text-[var(--text-secondary)]">{am[2]}</span>);
          tokens.push(<span key={key++} className="text-sky-600">{am[3]}</span>);
          lastIdx = am.index + am[0].length;
        }
        if (lastIdx < attrStr.length) {
          tokens.push(<span key={key++} className="text-[var(--text-primary)]">{attrStr.slice(lastIdx)}</span>);
        }
      }
      tokens.push(<span key={key++} className="text-[var(--text-secondary)]">{m[4]}</span>);
    } else if (m[5]) {
      tokens.push(<span key={key++} className="text-amber-600">{m[5]}</span>);
    } else if (m[6]) {
      tokens.push(<span key={key++} className="text-[var(--text-primary)]">{m[6]}</span>);
    }
  }
  if (tokens.length === 0) tokens.push(<span key={0}>{line || "\n"}</span>);
  return tokens;
}

const ELEMENT_TYPE_TO_SECTION: Record<string, CodeSection> = {
  headline: "headline",
  body: "body",
  cta: "cta",
  image: "image",
  divider: null,
};

function InlineCodeEditor({ card, selectedElement }: { card: ChannelCard; selectedElement: ContentElement | null }) {
  const [html, setHtml] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const { selectElement, updateElement } = useSimpleCanvasStore();
  // Track whether the HTML was just regenerated from the store to avoid re-parsing
  const skipSyncRef = useRef(false);

  // Sync highlight when a canvas element is selected
  useEffect(() => {
    if (selectedElement) {
      setActiveElementId(selectedElement.id);
    } else {
      setActiveElementId(null);
    }
  }, [selectedElement?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate HTML from card elements
  useEffect(() => {
    skipSyncRef.current = true;
    setHtml(cardToHtml(card));
  }, [card.id, card.elements]); // eslint-disable-line react-hooks/exhaustive-deps

  const lineElementIds = useMemo(() => mapLineElementIds(html), [html]);

  // Scroll to highlighted element
  useEffect(() => {
    if (!activeElementId || !scrollRef.current) return;
    const idx = lineElementIds.indexOf(activeElementId);
    if (idx < 0) return;
    const lineH = 18;
    scrollRef.current.scrollTo({ top: Math.max(0, idx * lineH - 40), behavior: "smooth" });
  }, [activeElementId, lineElementIds]);

  // Parse HTML edits back to the store
  const syncToStore = useCallback(
    (source: string) => {
      if (skipSyncRef.current) { skipSyncRef.current = false; return; }
      // Extract content for each data-eid block from the edited HTML
      const eidRegex = /data-eid="([^"]+)"/g;
      let match: RegExpExecArray | null;
      const seen = new Set<string>();
      while ((match = eidRegex.exec(source)) !== null) {
        const eid = match[1];
        if (seen.has(eid)) continue;
        seen.add(eid);
        const el = card.elements.find((e) => e.id === eid);
        if (!el) continue;

        // Extract text content for this element from the surrounding HTML
        let newContent: string | undefined;
        if (el.type === "headline") {
          const h1 = source.match(new RegExp(`data-eid="${eid}"[^>]*>[\\s\\S]*?<h1>([\\s\\S]*?)</h1>`));
          if (h1) newContent = unescapeHtml(h1[1].trim());
        } else if (el.type === "body") {
          const bodyBlock = source.match(new RegExp(`data-eid="${eid}"[^>]*>([\\s\\S]*?)</div>`));
          if (bodyBlock) {
            const pTags = [...bodyBlock[1].matchAll(/<p>([\s\S]*?)<\/p>/g)];
            if (pTags.length > 0) newContent = pTags.map((p) => unescapeHtml(p[1].trim())).join("\n\n");
          }
        } else if (el.type === "cta") {
          const cta = source.match(new RegExp(`data-eid="${eid}"[^>]*>[\\s\\S]*?<a[^>]*>([\\s\\S]*?)</a>`));
          if (cta) newContent = unescapeHtml(cta[1].trim());
        }

        if (newContent !== undefined && newContent !== el.content) {
          updateElement(card.id, eid, { content: newContent });
        }
      }
    },
    [card.id, card.elements, updateElement],
  );

  const handleChange = useCallback(
    (value: string) => {
      skipSyncRef.current = false;
      setHtml(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => syncToStore(value), 600);
    },
    [syncToStore],
  );

  // Detect clicked line from textarea cursor position and select the element
  const handleTextareaCursorMove = useCallback(() => {
    // Use requestAnimationFrame to ensure the browser has updated selectionStart
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      const pos = ta.selectionStart;
      const textBefore = html.slice(0, pos);
      const lineIndex = textBefore.split("\n").length - 1;
      const eid = lineElementIds[lineIndex];
      if (eid && eid !== activeElementId) {
        setActiveElementId(eid);
        selectElement(card.id, eid);
      }
    });
  }, [html, lineElementIds, card.id, selectElement, activeElementId]);

  const lines = html.split("\n");

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Syntax-highlighted editor */}
      <div ref={scrollRef} className="relative flex-1 min-h-0 overflow-auto">
        <div className="relative min-h-full">
          {/* Highlighted lines layer */}
          <pre
            className="py-3 pl-[3rem] pr-3 font-mono text-[13px] leading-[18px] pointer-events-none whitespace-pre-wrap break-all select-none"
            aria-hidden
          >
            {lines.map((line, i) => {
              const eid = lineElementIds[i];
              const isHighlighted = activeElementId && eid === activeElementId;
              return (
                <div
                  key={i}
                  className={cn(
                    "transition-colors duration-150 -mx-3 px-3",
                    isHighlighted && "bg-[#0176D3]/8 border-l-2 border-l-[#0176D3] !pl-[calc(0.75rem-2px)]",
                  )}
                >
                  {tokenizeHtmlLine(line)}
                </div>
              );
            })}
          </pre>

          {/* Editable textarea overlay */}
          <textarea
            ref={textareaRef}
            value={html}
            onChange={(e) => handleChange(e.target.value)}
            onMouseUp={handleTextareaCursorMove}
            onKeyUp={handleTextareaCursorMove}
            spellCheck={false}
            className={cn(
              "absolute inset-0 w-full h-full resize-none bg-transparent py-3 pl-[3rem] pr-3 font-mono text-[13px] leading-[18px] text-transparent caret-neutral-900 whitespace-pre-wrap break-all",
              "outline-none selection:bg-neutral-900/10",
            )}
          />

          {/* Line numbers */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0 left-0 w-[2.5rem] select-none overflow-hidden border-r border-[var(--border)] bg-[var(--surface-subtle)] py-3 pr-2 text-right font-mono text-[13px] leading-[18px] text-neutral-300"
          >
            {lines.map((_, i) => {
              const eid = lineElementIds[i];
              const isHighlighted = activeElementId && eid === activeElementId;
              return (
                <div key={i} className={cn(isHighlighted && "text-[#0176D3] font-medium")}>
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer: char count */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-[var(--border)] shrink-0">
        <span className="text-[13px] text-[var(--text-muted)]">{lines.length} lines</span>
        <span className="text-[13px] tabular-nums text-[var(--text-muted)]">{html.length.toLocaleString()} chars</span>
      </div>
    </div>
  );
}

function unescapeHtml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

/* ── Variant Elements List ── */

function VariantElementsList({
  card,
  variant,
  cards,
  addVariantElement,
  removeVariantElement,
  reorderVariantElements,
  selectElement,
  selectedElement,
}: {
  card: ChannelCard;
  variant: CardVariant;
  cards: ChannelCard[];
  addVariantElement: (cardId: string, variantId: string, element: ContentElement) => void;
  removeVariantElement: (cardId: string, variantId: string, elementId: string) => void;
  reorderVariantElements: (cardId: string, variantId: string, elements: ContentElement[]) => void;
  selectElement: (cardId: string, elementId: string) => void;
  selectedElement: { cardId: string; elementId: string } | null;
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleAddElement = (type: ContentElement["type"]) => {
    const id = `${type}-v-${Date.now()}`;
    const content = type === "divider" ? "" : type === "image" ? "New image" : `New ${type}`;
    addVariantElement(card.id, variant.id, { id, type, content });
    setShowAddMenu(false);
    selectElement(card.id, id);
  };

  const handleReorder = useCallback(() => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;
    const reordered = [...variant.elements];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, moved);
    reorderVariantElements(card.id, variant.id, reordered);
    dragItem.current = null;
    dragOverItem.current = null;
  }, [variant.elements, card.id, variant.id, reorderVariantElements]);

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Assets</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-active)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <PlusIcon className="w-3 h-3" />
            Add
          </button>
          {showAddMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 rounded-lg bg-[var(--surface)] shadow-[var(--shadow-dropdown)] border border-[var(--border)] z-20 py-1 overflow-hidden">
              {ELEMENT_TYPES.map(({ type, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleAddElement(type)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <ContentTypeIcon type={type} size="sm" />
                  <span className="text-[13px] font-medium text-[var(--text-secondary)]">{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {variant.elements.length === 0 ? (
        <p className="text-[13px] text-[var(--text-muted)] py-3 text-center">No elements yet</p>
      ) : (
        <div className="space-y-0.5">
          {variant.elements.map((el, idx) => {
            const isActive = selectedElement?.cardId === card.id && selectedElement?.elementId === el.id;
            return (
              <div
                key={el.id}
                draggable
                onDragStart={() => { dragItem.current = idx; }}
                onDragEnter={() => { dragOverItem.current = idx; }}
                onDragEnd={handleReorder}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => selectElement(card.id, el.id)}
                className={cn(
                  "group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
                  isActive ? "bg-[var(--surface-active)] shadow-sm" : "hover:bg-[var(--surface-hover)]",
                )}
              >
                <div className="relative flex-shrink-0 w-4 h-4 flex items-center justify-center">
                  <ContentTypeIcon type={el.type} size="sm" className="group-hover:opacity-0 transition-opacity" />
                  <GripIcon className="w-4 h-4 text-[var(--text-primary)] absolute inset-0 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className={cn("text-[13px] font-medium truncate flex-1 min-w-0", isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>
                  {ELEMENT_TYPES.find((t) => t.type === el.type)?.label ?? el.type}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeVariantElement(card.id, variant.id, el.id); }}
                  className="w-5 h-5 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                  title="Delete element"
                >
                  <TrashIcon className="w-3 h-3" />
                </button>
                <ElementLinkButton cardId={card.id} elementType={el.type} cards={cards} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Icons ── */

function InspectorChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function DesignIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function DuplicateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function VariantIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="M2 12a1 1 0 0 0 .6.91l8.57 3.89a2 2 0 0 0 1.65 0l8.58-3.89a1 1 0 0 0 0-1.83" />
      <path d="M2 17a1 1 0 0 0 .6.91l8.57 3.89a2 2 0 0 0 1.65 0l8.58-3.89a1 1 0 0 0 0-1.83" />
    </svg>
  );
}

function DeleteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function GripIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
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

function GroupIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="8" height="8" rx="1.5" />
      <rect x="14" y="3" width="8" height="8" rx="1.5" />
      <rect x="2" y="13" width="8" height="8" rx="1.5" />
      <rect x="14" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}
