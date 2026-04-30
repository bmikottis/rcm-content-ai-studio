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
}

export function InlineClaimsSuggestions({ card, element }: InlineClaimsSuggestionsProps) {
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
    return all.filter((i) => i.cardId === card.id && i.elementId === element.id);
  }, [cards, profile, creatorFlags, card.id, element.id]);

  if (element.type === "divider") return null;

  return (
    <div className="border-b border-[var(--border)] bg-gradient-to-b from-indigo-50/80 to-transparent px-4 py-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-indigo-900/80">
          Claims library — this block
        </h3>
        <span className="text-[10px] font-medium text-indigo-700/80">Contextual suggestions</span>
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
                  <p className="text-[11px] font-bold text-indigo-950">{claim.title}</p>
                  <p className="text-[10px] font-mono text-indigo-700/90">{claim.code}</p>
                </div>
              </div>
              <p className="mt-1 text-[12px] leading-snug text-[var(--text-secondary)]">{claim.body}</p>
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
            </li>
          ))}
        </ul>
      )}
    </div>
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
