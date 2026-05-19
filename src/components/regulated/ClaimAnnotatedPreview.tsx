"use client";

import { useMemo, ReactNode } from "react";
import { ClaimMorphResult } from "@/lib/claim-morph";
import { MorphedClaimHighlight } from "@/components/regulated/MorphedClaimHighlight";

export interface ClaimAnnotatedPreviewProps {
  content: string;
  morphedClaims: ClaimMorphResult["morphedClaims"];
  onPing: (code: string) => void;
}

export function ClaimAnnotatedPreview({ content, morphedClaims, onPing }: ClaimAnnotatedPreviewProps) {
  const ranges = useMemo(() => {
    return Object.entries(morphedClaims)
      .map(([code, { morphed, original }]) => {
        const idx = content.indexOf(morphed);
        return idx !== -1
          ? { start: idx, end: idx + morphed.length, code, originalVerbatim: original }
          : null;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => a.start - b.start);
  }, [content, morphedClaims]);

  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.start > cursor) {
      nodes.push(<span key={`text-${cursor}`}>{content.slice(cursor, range.start)}</span>);
    }
    nodes.push(
      <MorphedClaimHighlight
        key={`claim-${range.start}`}
        claimCode={range.code}
        originalVerbatim={range.originalVerbatim}
        onPingRequest={onPing}
      >
        {content.slice(range.start, range.end)}
      </MorphedClaimHighlight>,
    );
    cursor = range.end;
  }

  if (cursor < content.length) {
    nodes.push(<span key="tail">{content.slice(cursor)}</span>);
  }

  return (
    <div className="text-[13px] text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
      {nodes}
    </div>
  );
}
