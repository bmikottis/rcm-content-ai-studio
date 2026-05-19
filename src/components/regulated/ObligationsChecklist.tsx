"use client";

import { useMemo, useState } from "react";
import { useSimpleCanvasStore } from "@/stores/simple-canvas";
import {
  useRegulatedContentStore,
  OBLIGATION_ITEMS,
  type ObligationCategory,
  type ObligationItem,
} from "@/stores/regulated-content";
import { scanCardsForObligations, resolveObligations } from "@/lib/obligations-scan";
import { cn } from "@/lib/cn";

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function ObligationsChecklist() {
  const cards = useSimpleCanvasStore((s) => s.cards);
  const manualOverrides = useRegulatedContentStore((s) => s.manualObligationOverrides);
  const highlightedIds = useRegulatedContentStore((s) => s.highlightedObligationIds);
  const setObligationOverride = useRegulatedContentStore((s) => s.setObligationOverride);

  const [open, setOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ObligationCategory>("regulatory");

  const autoResults = useMemo(() => scanCardsForObligations(cards), [cards]);
  const resolved = useMemo(
    () => resolveObligations(autoResults, manualOverrides),
    [autoResults, manualOverrides],
  );

  const fulfilledCount = useMemo(
    () => Object.values(resolved).filter(Boolean).length,
    [resolved],
  );
  const totalCount = OBLIGATION_ITEMS.length;
  const hasCriticalUnfulfilled = useMemo(
    () => OBLIGATION_ITEMS.some((item) => item.isCritical && !resolved[item.id]),
    [resolved],
  );

  const visibleItems = OBLIGATION_ITEMS.filter((item) => item.category === activeCategory);

  const handleCheckboxClick = (item: ObligationItem) => {
    const current = manualOverrides[item.id];
    const auto = autoResults[item.id];

    if (current === null || current === undefined) {
      // Auto state → force to opposite of current resolved value
      setObligationOverride(item.id, !resolved[item.id]);
    } else if (current === !auto) {
      // Manual override differs from auto → revert to auto (null)
      setObligationOverride(item.id, null);
    } else {
      // Manual override same as auto → force opposite
      setObligationOverride(item.id, !current);
    }
  };

  return (
    <div className="shrink-0 border-b border-[var(--border)]">
      {/* ── Accordion Header ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors hover:bg-[var(--surface-hover)]"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
              Obligations &amp; Guardrails
            </span>
            <ObligationStatusBadge
              fulfilled={fulfilledCount}
              total={totalCount}
              hasCriticalUnfulfilled={hasCriticalUnfulfilled}
            />
          </div>
          <span className="mt-0.5 block truncate text-[11px] text-[var(--text-muted)]">
            FDA/OPDP regulatory and brand compliance checklist
          </span>
        </div>
        <ChevronIcon
          className={cn(
            "h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* ── Expanded Body ─────────────────────────────────────────────────── */}
      {open && (
        <div className="pb-3">
          {/* Category Toggle */}
          <div className="flex gap-0 border-b border-[var(--border)] px-4">
            {(["regulatory", "brand"] as ObligationCategory[]).map((cat) => {
              const catItems = OBLIGATION_ITEMS.filter((i) => i.category === cat);
              const catFulfilled = catItems.filter((i) => resolved[i.id]).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "relative mr-4 pb-2 pt-2 text-[11px] font-semibold transition-colors",
                    activeCategory === cat
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
                  )}
                >
                  {cat === "regulatory" ? "Regulatory" : "Brand"}
                  <span
                    className={cn(
                      "ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums",
                      activeCategory === cat
                        ? "bg-[var(--surface-subtle)] text-[var(--text-secondary)]"
                        : "bg-[var(--surface-subtle)] text-[var(--text-muted)]",
                    )}
                  >
                    {catFulfilled}/{catItems.length}
                  </span>
                  {activeCategory === cat && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#0F8EFF]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Checklist Rows */}
          <ul className="mt-2 space-y-1 px-3">
            {visibleItems.map((item) => {
              const isFulfilled = resolved[item.id] ?? false;
              const isHighlighted = highlightedIds.includes(item.id);
              const isManuallyOverridden =
                manualOverrides[item.id] !== null &&
                manualOverrides[item.id] !== undefined &&
                manualOverrides[item.id] !== autoResults[item.id];

              return (
                <li
                  key={item.id}
                  className={cn(
                    "group flex items-start gap-2.5 rounded-lg border px-2.5 py-2 transition-colors",
                    isHighlighted
                      ? "border-amber-300 bg-amber-50"
                      : "border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-subtle)]",
                  )}
                >
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleCheckboxClick(item)}
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      isFulfilled
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : item.isCritical && isHighlighted
                          ? "border-amber-400 bg-white"
                          : "border-neutral-300 bg-white",
                    )}
                    aria-label={isFulfilled ? "Mark as unfulfilled" : "Mark as fulfilled"}
                    title={
                      isManuallyOverridden
                        ? "Manually overridden — click to revert to auto-detected"
                        : isFulfilled
                          ? "Auto-detected as fulfilled — click to override"
                          : "Click to manually mark as fulfilled"
                    }
                  >
                    {isFulfilled && <CheckIcon />}
                  </button>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "text-[12px] font-medium leading-snug",
                          isFulfilled
                            ? "text-[var(--text-secondary)] line-through decoration-emerald-400/60"
                            : "text-[var(--text-primary)]",
                        )}
                      >
                        {item.title}
                      </span>
                      {item.isCritical && !isFulfilled && (
                        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-600">
                          Required
                        </span>
                      )}
                      {isManuallyOverridden && (
                        <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[9px] font-semibold text-neutral-500">
                          Manual
                        </span>
                      )}
                    </div>
                    {/* Reference tag */}
                    <a
                      href={item.referenceHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
                    >
                      <LinkIcon />
                      {item.referenceLabel}
                    </a>
                  </div>

                  {/* Warning indicator when highlighted */}
                  {isHighlighted && (
                    <span className="mt-0.5 shrink-0" title="Critical obligation unmet — resolve before submitting">
                      <WarningIcon />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Footer hint */}
          <p className="mt-2 px-4 text-[10px] leading-snug text-[var(--text-muted)]">
            Checkboxes are auto-detected from content. Click to manually override.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function ObligationStatusBadge({
  fulfilled,
  total,
  hasCriticalUnfulfilled,
}: {
  fulfilled: number;
  total: number;
  hasCriticalUnfulfilled: boolean;
}) {
  const allFulfilled = fulfilled === total;
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
        allFulfilled
          ? "bg-emerald-100 text-emerald-700"
          : hasCriticalUnfulfilled
            ? "bg-red-100 text-red-700"
            : "bg-amber-100 text-amber-700",
      )}
    >
      {fulfilled}/{total} Fulfilled
    </span>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="h-4 w-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
    </svg>
  );
}
