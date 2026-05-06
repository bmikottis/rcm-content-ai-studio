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
import { useRegulatedContentStore, elementKey, APPROVED_CLAIMS, filterClaimsForContext } from "@/stores/regulated-content";
import { ComplianceFlagIcon } from "@/components/regulated/ComplianceFlagIcon";
import { extractVisibleLinkedClaimCodes } from "@/lib/linked-claims";
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
  const { selectedCardId, selectedCardIds, selectedElement, selectedVariantId, cards, removeCard, clearSelection, updateCard, addCard, selectElement, addElement, removeElement, updateVariantElement, addVariantElement, removeVariantElement, reorderVariantElements, removeVariant, addVariant, selectVariant, createGroup, cardGroups, selectedGroupId, renameGroup, removeGroup, duplicateGroup, addGroupTag, removeGroupTag, removeFromGroup, focusCard, pulseComplianceOnElement, focusLinkedClaimCode } =
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

  const linkedClaims = useMemo(() => {
    if (!card) return [];
    return card.elements.flatMap((el) => {
      const codes = extractVisibleLinkedClaimCodes(el, APPROVED_CLAIMS);
      return codes.map((code, idx) => {
        const claim = APPROVED_CLAIMS.find((c) => c.code === code);
        return {
          id: `${el.id}:${code}:${idx}`,
          elementId: el.id,
          blockLabel: ELEMENT_TYPES.find((t) => t.type === el.type)?.label ?? el.type,
          code,
          status: claim?.status ?? "approved",
          adjusted: Boolean(el.linkedClaimAdjustments?.[code]),
          adjustmentComment: el.linkedClaimAdjustments?.[code]?.comment ?? null,
          body: claim?.body ?? null,
          references: claim?.references ?? [],
        };
      });
    });
  }, [card]);

  const handleLinkedClaimClick = useCallback((elementId: string, claimCode: string) => {
    if (!card) return;
    focusCard(card.id);
    selectElement(card.id, elementId);
    pulseComplianceOnElement(card.id, elementId);
    focusLinkedClaimCode(claimCode);
  }, [focusCard, selectElement, pulseComplianceOnElement, focusLinkedClaimCode, card]);

  const profile = useRegulatedContentStore((s) => s.profile);
  const creatorFlags = useRegulatedContentStore((s) => s.creatorComplianceFlags);
  const dismissedComplianceFlags = useRegulatedContentStore((s) => s.dismissedComplianceFlags);
  const toggleCreatorComplianceFlag = useRegulatedContentStore((s) => s.toggleCreatorComplianceFlag);
  const dismissComplianceFlag = useRegulatedContentStore((s) => s.dismissComplianceFlag);

  const cardComplianceIssues = useMemo(() => {
    if (!card || card.channel !== "email") return [];
    return scanCardsForCompliance(cards, profile, creatorFlags).filter((i) => i.cardId === card.id);
  }, [card, cards, profile, creatorFlags]);

  const regulatedAnchors = useMemo(() => {
    if (!card || card.channel !== "email") return null;
    return regulatedEmailChromeAnchors(card.elements);
  }, [card]);

  const regulatedFlagRows = useMemo(() => {
    if (!card || card.channel !== "email") return [];
    const flagIds = regulatedAnchors?.flagIds ?? new Set<string>();
    const bodies = card.elements.filter((e) => e.type === "body");
    const firstBodyId = bodies[0]?.id;
    const lastBodyId = bodies[bodies.length - 1]?.id;
    const rows: {
      elementId: string;
      blockLabel: string;
      detail: string;
      hasCreator: boolean;
      hasScanIssue: boolean;
      dismissible: boolean;
    }[] = [];
    for (const elementId of flagIds) {
      const el = card.elements.find((e) => e.id === elementId);
      if (!el) continue;
      const flagKey = elementKey(card.id, elementId);
      const dismissed = Boolean(dismissedComplianceFlags[flagKey]);
      const onElement = cardComplianceIssues.filter((i) => i.elementId === elementId && (i.ruleId === "CR-CREATOR-01" || !dismissed));
      const scanIssues = onElement.filter((i) => i.ruleId !== "CR-CREATOR-01");
      const hasCreator = Boolean(creatorFlags[elementKey(card.id, elementId)]);
      if (scanIssues.length === 0 && !hasCreator) continue;
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
        hasScanIssue: scanIssues.length > 0,
        dismissible: scanIssues.every((i) => i.severity !== "error"),
      });
    }
    return rows;
  }, [card, cardComplianceIssues, creatorFlags, dismissedComplianceFlags, regulatedAnchors]);

  const recommendationCountByElement = useMemo(() => {
    const map = new Map<string, number>();
    if (!regulatedCanvas || !card) return map;
    for (const el of card.elements) {
      if (el.type === "divider") continue;
      if (!regulatedAnchors?.claimHintIds.has(el.id)) {
        map.set(el.id, 0);
        continue;
      }
      const src = el.type === "image" ? (el.imageData?.src?.toLowerCase() ?? "") : "";
      const alt = el.type === "image" ? (el.imageData?.alt?.toLowerCase() ?? "") : "";
      const descriptor = `${el.content} ${alt} ${src}`.toLowerCase();
      const isLogoImage =
        el.type === "image" &&
        (/\blogo\b|\bwordmark\b|\bbrand mark\b|\blockup\b/.test(descriptor) ||
          /\/logo[\w-]*\.(png|jpe?g|webp|svg)$/.test(src));
      if (isLogoImage) {
        map.set(el.id, 0);
        continue;
      }
      const key = elementKey(card.id, el.id);
      const dismissed = useRegulatedContentStore.getState().dismissedByElement[key] ?? [];
      const linked = extractVisibleLinkedClaimCodes(el, APPROVED_CLAIMS);
      const count = filterClaimsForContext({
        profile,
        channel: card.channel as "email" | "sms",
        elementType: el.type,
        dismissedIds: dismissed,
      }).filter((claim) => !linked.includes(claim.code)).length;
      map.set(el.id, count);
    }
    return map;
  }, [regulatedCanvas, card, profile, regulatedAnchors]);

  const complianceCountByElement = useMemo(() => {
    const map = new Map<string, number>();
    if (!regulatedCanvas || !card) return map;
    for (const row of regulatedFlagRows) {
      map.set(row.elementId, (map.get(row.elementId) ?? 0) + 1);
    }
    return map;
  }, [regulatedCanvas, card, regulatedFlagRows]);

  const frameRecommendationCount = useMemo(
    () => Array.from(recommendationCountByElement.values()).reduce((sum, n) => sum + n, 0),
    [recommendationCountByElement],
  );
  const frameComplianceCount = regulatedFlagRows.length;

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
  const [regulatedContentDetailsOpen, setRegulatedContentDetailsOpen] = useState(false);
  const [linkedClaimsOpen, setLinkedClaimsOpen] = useState(false);
  const { isPublishing: isPublishingGlobal, publishCards } = usePublishStore();

  const submitEmailCardsForReview = useCallback(
    (ids: string[]) => {
      if (!regulatedCanvas) {
        publishCards(ids);
        return;
      }
      const list = ids.filter((id) => {
        const c = cards.find((x) => x.id === id);
        return c && c.status !== "published" && c.status !== "review";
      });
      if (list.length === 0) {
        toast.info("Selected content is already in review or published.");
        return;
      }
      for (const id of list) updateCard(id, { status: "review" });
      toast.success(
        list.length === 1
          ? `"${cards.find((c) => c.id === list[0])?.title ?? "Block"}" submitted for review.`
          : `${list.length} blocks submitted for review.`,
      );
    },
    [regulatedCanvas, cards, updateCard, publishCards],
  );

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
                  <option value="review">In review</option>
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
                        st === "ready"
                          ? "bg-emerald-500"
                          : st === "review"
                            ? "bg-violet-500"
                            : st === "published"
                              ? "bg-blue-500"
                              : st === "generating"
                                ? "bg-amber-500"
                                : "bg-neutral-300",
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
                  onClick={() => submitEmailCardsForReview(unpublished.map((c) => c.id))}
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
                  <option value="review">In review</option>
                  <option value="approved">Approved</option>
                </select>
              )}
              <div className="mt-2 space-y-1">
                {Object.entries(statusCounts).map(([st, count]) => (
                  <div key={st} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        st === "ready"
                          ? "bg-emerald-500"
                          : st === "review"
                            ? "bg-violet-500"
                            : st === "published"
                              ? "bg-blue-500"
                              : st === "generating"
                                ? "bg-amber-500"
                                : "bg-neutral-300",
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
                  onClick={() => submitEmailCardsForReview(unpublished.map((c) => c.id))}
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

    const variantInspectorReadOnly = regulatedCanvas && card.status === "review";

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
              {variantInspectorReadOnly ? (
                <div className="w-full min-h-8 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] text-[13px] font-medium text-[var(--text-primary)]">
                  {selectedVariant.label}
                </div>
              ) : (
                <input
                  type="text"
                  value={selectedVariant.label}
                  onChange={(e) => handleVariantLabelChange(e.target.value)}
                  placeholder="Variant label…"
                  className="w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--text-primary)] placeholder:text-neutral-300 outline-none transition-colors focus:border-neutral-400 hover:border-[var(--border)]"
                />
              )}
            </div>

            {/* Status */}
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Status</label>
              {variantInspectorReadOnly ? (
                <StatusBadge status={selectedVariant.status} size="sm" />
              ) : (
              <select
                value={selectedVariant.status}
                onChange={(e) => handleVariantStatusChange(e.target.value as CardStatus)}
                className="w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] font-medium text-[var(--text-primary)] outline-none transition-colors focus:border-neutral-400 hover:border-[var(--border)] cursor-pointer appearance-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
              >
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="review">In review</option>
                <option value="approved">Approved</option>
              </select>
              )}
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
              readOnly={variantInspectorReadOnly}
            />
          </div>

          {/* Delete variant footer */}
          {!variantInspectorReadOnly && (
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
          )}
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

  const inspectorReadOnly = regulatedCanvas && card.status === "review";

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
        <div
          className={cn(
            "flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4",
            regulatedCanvas ? "min-h-[52px] py-2" : "h-[44px]",
          )}
        >
          <div className={cn("flex gap-2 min-w-0 flex-1", regulatedCanvas ? "items-start" : "items-center")}>
            <div className={cn(regulatedCanvas && "mt-0.5")}>
              <ContentTypeIcon type={card.channel} size="sm" />
            </div>
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
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-[var(--text-primary)]">{card.title}</span>
                {regulatedCanvas && (frameComplianceCount > 0 || frameRecommendationCount > 0) && (
                  <div className="mt-1 mb-0.5 flex items-center gap-1.5">
                    {frameComplianceCount > 0 && (
                      <span className="group relative inline-flex">
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700"
                          aria-label={`${frameComplianceCount} compliance flags on this frame`}
                        >
                          <ComplianceFlagIcon className="h-3 w-3" />
                          {frameComplianceCount}
                        </span>
                        <span className="pointer-events-none absolute left-0 top-full z-30 mt-1 hidden whitespace-nowrap rounded-md bg-[var(--text-primary)] px-2 py-1 text-[10px] font-medium text-white shadow-lg group-hover:block">
                          Compliance flags on this frame
                        </span>
                      </span>
                    )}
                    {frameRecommendationCount > 0 && (
                      <span className="group relative inline-flex">
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700"
                          aria-label={`${frameRecommendationCount} AI suggestions available on this frame`}
                        >
                          <SparklesMiniIcon className="h-3 w-3" />
                          {frameRecommendationCount}
                        </span>
                        <span className="pointer-events-none absolute left-0 top-full z-30 mt-1 hidden whitespace-nowrap rounded-md bg-[var(--text-primary)] px-2 py-1 text-[10px] font-medium text-white shadow-lg group-hover:block">
                          AI suggestions available on this frame
                        </span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className={cn("flex items-center gap-1 flex-shrink-0", regulatedCanvas && "self-start -mt-0.5")}>
            {/* 3-dot actions menu */}
            {!inspectorReadOnly && (
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
            )}
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

        {/* Design / Code toggle — only for email blocks (hidden on regulated pharma prototype) */}
        {card.channel === "email" && !regulatedCanvas && (
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
        <div className={cn("flex-1 min-h-0", (card.channel !== "email" || inspectorMode === "design" || regulatedCanvas) ? "overflow-y-auto scrollbar-hide" : "flex flex-col")}>
          {(card.channel !== "email" || inspectorMode === "design" || regulatedCanvas) ? (
            <>
            {regulatedCanvas && !selectedVariantId ? (
            <>
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
                      Status, fields, audience context
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
                  <div>
                    {inspectorReadOnly ? (
                      <>
                        <div className="px-4 py-3">
                          <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Status</label>
                          <StatusBadge status={card.status} size="sm" />
                        </div>
                        <InspectorReadOnlyValue label="Title" value={card.title} />
                        {card.channel === "email" && (
                          <InspectorReadOnlyValue label="Subject Line" value={card.subjectLine ?? ""} />
                        )}
                        <div className="px-4 py-3">
                          <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Tags</label>
                          <TagsEditor tags={card.tags ?? []} onChange={() => {}} readOnly allTags={[]} />
                        </div>
                        {card.channel === "sms" && (() => {
                          const bodyEl = card.elements.find((e) => e.type === "body");
                          const charCount = bodyEl?.content.length ?? 0;
                          const maxSingle = 160;
                          const segmentSize = 153;
                          const segments = charCount === 0 ? 0 : charCount <= maxSingle ? 1 : Math.ceil(charCount / segmentSize);
                          const ratio = Math.min(charCount / maxSingle, 1);
                          return (
                            <div className="px-4 py-3">
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
                          <RegulatedContentProfilePanel hideHeading readOnly />
                        </div>
                      </>
                    ) : (
                    <>
                    <div className="px-4 py-3">
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
                          <option value="review">In review</option>
                          <option value="approved">Approved</option>
                        </select>
                      )}
                    </div>
                    <div className="px-4 py-3">
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
                      <div className="px-4 py-3">
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
                    <div className="px-4 py-3">
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
                    </>
                    )}
                  </div>
                )}
              </div>
              <div className="shrink-0 border-b border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setLinkedClaimsOpen((o) => !o)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors hover:bg-[var(--surface-hover)]"
                  aria-expanded={linkedClaimsOpen}
                >
                  <div className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                      Linked claims
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-[var(--text-muted)]">
                      Claims linked from the claims library to this content
                    </span>
                  </div>
                  <InspectorChevronIcon
                    className={cn(
                      "h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200",
                      linkedClaimsOpen && "rotate-180",
                    )}
                  />
                </button>
                {linkedClaimsOpen && (
                  <LinkedClaimsSection claims={linkedClaims} onClaimClick={handleLinkedClaimClick} />
                )}
              </div>
            </>
            ) : (
            <>
              {inspectorReadOnly ? (
                <>
                  <div className="px-4 py-3">
                    <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Status</label>
                    <StatusBadge status={card.status} size="sm" />
                  </div>
                  <InspectorReadOnlyValue label="Title" value={card.title} />
                  {card.channel === "email" && (
                    <InspectorReadOnlyValue label="Subject Line" value={card.subjectLine ?? ""} />
                  )}
                  <div className="px-4 py-3">
                    <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Tags</label>
                    <TagsEditor tags={card.tags ?? []} onChange={() => {}} readOnly allTags={[]} />
                  </div>
                  {card.channel === "sms" && (() => {
                    const bodyEl = card.elements.find((e) => e.type === "body");
                    const charCount = bodyEl?.content.length ?? 0;
                    const maxSingle = 160;
                    const segmentSize = 153;
                    const segments = charCount === 0 ? 0 : charCount <= maxSingle ? 1 : Math.ceil(charCount / segmentSize);
                    const ratio = Math.min(charCount / maxSingle, 1);
                    return (
                    <div className="px-4 py-3">
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
                    <RegulatedContentProfilePanel hideHeading readOnly />
                  </div>
                </>
              ) : (
                <>
              <div className="px-4 py-3">
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
                    <option value="review">In review</option>
                    <option value="approved">Approved</option>
                  </select>
                )}
              </div>
              <div className="px-4 py-3">
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
                  <div className="px-4 py-3">
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
              <div className="px-4 py-3">
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
                  <div className="px-4 py-3">
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
                </>
              )}
            </>
            )}

              {/* Elements list */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Assets</label>
                  {!inspectorReadOnly && (
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
                  )}
                </div>
                {card.elements.length === 0 ? (
                  <p className="text-[13px] text-[var(--text-muted)] py-3 text-center">No elements yet</p>
                ) : (
                  <div className="space-y-0.5">
                    {card.elements.map((el, idx) => {
                      const isActive = selectedElement?.elementId === el.id;
                      const elComplianceCount = complianceCountByElement.get(el.id) ?? 0;
                      const elRecommendationCount = recommendationCountByElement.get(el.id) ?? 0;
                      const elementFlagRows = regulatedFlagRows.filter((r) => r.elementId === el.id);
                      return (
                        <div
                          key={el.id}
                          className="space-y-2"
                        >
                          <div
                            draggable={!inspectorReadOnly}
                            onDragStart={inspectorReadOnly ? undefined : () => { dragItem.current = idx; }}
                            onDragEnter={inspectorReadOnly ? undefined : () => { dragOverItem.current = idx; }}
                            onDragEnd={inspectorReadOnly ? undefined : handleReorder}
                            onDragOver={inspectorReadOnly ? undefined : (e) => e.preventDefault()}
                            onClick={() => {
                              if (isActive) {
                                selectVariant(card.id, null);
                              } else {
                                selectElement(card.id, el.id);
                              }
                            }}
                            className={cn(
                              "group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
                              isActive ? "bg-[var(--surface-active)] shadow-sm" : "hover:bg-[var(--surface-hover)]",
                            )}
                          >
                            <div className="relative flex-shrink-0 w-4 h-4 flex items-center justify-center">
                              <ContentTypeIcon type={el.type} size="sm" className={cn(!inspectorReadOnly && "group-hover:opacity-0 transition-opacity")} />
                              {!inspectorReadOnly && (
                              <GripIcon className="w-4 h-4 text-[var(--text-primary)] absolute inset-0 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                            <div className="flex min-w-0 flex-1 items-center gap-1.5">
                              <span className={cn("text-[13px] font-medium truncate min-w-0", isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>
                                {ELEMENT_TYPES.find((t) => t.type === el.type)?.label ?? el.type}
                              </span>
                              {regulatedCanvas && elComplianceCount > 0 && (
                                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                  <ComplianceFlagIcon className="h-3 w-3" />
                                  {elComplianceCount}
                                </span>
                              )}
                              {regulatedCanvas && elRecommendationCount > 0 && (
                                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                                  <SparklesMiniIcon className="h-3 w-3" />
                                  {elRecommendationCount}
                                </span>
                              )}
                            </div>
                            {!inspectorReadOnly && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleRemoveElement(el.id); }}
                              className="w-5 h-5 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                              title="Delete element"
                            >
                              <TrashIcon className="w-3 h-3" />
                            </button>
                            )}
                            <ElementLinkButton cardId={card.id} elementType={el.type} cards={cards} />
                          </div>
                          {regulatedCanvas && isActive && (
                            <div className="px-1 space-y-2">
                              {elementFlagRows.length > 0 && (
                                <div className="rounded-lg border border-amber-500/90 bg-white/90 p-2.5 shadow-sm">
                                  <p className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-900/80">
                                    <ComplianceFlagIcon className="h-3.5 w-3.5" />
                                    Compliance flags ({elementFlagRows.length})
                                  </p>
                                  <ul className="space-y-2">
                                    {elementFlagRows.map((row) => (
                                      <li key={`asset-flag-${row.elementId}`}>
                                        <p className="text-[12px] font-semibold text-[var(--text-primary)]">{REGULATED_FLAG_VIOLATION_TITLE}</p>
                                        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{row.blockLabel}</p>
                                        <p className="mt-1 text-[11px] leading-snug text-[var(--text-muted)]">{row.detail}</p>
                                        {row.hasScanIssue && row.dismissible && !inspectorReadOnly && (
                                          <button
                                            type="button"
                                            className="mt-2 rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                                            onClick={() => dismissComplianceFlag(elementKey(card.id, row.elementId))}
                                          >
                                            Dismiss
                                          </button>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {elRecommendationCount > 0 && (
                                <InlineClaimsSuggestions card={card} element={el} readOnly={inspectorReadOnly} />
                              )}
                            </div>
                          )}
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
                          {!inspectorReadOnly && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeVariant(card.id, v.id); if (isActive) selectVariant(card.id, null); }}
                            className="w-5 h-5 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover/variant:opacity-100 flex-shrink-0"
                            title="Delete variant"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                          )}
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
            {regulatedCanvas && card.status === "review" ? (
              <p className="text-center text-[12px] leading-snug text-[var(--text-muted)]">
                This content is locked while it is in review.
              </p>
            ) : (
              <button
                type="button"
                disabled={isPublishingGlobal}
                onClick={() => submitEmailCardsForReview([card.id])}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-[#0F8EFF] text-[13px] font-semibold text-white hover:bg-[#0D7DE6] transition-colors disabled:opacity-70"
              >
                {regulatedCanvas ? "Submit for review" : "Publish"}
              </button>
            )}
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

function SparklesMiniIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M30.1565 17.0329L24.178 20.0151C22.3802 20.9066 20.9333 22.3639 20.0343 24.1531L17.0482 30.1174C16.6233 30.9659 15.4042 30.9659 14.9794 30.1174L11.9932 24.1531C11.1005 22.3639 9.64123 20.9128 7.84953 20.0151L1.88335 17.0329C1.03368 16.6087 1.03368 15.3912 1.88335 14.967L7.86185 11.9848C9.6597 11.0933 11.1066 9.63602 12.0055 7.84674L14.9856 1.88249C15.4104 1.03396 16.6295 1.03396 17.0543 1.88249L20.0405 7.84674C20.9333 9.63602 22.3925 11.0871 24.1842 11.9848L30.1627 14.967C31.0124 15.3912 31.0124 16.6087 30.1627 17.0329H30.1565Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LinkedClaimsSection({
  claims,
  onClaimClick,
}: {
  claims: {
    id: string;
    elementId: string;
    blockLabel: string;
    code: string;
    status: "approved" | "draft" | "retired";
    adjusted?: boolean;
    adjustmentComment?: string | null;
    body: string | null;
    references: { id: string; label: string; anchorCount: number; href?: string }[];
  }[];
  onClaimClick: (elementId: string, claimCode: string) => void;
}) {
  return (
    <div className="px-4 py-3">
      {claims.length === 0 ? (
        <p className="text-[12px] text-[var(--text-muted)]">No claims linked to this frame yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {claims.map((claim) => (
            <li
              key={claim.id}
              role="button"
              tabIndex={0}
              onClick={() => onClaimClick(claim.elementId, claim.code)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClaimClick(claim.elementId, claim.code);
                }
              }}
              className="cursor-pointer rounded-md border border-indigo-100 bg-white px-2.5 py-2 transition-colors hover:bg-indigo-50/60 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-indigo-800 underline underline-offset-2"
                  title={`Focus linked claim in ${claim.blockLabel}`}
                >
                  <LinkedClaimShieldIcon className="h-3 w-3" />
                  {claim.code}
                </span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    claim.adjusted ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700",
                  )}
                >
                  {claim.adjusted ? "Adjusted Claim" : "Approved Claim"}
                </span>
              </div>
              {claim.adjusted && (
                <div className="mt-1 space-y-0.5">
                  <p className="text-[10px] font-medium text-amber-700">Variation pending review.</p>
                  {claim.adjustmentComment && (
                    <p className="text-[10px] text-[var(--text-muted)] line-clamp-2">
                      Reason: {claim.adjustmentComment}
                    </p>
                  )}
                </div>
              )}
              {claim.body && (
                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-[var(--text-muted)]">{claim.body}</p>
              )}
              <details className="mt-1.5">
                <summary className="cursor-pointer list-none text-[11px] font-semibold text-indigo-700 underline decoration-dotted underline-offset-2 hover:text-indigo-800">
                  References
                </summary>
                <div className="mt-1 rounded-md border border-indigo-200 bg-[var(--surface-subtle)] px-2 py-1.5">
                  <ul className="space-y-0.5">
                    {claim.references.map((reference) => (
                      <li key={reference.id}>
                        <a
                          href={reference.href ?? "#"}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!reference.href) e.preventDefault();
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-800 hover:text-indigo-900"
                        >
                          <ReferenceDocumentIcon className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
                          <span className="underline underline-offset-2">{reference.label}</span>
                          <span className="inline-flex items-center gap-0.5">
                            ({reference.anchorCount}
                            <ReferenceAnchorIcon className="h-[0.95em] w-[0.95em] align-[-0.1em]" />
                            )
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LinkedClaimShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.95373 8.61543H29.046C29.6614 8.61543 30.1537 8.00004 29.9691 7.38465C29.3537 5.35388 28.4922 3.50771 27.323 1.84617C26.9537 1.35386 26.2768 1.29232 25.9076 1.72309C24.7384 2.83079 23.0768 3.44618 21.3537 3.44618C19.5076 3.44618 17.846 2.70771 16.6153 1.47694C16.246 1.1077 15.6307 1.1077 15.2614 1.47694C14.0307 2.70771 12.3691 3.44618 10.523 3.44618C8.79989 3.44618 7.19989 2.83079 5.96912 1.72309C5.53835 1.35386 4.86143 1.4154 4.55373 1.84617C3.3845 3.44617 2.46143 5.35388 1.90758 7.38465C1.84604 8.00004 2.33835 8.61543 2.95373 8.61543V8.61543ZM30.7692 12.5539C30.7692 12 30.3384 11.6923 29.7846 11.6923H2.21533C1.66148 11.6923 1.23071 12 1.23071 12.5539V12.7385C1.23071 21.9693 7.63071 29.6001 15.9999 30.7693C24.3692 29.6001 30.7692 21.9693 30.7692 12.8V12.5539V12.5539Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ReferenceDocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M28.1096 7.92446L21.6114 1.42553C21.5493 1.35808 21.4728 1.30539 21.3876 1.27131C21.3024 1.23724 21.2107 1.22264 21.1192 1.22859C21.028 1.22604 20.9372 1.24213 20.8524 1.27587C20.7677 1.30961 20.6907 1.36029 20.6262 1.42481C20.5616 1.48933 20.511 1.56633 20.4772 1.65111C20.4435 1.73589 20.4274 1.82666 20.43 1.91787V7.13671C20.4316 7.65852 20.6396 8.1585 21.0085 8.52748C21.3774 8.89645 21.8773 9.10446 22.3991 9.10609H27.6173C27.7085 9.10863 27.7992 9.09254 27.884 9.05881C27.9688 9.02507 28.0458 8.97439 28.1103 8.90987C28.1748 8.84535 28.2255 8.76834 28.2592 8.68356C28.2929 8.59879 28.309 8.50801 28.3065 8.4168C28.3124 8.32525 28.2978 8.23352 28.2638 8.14833C28.2297 8.06315 28.177 7.98666 28.1096 7.92446Z"
        fill="currentColor"
      />
      <path
        d="M27.3219 12.0601H20.43C19.6471 12.0585 18.8968 11.7468 18.3432 11.1931C17.7896 10.6395 17.4779 9.88905 17.4763 9.10609V2.21328C17.4763 1.95212 17.3725 1.70166 17.1879 1.517C17.0033 1.33233 16.7528 1.22859 16.4917 1.22859H6.64607C5.86321 1.23022 5.11287 1.54197 4.55929 2.09561C4.00572 2.64925 3.69401 3.39969 3.69238 4.18265V27.8151C3.69401 28.5981 4.00572 29.3485 4.55929 29.9022C5.11287 30.4558 5.86321 30.7676 6.64607 30.7692H25.3528C26.1356 30.7676 26.886 30.4558 27.4396 29.9022C27.9931 29.3485 28.3048 28.5981 28.3065 27.8151V13.0448C28.3065 12.9155 28.281 12.7875 28.2315 12.668C28.182 12.5485 28.1095 12.44 28.0181 12.3486C27.9267 12.2571 27.8181 12.1846 27.6987 12.1351C27.5792 12.0856 27.4512 12.0601 27.3219 12.0601ZM7.13836 7.43212L9.55054 7.08748C9.59976 7.08748 9.69822 7.03824 9.69822 6.98901L10.7812 4.77346C10.8013 4.73897 10.83 4.71034 10.8645 4.69044C10.8991 4.67054 10.9383 4.66007 10.9782 4.66007C11.018 4.66007 11.0572 4.67054 11.0918 4.69044C11.1263 4.71034 11.155 4.73897 11.1751 4.77346L12.2581 6.98901C12.3073 7.03824 12.3565 7.08748 12.4058 7.08748L14.818 7.43212C14.9656 7.48135 15.0641 7.67829 14.9164 7.77676L13.1442 9.49996C13.095 9.54919 13.095 9.59843 13.095 9.6969L13.4888 12.1094C13.4969 12.1468 13.4935 12.1858 13.4791 12.2213C13.4648 12.2568 13.44 12.2872 13.4082 12.3084C13.3763 12.3297 13.3388 12.3408 13.3005 12.3405C13.2622 12.3401 13.2249 12.3282 13.1934 12.3063L11.0274 11.1739C11.0003 11.1497 10.9653 11.1363 10.9289 11.1363C10.8926 11.1363 10.8575 11.1497 10.8305 11.1739L8.66443 12.3063C8.63298 12.3282 8.59569 12.3401 8.55739 12.3405C8.51909 12.3408 8.48157 12.3297 8.4497 12.3084C8.41783 12.2872 8.3931 12.2568 8.37871 12.2213C8.36433 12.1858 8.36097 12.1468 8.36906 12.1094L8.76288 9.6969C8.77025 9.6275 8.75281 9.55773 8.71366 9.49996L6.94144 7.77676C6.89221 7.67829 6.99067 7.48135 7.13836 7.43212ZM22.3991 23.8764C22.3991 24.1375 22.2954 24.388 22.1107 24.5727C21.9261 24.7573 21.6756 24.8611 21.4145 24.8611H8.6152C8.35408 24.8611 8.10365 24.7573 7.91901 24.5727C7.73437 24.388 7.63064 24.1375 7.63064 23.8764V22.8917C7.63064 22.6305 7.73437 22.3801 7.91901 22.1954C8.10365 22.0108 8.35408 21.907 8.6152 21.907H21.4145C21.6756 21.907 21.9261 22.0108 22.1107 22.1954C22.2954 22.3801 22.3991 22.6305 22.3991 22.8917V23.8764ZM24.3682 17.9683C24.3682 18.0976 24.3428 18.2256 24.2933 18.3451C24.2438 18.4646 24.1713 18.5731 24.0798 18.6645C23.9884 18.756 23.8799 18.8285 23.7604 18.878C23.641 18.9275 23.5129 18.953 23.3837 18.953H8.6152C8.35408 18.953 8.10365 18.8492 7.91901 18.6645C7.73437 18.4799 7.63064 18.2294 7.63064 17.9683V16.9836C7.63064 16.7224 7.73437 16.472 7.91901 16.2873C8.10365 16.1026 8.35408 15.9989 8.6152 15.9989H23.3837C23.6448 15.9989 23.8952 16.1026 24.0798 16.2873C24.2645 16.472 24.3682 16.7224 24.3682 16.9836V17.9683Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ReferenceAnchorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M29.5384 21.9691L28.0615 15.6922C27.8769 15.0153 27.0153 14.7691 26.523 15.1999L21.7846 19.5691C21.2307 20.0615 21.4769 20.923 22.1538 21.1076L24.1846 21.723L23.5692 22.9538C22.4615 24.7999 20.6769 25.9691 17.8461 26.3384V10.9538C18.6504 10.6056 19.3354 10.0297 19.8165 9.2971C20.2976 8.5645 20.5539 7.70715 20.5538 6.83069C20.5538 4.36915 18.523 2.33838 16.0615 2.33838C14.8701 2.33838 13.7274 2.81167 12.8849 3.65415C12.0425 4.49662 11.5692 5.63925 11.5692 6.83069C11.5692 8.67684 12.6769 10.2153 14.2769 10.9538V26.3384C11.4461 25.9691 9.66149 24.7999 8.5538 22.9538L7.93841 21.723L9.96918 21.1076C10.6461 20.923 10.8307 19.9999 10.3384 19.5691L5.53841 15.2615C4.98457 14.7691 4.18457 15.0153 3.99995 15.7538L2.46149 21.9691C2.27687 22.6461 2.9538 23.2615 3.63072 23.0768L5.23072 22.5845C5.47687 23.2615 5.72303 23.8768 6.09226 24.4922C7.87687 27.5076 11.1384 29.2922 15.9384 29.2922C20.7384 29.2922 23.9384 27.5076 25.7846 24.4922C26.1538 23.8768 26.4615 23.1999 26.6461 22.5845L28.2461 23.0768C29.0461 23.2615 29.6615 22.6461 29.5384 21.9691ZM16 8.73838C15.7656 8.73838 15.5335 8.69222 15.317 8.60253C15.1005 8.51285 14.9038 8.38139 14.738 8.21568C14.5723 8.04996 14.4409 7.85323 14.3512 7.63671C14.2615 7.42019 14.2153 7.18812 14.2153 6.95376C14.2153 6.7194 14.2615 6.48734 14.3512 6.27082C14.4409 6.0543 14.5723 5.85757 14.738 5.69185C14.9038 5.52613 15.1005 5.39468 15.317 5.30499C15.5335 5.21531 15.7656 5.16915 16 5.16915C16.4733 5.16915 16.9272 5.35717 17.2619 5.69185C17.5965 6.02653 17.7846 6.48045 17.7846 6.95376C17.7846 7.42707 17.5965 7.881 17.2619 8.21568C16.9272 8.55036 16.4733 8.73838 16 8.73838Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ── Tags Editor ── */

function InspectorReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 border-b border-[var(--border)]">
      <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">{label}</label>
      <div className="w-full min-h-8 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] text-[13px] font-medium text-[var(--text-primary)] whitespace-pre-wrap">
        {value.trim() ? value : "—"}
      </div>
    </div>
  );
}

function TagsEditor({
  tags,
  onChange,
  allTags = [],
  readOnly = false,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  allTags?: string[];
  readOnly?: boolean;
}) {
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

  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-1.5 min-h-8">
        {tags.length === 0 ? (
          <span className="text-[13px] text-[var(--text-muted)]">—</span>
        ) : (
          tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--surface-active)] text-[13px] font-medium text-[var(--text-secondary)]"
            >
              {tag}
            </span>
          ))
        )}
      </div>
    );
  }

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
  readOnly = false,
}: {
  card: ChannelCard;
  variant: CardVariant;
  cards: ChannelCard[];
  addVariantElement: (cardId: string, variantId: string, element: ContentElement) => void;
  removeVariantElement: (cardId: string, variantId: string, elementId: string) => void;
  reorderVariantElements: (cardId: string, variantId: string, elements: ContentElement[]) => void;
  selectElement: (cardId: string, elementId: string) => void;
  selectedElement: { cardId: string; elementId: string } | null;
  readOnly?: boolean;
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const selectVariant = useSimpleCanvasStore((s) => s.selectVariant);

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
        {!readOnly && (
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
        )}
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
                draggable={!readOnly}
                onDragStart={readOnly ? undefined : () => { dragItem.current = idx; }}
                onDragEnter={readOnly ? undefined : () => { dragOverItem.current = idx; }}
                onDragEnd={readOnly ? undefined : handleReorder}
                onDragOver={readOnly ? undefined : (e) => e.preventDefault()}
                onClick={() => {
                  if (isActive) {
                    selectVariant(card.id, null);
                  } else {
                    selectElement(card.id, el.id);
                  }
                }}
                className={cn(
                  "group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
                  isActive ? "bg-[var(--surface-active)] shadow-sm" : "hover:bg-[var(--surface-hover)]",
                )}
              >
                <div className="relative flex-shrink-0 w-4 h-4 flex items-center justify-center">
                  <ContentTypeIcon type={el.type} size="sm" className={cn(!readOnly && "group-hover:opacity-0 transition-opacity")} />
                  {!readOnly && (
                  <GripIcon className="w-4 h-4 text-[var(--text-primary)] absolute inset-0 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <span className={cn("text-[13px] font-medium truncate flex-1 min-w-0", isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>
                  {ELEMENT_TYPES.find((t) => t.type === el.type)?.label ?? el.type}
                </span>
                {!readOnly && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeVariantElement(card.id, variant.id, el.id); }}
                  className="w-5 h-5 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                  title="Delete element"
                >
                  <TrashIcon className="w-3 h-3" />
                </button>
                )}
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
