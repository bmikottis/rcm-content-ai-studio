import { applyRephrasePreset, PRESET_TRANSFORMS } from "@/data/rephrase-presets";

export interface ClaimMorphResult {
  newContent: string;
  /** For each claim code that was found and transformed */
  morphedClaims: Record<
    string,
    {
      original: string;
      morphed: string;
    }
  >;
}

/**
 * Core claim phrase to highlight — the essential clinical statement,
 * without trailing legalese ("as described in…", "as outlined in…").
 */
const CANNED_MORPHS: Record<string, string> = {
  "RCS-0001":
    "ONCURA® (oncurimab) is a precision-engineered monoclonal antibody that selectively engages its target receptor, supporting tumor microenvironment modulation",
  "RCS-0002":
    "clinical outcomes, trial design, and endpoint structure must align with the approved label and MLR-reviewed slide deck",
  "RCS-0003":
    "IMPORTANT SAFETY INFORMATION: [Insert boxed warning, contraindications, warnings and precautions, and adverse reactions per local label]. Please see full Prescribing Information for ONCURA® (oncurimab).",
  "RCS-0004":
    "refer to the Summary of Product Characteristics (SmPC) prior to prescribing — local requirements may vary from US labeling",
};

/**
 * Full simulated output for the entire content block when a content-mutating preset fires
 * and the block contains this claim. The CANNED_MORPH phrase must appear verbatim inside
 * this string so the highlight engine can locate it.
 */
const CANNED_FULL_REPHRASES: Record<string, string> = {
  "RCS-0001":
    "ONCURA® (oncurimab) is a precision-engineered monoclonal antibody that selectively engages its target receptor, supporting tumor microenvironment modulation — as outlined in the approved prescribing information.",
  "RCS-0002":
    "For regulatory accuracy: clinical outcomes, trial design, and endpoint structure must align with the approved label and MLR-reviewed slide deck. Replace with verbatim approved language before use.",
  "RCS-0004":
    "For EU healthcare professionals: refer to the Summary of Product Characteristics (SmPC) prior to prescribing — local requirements may vary from US labeling.",
};

/** Presets that make meaningful word-level changes to claim bodies (fallback path) */
const CONTENT_MUTATING_PRESETS = new Set(["get-creative", "simplify", "formal"]);

/**
 * Applies rephrase transforms to `content` while tracking what happened to each
 * embedded claim body.
 *
 * Priority order for each claim:
 * 1. CANNED_FULL_REPHRASES[code] + CANNED_MORPHS[code] — when a content-mutating preset
 *    is selected, replaces the ENTIRE content with a short, natural output and highlights
 *    the core claim phrase within it (removes surrounding boilerplate).
 * 2. CANNED_MORPHS[code] only — partial replacement, just swaps the claim body substring.
 * 3. Word-level preset transforms on the isolated claim body (fallback).
 *
 * - If "preserve-claim" is selected, claims are kept verbatim (no morphing recorded).
 * - Non-regulated calls (empty `linkedClaims`) fall back to the original preset engine.
 */
export function applyRephraseWithMorphing(
  content: string,
  linkedClaims: Array<{ code: string; body: string }>,
  selectedPresets: string[],
  customPrompt: string,
): ClaimMorphResult {
  // No claims or preserve-claim — straight fallback, nothing to track
  if (selectedPresets.includes("preserve-claim") || linkedClaims.length === 0) {
    const { newContent } = applyRephrasePreset(content, selectedPresets, customPrompt);
    return { newContent, morphedClaims: {} };
  }

  const hasMutatingPresets = selectedPresets.some((p) => CONTENT_MUTATING_PRESETS.has(p));
  let workingContent = content;
  const morphedClaims: ClaimMorphResult["morphedClaims"] = {};

  for (const claim of linkedClaims) {
    const idx = workingContent.indexOf(claim.body);
    if (idx === -1) continue;

    const cannedFull = CANNED_FULL_REPHRASES[claim.code];
    const cannedMorph = CANNED_MORPHS[claim.code];

    if (hasMutatingPresets && cannedFull && cannedMorph) {
      // Full-content replacement: drop surrounding boilerplate, use the short merged output.
      // The core claim phrase (cannedMorph) is embedded inside cannedFull and gets highlighted.
      workingContent = cannedFull;
      morphedClaims[claim.code] = { original: claim.body, morphed: cannedMorph };

    } else if (cannedMorph) {
      // Partial replacement: just swap the claim body substring with the canned phrase.
      workingContent =
        workingContent.slice(0, idx) +
        cannedMorph +
        workingContent.slice(idx + claim.body.length);
      morphedClaims[claim.code] = { original: claim.body, morphed: cannedMorph };

    } else {
      // Fallback: apply word-level preset transforms to the claim body in isolation.
      let morphedBody = claim.body;
      for (const presetId of selectedPresets) {
        if (CONTENT_MUTATING_PRESETS.has(presetId)) {
          const fn = PRESET_TRANSFORMS[presetId];
          if (fn) morphedBody = fn(morphedBody);
        }
      }
      if (morphedBody !== claim.body) {
        workingContent =
          workingContent.slice(0, idx) +
          morphedBody +
          workingContent.slice(idx + claim.body.length);
        morphedClaims[claim.code] = { original: claim.body, morphed: morphedBody };
      }
    }
  }

  // Apply whole-content non-mutating transforms (fair-balance, prompt hints) on top.
  // Skip mutating presets here to avoid double-transforming the morphed claim text.
  const nonMutatingPresets = selectedPresets.filter(
    (id) => !CONTENT_MUTATING_PRESETS.has(id),
  );
  const { newContent } = applyRephrasePreset(workingContent, nonMutatingPresets, customPrompt);

  return { newContent, morphedClaims };
}
