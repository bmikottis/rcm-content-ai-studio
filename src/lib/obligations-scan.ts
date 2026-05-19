import type { ChannelCard } from "@/types/simple-canvas";
import { OBLIGATION_ITEMS } from "@/stores/regulated-content";

/**
 * Heuristically scans the full text content of all cards to determine whether
 * each obligation is auto-fulfilled. Returns a map of obligation ID → boolean.
 *
 * These are keyword/pattern checks only — NOT a substitute for MLR review.
 */
export function scanCardsForObligations(cards: ChannelCard[]): Record<string, boolean> {
  const emailCards = cards.filter((c) => c.channel === "email");

  // Collect all text content across all email card elements
  const allText = emailCards
    .flatMap((c) => c.elements.map((el) => el.content))
    .join(" ")
    .toLowerCase();

  // Check whether any element carries a linked claim code
  const linkedCodes = new Set(
    emailCards.flatMap((c) => c.elements.flatMap((el) => el.linkedClaimCodes ?? [])),
  );

  // Check whether any image element exists (proxy for brand visuals)
  const hasImageElement = emailCards.some((c) => c.elements.some((el) => el.type === "image"));

  // Check for a CTA element (proxy for PI link / layout safeguards)
  const hasCtaElement = emailCards.some((c) => c.elements.some((el) => el.type === "cta"));

  // Check for a headline element (proxy for indication statement visibility)
  const hasHeadlineElement = emailCards.some((c) => c.elements.some((el) => el.type === "headline"));

  const results: Record<string, boolean> = {};

  for (const item of OBLIGATION_ITEMS) {
    switch (item.id) {
      case "obl-true-indication":
        // Fulfilled if the content mentions the drug name with an indication phrase
        results[item.id] =
          hasHeadlineElement &&
          (/oncura/i.test(allText) || /oncurimab/i.test(allText)) &&
          (/indication|indicated for|treatment of|approved for/i.test(allText));
        break;

      case "obl-fair-balance":
        // Fulfilled if ISI / Important Safety Information text is present
        results[item.id] =
          /important safety information|isi|safety information/i.test(allText) ||
          linkedCodes.has("RCS-0003");
        break;

      case "obl-boxed-warning":
        // Fulfilled if a black box / boxed warning phrase is present
        results[item.id] = /boxed warning|black box|warning:|warnings and precautions/i.test(allText);
        break;

      case "obl-pi-link":
        // Fulfilled if a prescribing information link / PI reference is present, or CTA exists
        results[item.id] =
          /prescribing information|full pi|see pi|pi link|full prescribing/i.test(allText) ||
          hasCtaElement;
        break;

      case "obl-substantiated-claims":
        // Fulfilled if all linked claim codes resolve to approved claims (RCS-* codes present)
        results[item.id] =
          linkedCodes.size > 0 &&
          Array.from(linkedCodes).every((code) => /^RCS-/i.test(code));
        break;

      case "obl-core-narrative":
        // Fulfilled if MOA / mechanism language from the approved claim library is present
        results[item.id] =
          /monoclonal antibody|moa|mechanism of action|tumor microenvironment/i.test(allText) ||
          linkedCodes.has("RCS-0001");
        break;

      case "obl-brand-visuals":
        // Fulfilled if an image element exists (the design system enforces approved assets)
        results[item.id] = hasImageElement;
        break;

      case "obl-audience-lock":
        // Fulfilled if HCP-specific language is present
        results[item.id] = /hcp|healthcare provider|prescriber|physician|oncologist/i.test(allText);
        break;

      case "obl-layout-safeguards":
        // Fulfilled if unsubscribe / footer / privacy policy text is present
        results[item.id] =
          /unsubscribe|privacy policy|physical address|footer|brand logo/i.test(allText) ||
          hasCtaElement;
        break;

      default:
        results[item.id] = false;
    }
  }

  return results;
}

/**
 * Merges auto-detected results with manual overrides.
 * A manual override of `null` means "revert to auto-detected".
 */
export function resolveObligations(
  autoResults: Record<string, boolean>,
  manualOverrides: Record<string, boolean | null>,
): Record<string, boolean> {
  const resolved: Record<string, boolean> = { ...autoResults };
  for (const [id, value] of Object.entries(manualOverrides)) {
    if (value !== null) {
      resolved[id] = value;
    }
  }
  return resolved;
}
