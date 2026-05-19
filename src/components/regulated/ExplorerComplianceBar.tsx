"use client";

import { useCallback, useMemo, useState } from "react";
import { useSimpleCanvasStore } from "@/stores/simple-canvas";
import { useCanvasStore } from "@/stores/canvas";
import { useRegulatedContentStore, OBLIGATION_ITEMS } from "@/stores/regulated-content";
import { scanCardsForCompliance, complianceSummary, type ComplianceIssue } from "@/lib/compliance-scan";
import { scanCardsForObligations, resolveObligations } from "@/lib/obligations-scan";
import { cn } from "@/lib/cn";
import { toast } from "@/stores/toast";

/** Compliance summary + issue list for the left explorer (pharma only). */
export function ExplorerComplianceBar() {
  const projectId = useCanvasStore((s) => s.projectId);
  const cards = useSimpleCanvasStore((s) => s.cards);
  const updateCard = useSimpleCanvasStore((s) => s.updateCard);
  const profile = useRegulatedContentStore((s) => s.profile);
  const creatorFlags = useRegulatedContentStore((s) => s.creatorComplianceFlags);
  const manualObligationOverrides = useRegulatedContentStore((s) => s.manualObligationOverrides);
  const setHighlightedObligationIds = useRegulatedContentStore((s) => s.setHighlightedObligationIds);
  const clearObligationHighlights = useRegulatedContentStore((s) => s.clearObligationHighlights);
  const [expanded, setExpanded] = useState(false);

  const issues = useMemo(
    () => scanCardsForCompliance(cards, profile, creatorFlags),
    [cards, profile, creatorFlags],
  );
  const summary = useMemo(() => complianceSummary(issues), [issues]);

  const handleSubmitAllForReview = useCallback(() => {
    const emailCards = cards.filter((c) => c.channel === "email");
    const toAdvance = emailCards.filter(
      (c) => c.status === "draft" || c.status === "generating" || c.status === "ready",
    );
    if (toAdvance.length === 0) {
      toast.info("No email blocks to submit. In-review, approved, or published content is unchanged.");
      return;
    }

    // Check for unfulfilled critical obligations before advancing
    const autoResults = scanCardsForObligations(emailCards);
    const resolved = resolveObligations(autoResults, manualObligationOverrides);
    const criticalUnfulfilled = OBLIGATION_ITEMS
      .filter((item) => item.isCritical && !resolved[item.id])
      .map((item) => item.id);

    if (criticalUnfulfilled.length > 0) {
      setHighlightedObligationIds(criticalUnfulfilled);
      setTimeout(() => clearObligationHighlights(), 4000);
      toast.warning(
        `${criticalUnfulfilled.length} critical obligation${criticalUnfulfilled.length === 1 ? "" : "s"} unmet — review Obligations & Guardrails before submitting.`,
      );
      return;
    }

    for (const c of toAdvance) {
      updateCard(c.id, { status: "review" });
    }
    toast.success(
      `${toAdvance.length} email block${toAdvance.length === 1 ? "" : "s"} submitted for review.`,
    );
  }, [cards, updateCard, manualObligationOverrides, setHighlightedObligationIds, clearObligationHighlights]);

  if (projectId !== "proj-pharma-email") return null;

  return (
    <div className="shrink-0 border-b border-[var(--border)] px-2.5 pb-2.5 pt-1">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Regulated</p>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "mt-1 flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] font-semibold leading-snug transition-colors",
          summary.ok
            ? "border-emerald-300/80 bg-emerald-50 text-emerald-900"
            : summary.errors > 0
              ? "border-red-300/80 bg-red-50 text-red-900"
              : "border-amber-300/80 bg-amber-50 text-amber-950",
        )}
        aria-expanded={expanded}
      >
        <span className="min-w-0 flex-1">
          {summary.ok
            ? "Compliance OK"
            : `${summary.errors} error${summary.errors === 1 ? "" : "s"} · ${summary.warnings} warning${summary.warnings === 1 ? "" : "s"}`}
        </span>
        <ChevronIcon className={cn("h-3.5 w-3.5 shrink-0 transition-transform", expanded && "rotate-180")} />
      </button>
      <button
        type="button"
        onClick={handleSubmitAllForReview}
        className="mt-1.5 flex w-full items-center justify-center rounded-lg bg-[#0F8EFF] px-2.5 py-2 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-[#0D7DE6] active:scale-[0.99]"
      >
        Submit all content for review
      </button>
      {expanded && (
        <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-2 py-1.5">
          {issues.length === 0 ? (
            <p className="text-[11px] text-[var(--text-muted)]">No automated issues for the current profile.</p>
          ) : (
            <ul className="space-y-1">
              {issues.map((issue) => (
                <IssueRow key={issue.id} issue={issue} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function IssueRow({ issue }: { issue: ComplianceIssue }) {
  const selectElement = useSimpleCanvasStore((s) => s.selectElement);
  const canJump = Boolean(issue.elementId);

  return (
    <li className="flex items-start gap-1.5 rounded-md bg-[var(--surface)] px-1.5 py-1">
      <SeverityDot severity={issue.severity} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold leading-snug text-[var(--text-primary)]">{issue.message}</p>
        <p className="text-[9px] text-[var(--text-muted)]">
          {issue.ruleId}
          {issue.hint ? ` · ${issue.hint}` : ""}
        </p>
      </div>
      {canJump && (
        <button
          type="button"
          onClick={() => selectElement(issue.cardId, issue.elementId!)}
          className="shrink-0 rounded border border-[var(--border)] bg-white px-1 py-0.5 text-[9px] font-semibold text-[#0F8EFF] hover:bg-[#EBF5FE]"
        >
          Open
        </button>
      )}
    </li>
  );
}

function SeverityDot({ severity }: { severity: ComplianceIssue["severity"] }) {
  const cls =
    severity === "error" ? "bg-red-500" : severity === "warning" ? "bg-amber-500" : "bg-slate-400";
  return <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", cls)} />;
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
