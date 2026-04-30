import type { ChannelCard } from "@/types/simple-canvas";
import type { RegulatedProfile } from "@/stores/regulated-content";

export type ComplianceSeverity = "error" | "warning" | "info";

export interface ComplianceIssue {
  id: string;
  severity: ComplianceSeverity;
  ruleId: string;
  message: string;
  cardId: string;
  elementId?: string;
  hint?: string;
}

function id(rule: string, cardId: string, suffix?: string): string {
  return `${rule}:${cardId}${suffix ? `:${suffix}` : ""}`;
}

/**
 * Demo compliance scanner — encodes a small rule pack aligned with typical MLR / regional checks.
 * In production this would call policy engines, claim libraries, and OCR/Vision on assets.
 */
export function scanCardsForCompliance(
  cards: ChannelCard[],
  profile: RegulatedProfile,
  creatorFlags?: Record<string, boolean>,
): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];

  for (const card of cards) {
    if (card.channel !== "email") continue;

    const bodies = card.elements.filter((e) => e.type === "body");
    const combinedBody = bodies.map((b) => b.content).join("\n");
    const hasIsi =
      /important safety information|isi\b|prescribing information/i.test(combinedBody) ||
      /IMPORTANT SAFETY INFORMATION/i.test(combinedBody);

    if (profile.audience === "hcp" && profile.intent === "promotional" && !hasIsi) {
      const lastBody = bodies[bodies.length - 1];
      issues.push({
        id: id("isi-required", card.id),
        severity: "error",
        ruleId: "ISI-001",
        message: "Promotional HCP email should include Important Safety Information (or equivalent) in the body.",
        cardId: card.id,
        elementId: lastBody?.id,
        hint: "Add an ISI block or insert approved ISI copy from the claims library.",
      });
    }

    if (profile.region === "eu_uk" && /\b\d+\s*mg\b/i.test(combinedBody) && !/\bSmPC\b/i.test(combinedBody)) {
      const el = bodies.find((b) => /\b\d+\s*mg\b/i.test(b.content));
      issues.push({
        id: id("eu-smpc", card.id, el?.id),
        severity: "warning",
        ruleId: "EU-014",
        message: "EU/UK content referencing dose strengths should cite or link to the SmPC where required.",
        cardId: card.id,
        elementId: el?.id,
      });
    }

    const subj = card.subjectLine ?? "";
    if (subj.length > 110) {
      issues.push({
        id: id("subj-len", card.id),
        severity: "warning",
        ruleId: "SUBJ-02",
        message: `Subject line is long (${subj.length} chars) — many clients truncate around 90–110 characters.`,
        cardId: card.id,
        hint: "Shorten or front-load the value proposition.",
      });
    }

    const superlative = /\b(best in class|best-in-class|number one|#1|world's best)\b/i;
    for (const el of card.elements) {
      if ((el.type === "body" || el.type === "headline") && superlative.test(el.content)) {
        const hasCitation = /\[claim|claim code|MLR|approved claim/i.test(el.content);
        if (!hasCitation) {
          issues.push({
            id: id("superlative", card.id, el.id),
            severity: "warning",
            ruleId: "CLM-009",
            message: "Superlative language may require a tied approved claim or footnote.",
            cardId: card.id,
            elementId: el.id,
            hint: "Attach the matching approved claim from your library or soften the language.",
          });
        }
      }
    }

    for (const el of card.elements) {
      if (el.type === "image") {
        const alt = el.imageData?.alt?.trim() ?? "";
        if (!alt) {
          issues.push({
            id: id("img-alt", card.id, el.id),
            severity: "error",
            ruleId: "A11Y-IMG-01",
            message: "Image is missing alt text — required for accessibility and many MLR checklists.",
            cardId: card.id,
            elementId: el.id,
          });
        }
      }
    }

    if (profile.intent === "educational" && profile.region === "us" && bodies.length < 2) {
      issues.push({
        id: id("edu-structure", card.id),
        severity: "info",
        ruleId: "STR-EDU-01",
        message: "Educational HCP emails often separate mechanism/clinical detail from fair-balance / ISI blocks.",
        cardId: card.id,
        hint: "Consider a dedicated ISI section after primary educational content.",
      });
    }
  }

  if (creatorFlags) {
    for (const [key, flagged] of Object.entries(creatorFlags)) {
      if (!flagged) continue;
      const colon = key.indexOf(":");
      if (colon < 0) continue;
      const cardId = key.slice(0, colon);
      const elementId = key.slice(colon + 1);
      const card = cards.find((c) => c.id === cardId);
      if (!card || card.channel !== "email") continue;
      if (!card.elements.some((e) => e.id === elementId)) continue;
      issues.push({
        id: id("creator-flag", cardId, elementId),
        severity: "warning",
        ruleId: "CR-CREATOR-01",
        message: "Author flagged this block for compliance review.",
        cardId,
        elementId,
        hint: "Clear the flag on the block after remediation.",
      });
    }
  }

  return issues;
}

export function complianceSummary(issues: ComplianceIssue[]): {
  errors: number;
  warnings: number;
  infos: number;
  ok: boolean;
} {
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const infos = issues.filter((i) => i.severity === "info").length;
  return { errors, warnings, infos, ok: errors === 0 && warnings === 0 };
}
