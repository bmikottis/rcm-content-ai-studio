const APPROVED_CLAIM_STAMP = /\[Approved claim ([^\]]+)\]/g;

export function extractLinkedClaimCodes(content: string): string[] {
  const seen = new Set<string>();
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
