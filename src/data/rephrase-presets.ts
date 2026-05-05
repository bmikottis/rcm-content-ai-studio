export interface RephrasePreset {
  id: string;
  label: string;
  description: string;
  regulatedOnly?: boolean;
}

export const ALL_PRESETS: RephrasePreset[] = [
  {
    id: "preserve-claim",
    label: "Preserve claim text",
    description: "Keep approved MLR claim language intact while improving surrounding copy",
    regulatedOnly: true,
  },
  {
    id: "get-creative",
    label: "Get Creative",
    description: "Loosen formal phrasing with more engaging, accessible language",
  },
  {
    id: "fair-balance",
    label: "Fair Balance",
    description: "Append an ISI/fair balance placeholder after the content",
    regulatedOnly: true,
  },
  {
    id: "simplify",
    label: "Simplify language",
    description: "Shorten sentences and remove jargon",
  },
  {
    id: "formal",
    label: "More formal",
    description: "Remove contractions and replace casual phrasing",
  },
];

// Non-regulated projects only see the general-purpose presets
export function getPresetsForContext(regulated: boolean): RephrasePreset[] {
  return regulated ? ALL_PRESETS : ALL_PRESETS.filter((p) => !p.regulatedOnly);
}

// ---------------------------------------------------------------------------
// Simulated transformation engine
// ---------------------------------------------------------------------------

interface TransformResult {
  newContent: string;
}

const ISI_STUB =
  "\n\nIMPORTANT SAFETY INFORMATION: [Insert boxed warning, contraindications, warnings and precautions, and adverse reactions per local label]. Please see full Prescribing Information for [DRUG NAME].";

type PresetTransform = (text: string) => string;

const PRESET_TRANSFORMS: Record<string, PresetTransform> = {
  "preserve-claim": (text) => {
    // Annotates with MLR placeholder — no content change
    const trimmed = text.trim();
    if (trimmed.includes("[Approved claim")) return trimmed;
    return `${trimmed}\n[Approved claim reference preserved — do not alter]`;
  },

  "get-creative": (text) =>
    text
      .replace(/\bdemonstrated\b/gi, "shown")
      .replace(/\butilize\b/gi, "use")
      .replace(/\bcommence\b/gi, "start")
      .replace(/\bfacilitate\b/gi, "help")
      .replace(/\bIn order to\b/gi, "To")
      .replace(/\bprior to\b/gi, "before")
      .replace(/\bsubsequent to\b/gi, "after")
      .replace(/\bapproximately\b/gi, "about")
      .replace(/\bindividuals\b/gi, "people")
      .replace(/\bphysicians\b/gi, "doctors"),

  "fair-balance": (text) => {
    const trimmed = text.trim();
    if (trimmed.includes("IMPORTANT SAFETY INFORMATION")) return trimmed;
    return trimmed + ISI_STUB;
  },

  simplify: (text) =>
    text
      .replace(/, which (is|are|was|were)/gi, " —")
      .replace(/\bin the event that\b/gi, "if")
      .replace(/\bat this point in time\b/gi, "now")
      .replace(/\bdue to the fact that\b/gi, "because")
      .replace(/\bfor the purpose of\b/gi, "to")
      .replace(/\ba large number of\b/gi, "many")
      .replace(/\bhas the ability to\b/gi, "can")
      .replace(/\bis able to\b/gi, "can"),

  formal: (text) =>
    text
      .replace(/\bcan't\b/gi, "cannot")
      .replace(/\bwon't\b/gi, "will not")
      .replace(/\bdon't\b/gi, "do not")
      .replace(/\bdidn't\b/gi, "did not")
      .replace(/\bisn't\b/gi, "is not")
      .replace(/\baren't\b/gi, "are not")
      .replace(/\bwasn't\b/gi, "was not")
      .replace(/\bweren't\b/gi, "were not")
      .replace(/\bI'm\b/gi, "I am")
      .replace(/\bwe're\b/gi, "we are")
      .replace(/\bthey're\b/gi, "they are")
      .replace(/\bit's\b/gi, "it is")
      .replace(/\bthat's\b/gi, "that is")
      .replace(/\bhere's\b/gi, "here is")
      .replace(/\bthere's\b/gi, "there is"),
};

// Freeform prompt-based suffix transforms (lightweight simulation)
function applyPromptHint(text: string, prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("shorter") || lower.includes("concise")) {
    // Trim long sentences
    return text
      .split(". ")
      .filter((s) => s.trim().length > 0)
      .slice(0, Math.ceil(text.split(". ").length * 0.7))
      .join(". ")
      .trim();
  }
  if (lower.includes("urgent") || lower.includes("urgency")) {
    return text.replace(/\.$/, "") + ". Act now.";
  }
  if (lower.includes("empathetic") || lower.includes("empathy")) {
    return text.replace(/^(Hi|Hello|Dear)/, "We understand your journey.");
  }
  // Default: return as-is (prompt acknowledged but not mechanically applied)
  return text;
}

export function applyRephrasePreset(
  content: string,
  selectedPresets: string[],
  customPrompt: string,
): TransformResult {
  let result = content;

  // Apply preset transforms in order
  for (const id of selectedPresets) {
    const fn = PRESET_TRANSFORMS[id];
    if (fn) result = fn(result);
  }

  // Apply free-text prompt hint if provided
  if (customPrompt.trim()) {
    result = applyPromptHint(result, customPrompt);
  }

  return { newContent: result };
}
