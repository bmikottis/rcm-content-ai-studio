import type { ContentElement } from "@/types/simple-canvas";

const APPROVED_CLAIM_STAMP = /\[Approved claim ([^\]]+)\]/g;

type LinkedClaimSource = string | Pick<ContentElement, "content" | "linkedClaimCodes">;

export function extractLinkedClaimCodes(source: LinkedClaimSource): string[] {
  const content = typeof source === "string" ? source : source.content;
  const metadataCodes = typeof source === "string" ? [] : (source.linkedClaimCodes ?? []);
  const seen = new Set<string>();
  for (const code of metadataCodes) {
    const normalized = (code ?? "").trim();
    if (normalized) seen.add(normalized);
  }
  let match: RegExpExecArray | null = null;
  while ((match = APPROVED_CLAIM_STAMP.exec(content)) !== null) {
    const code = (match[1] ?? "").trim();
    if (code) seen.add(code);
  }
  return Array.from(seen);
}

export function stripApprovedClaimStamps(content: string): string {
  return content
    .replace(/\[Approved claim [^\]]+\]\s*\n?/g, "")
    .trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractVisibleLinkedClaimCodes(
  element: Pick<ContentElement, "content" | "linkedClaimCodes">,
  approvedClaims: { code: string; body: string }[],
): string[] {
  const claimsByCode = new Map(approvedClaims.map((claim) => [claim.code, claim.body]));
  const codes = extractLinkedClaimCodes(element);
  return codes.filter((code) => {
    const stampPattern = new RegExp(`\\[Approved claim\\s+${escapeRegex(code)}\\]`, "i");
    if (stampPattern.test(element.content)) return true;
    const body = claimsByCode.get(code);
    if (!body) return true;
    return element.content.includes(body);
  });
}
