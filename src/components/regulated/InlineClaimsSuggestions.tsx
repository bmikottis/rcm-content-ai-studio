"use client";

import { useMemo } from "react";
import { useSimpleCanvasStore } from "@/stores/simple-canvas";
import {
  useRegulatedContentStore,
  filterClaimsForContext,
  elementKey,
  type ApprovedClaim,
} from "@/stores/regulated-content";
import { scanCardsForCompliance } from "@/lib/compliance-scan";
import type { ChannelCard, ContentElement } from "@/types/simple-canvas";
import { cn } from "@/lib/cn";

interface InlineClaimsSuggestionsProps {
  card: ChannelCard;
  element: ContentElement;
  /** When true, suggestions are shown but Insert / Dismiss are hidden. */
  readOnly?: boolean;
}

export function InlineClaimsSuggestions({ card, element, readOnly = false }: InlineClaimsSuggestionsProps) {
  const profile = useRegulatedContentStore((s) => s.profile);
  const dismissedByElement = useRegulatedContentStore((s) => s.dismissedByElement);
  const creatorFlags = useRegulatedContentStore((s) => s.creatorComplianceFlags);
  const dismissClaim = useRegulatedContentStore((s) => s.dismissClaim);
  const updateElement = useSimpleCanvasStore((s) => s.updateElement);
  const cards = useSimpleCanvasStore((s) => s.cards);

  const key = elementKey(card.id, element.id);
  const dismissed = dismissedByElement[key] ?? [];

  const suggestions = useMemo(
    () =>
      element.type === "divider"
        ? []
        : filterClaimsForContext({
            profile,
            channel: card.channel,
            elementType: element.type,
            dismissedIds: dismissed,
          }),
    [profile, card.channel, element.type, dismissed],
  );

  const elementIssues = useMemo(() => {
    const all = scanCardsForCompliance(cards, profile, creatorFlags);
    return all.filter(
      (i) =>
        i.cardId === card.id &&
        i.elementId === element.id &&
        i.ruleId !== "CR-CREATOR-01",
    );
  }, [cards, profile, creatorFlags, card.id, element.id]);

  if (element.type === "divider") return null;

  return (
    <div className="border-b border-[var(--border)] bg-gradient-to-b from-indigo-50/80 to-transparent px-4 py-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-indigo-900/80">
          <SparklesIcon className="h-3.5 w-3.5 text-indigo-600" />
          Recommendations
        </h3>
        <span className="text-[10px] font-medium text-indigo-700/80">AI generated suggestions</span>
      </div>

      {elementIssues.length > 0 && (
        <div className="mb-2 space-y-1">
          {elementIssues.map((i) => (
            <div
              key={i.id}
              className={cn(
                "rounded-md border px-2 py-1.5 text-[11px] font-medium",
                i.severity === "error"
                  ? "border-red-200 bg-red-50 text-red-900"
                  : i.severity === "warning"
                    ? "border-amber-200 bg-amber-50 text-amber-950"
                    : "border-slate-200 bg-slate-50 text-slate-800",
              )}
            >
              {i.message}
            </div>
          ))}
        </div>
      )}

      {suggestions.length === 0 ? (
        <p className="text-[12px] text-[var(--text-muted)]">
          No matching approved claims for this element with the current audience, region, and intent. Adjust the
          profile in the compliance bar or clear dismissed suggestions.
        </p>
      ) : (
        <ul className="space-y-2">
          {suggestions.map((claim) => (
            <li
              key={claim.id}
              className="rounded-lg border border-indigo-200/80 bg-white/90 p-2 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                    Claim recommendation
                  </span>
                  <p className="text-[11px] font-bold text-indigo-950">{claim.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <p className="text-[10px] font-mono text-indigo-700/90">{claim.code}</p>
                    <span className="inline-flex rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      {claim.status}
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-1 text-[12px] leading-snug text-[var(--text-secondary)]">{claim.body}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px]">
                <details className="group">
                  <summary
                    title={claim.recommendationReasoning}
                    className="cursor-pointer list-none font-semibold text-indigo-700 underline decoration-dotted underline-offset-2 hover:text-indigo-800"
                  >
                    Reasoning
                  </summary>
                  <p className="mt-1 max-w-[52ch] rounded-md border border-indigo-100 bg-indigo-50/40 px-2 py-1.5 text-[11px] leading-snug text-indigo-900">
                    {claim.recommendationReasoning}
                  </p>
                </details>
                <details className="group">
                  <summary
                    title={claim.references.map((r) => r.label).join(" | ")}
                    className="cursor-pointer list-none font-semibold text-indigo-700 underline decoration-dotted underline-offset-2 hover:text-indigo-800"
                  >
                    References
                  </summary>
                  <div className="mt-1 max-w-[52ch] rounded-md border border-indigo-100 bg-indigo-50/40 px-2 py-1.5">
                    <ul className="space-y-0.5">
                      {claim.references.map((reference) => (
                        <li key={reference.id}>
                          <a
                            href={reference.href ?? "#"}
                            onClick={(e) => {
                              if (!reference.href) e.preventDefault();
                            }}
                            className="text-[11px] font-medium text-indigo-800 hover:text-indigo-900"
                          >
                            <span className="underline underline-offset-2">{reference.label}</span>
                            <span> ({reference.anchorCount}
                              <AnchorIcon className="ml-0.5 inline-block h-[1em] w-[1em] align-[-0.12em]" />
                              )
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              </div>
              {!readOnly && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyClaim(updateElement, card.id, element, claim)}
                    className="rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700"
                  >
                    Insert into block
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissClaim(key, claim.id)}
                    className="rounded-md border border-[var(--border)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M5 17l.6 1.8L7.4 19l-1.8.6L5 21.4l-.6-1.8L2.6 19l1.8-.6L5 17z" />
    </svg>
  );
}

function AnchorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M29.5384 21.9691L28.0615 15.6922C27.8769 15.0153 27.0153 14.7691 26.523 15.1999L21.7846 19.5691C21.2307 20.0615 21.4769 20.923 22.1538 21.1076L24.1846 21.723L23.5692 22.9538C22.4615 24.7999 20.6769 25.9691 17.8461 26.3384V10.9538C18.6504 10.6056 19.3354 10.0297 19.8165 9.2971C20.2976 8.5645 20.5539 7.70715 20.5538 6.83069C20.5538 4.36915 18.523 2.33838 16.0615 2.33838C14.8701 2.33838 13.7274 2.81167 12.8849 3.65415C12.0425 4.49662 11.5692 5.63925 11.5692 6.83069C11.5692 8.67684 12.6769 10.2153 14.2769 10.9538V26.3384C11.4461 25.9691 9.66149 24.7999 8.5538 22.9538L7.93841 21.723L9.96918 21.1076C10.6461 20.923 10.8307 19.9999 10.3384 19.5691L5.53841 15.2615C4.98457 14.7691 4.18457 15.0153 3.99995 15.7538L2.46149 21.9691C2.27687 22.6461 2.9538 23.2615 3.63072 23.0768L5.23072 22.5845C5.47687 23.2615 5.72303 23.8768 6.09226 24.4922C7.87687 27.5076 11.1384 29.2922 15.9384 29.2922C20.7384 29.2922 23.9384 27.5076 25.7846 24.4922C26.1538 23.8768 26.4615 23.1999 26.6461 22.5845L28.2461 23.0768C29.0461 23.2615 29.6615 22.6461 29.5384 21.9691ZM16 8.73838C15.7656 8.73838 15.5335 8.69222 15.317 8.60253C15.1005 8.51285 14.9038 8.38139 14.738 8.21568C14.5723 8.04996 14.4409 7.85323 14.3512 7.63671C14.2615 7.42019 14.2153 7.18812 14.2153 6.95376C14.2153 6.7194 14.2615 6.48734 14.3512 6.27082C14.4409 6.0543 14.5723 5.85757 14.738 5.69185C14.9038 5.52613 15.1005 5.39468 15.317 5.30499C15.5335 5.21531 15.7656 5.16915 16 5.16915C16.4733 5.16915 16.9272 5.35717 17.2619 5.69185C17.5965 6.02653 17.7846 6.48045 17.7846 6.95376C17.7846 7.42707 17.5965 7.881 17.2619 8.21568C16.9272 8.55036 16.4733 8.73838 16 8.73838Z"
        fill="currentColor"
      />
    </svg>
  );
}

function applyClaim(
  updateElement: (cardId: string, elementId: string, updates: Partial<ContentElement>) => void,
  cardId: string,
  element: ContentElement,
  claim: ApprovedClaim,
) {
  if (element.type === "image") {
    updateElement(cardId, element.id, {
      content: claim.title,
      imageData: {
        ...(element.imageData ?? { src: "", alt: "", fit: "cover" }),
        alt: claim.body.slice(0, 220),
      },
    });
    return;
  }

  const prefix = element.content.trim() ? `${element.content.trim()}\n\n` : "";
  const stamp = `[Approved claim ${claim.code}]`;
  updateElement(cardId, element.id, {
    content: `${prefix}${stamp}\n${claim.body}`,
  });
}
