/**
 * One agent question + answer choices for the workspace Vibe prompt (conversational clarify step).
 * Heuristic, local-only — `detail` is appended for sendPrompt.
 */

export interface RefinementAnswer {
  id: string;
  /** User’s reply as a natural conversational choice */
  label: string;
  /** Full context for the agent */
  detail: string;
}

export interface RefinementBundle {
  /** Single question from Vibe (conversational) */
  agentQuestion: string;
  answers: RefinementAnswer[];
}

function scopePhrase(contextLabel: string): string {
  const c = contextLabel.trim();
  if (!c || c === "Campaign" || c === "Workspace") return "this campaign";
  return c;
}

function a(id: string, label: string, detail: string): RefinementAnswer {
  return { id, label, detail };
}

export function buildRefinementSuggestions(
  prompt: string,
  contextLabel: string,
): RefinementBundle {
  const p = prompt.trim();
  const scope = scopePhrase(contextLabel);

  if (/\b(shorter|shorten|condense|trim|less text|brief|compact|tighten)\b/i.test(p)) {
    return {
      agentQuestion: "Got it—you want shorter copy. Where should we take the first cuts?",
      answers: [
        a(
          "short-h",
          "Start with the headline and subheads — keep the CTA decisive.",
          `Prioritize shortening the headline and subheads; keep the CTA decisive for ${scope}.`,
        ),
        a(
          "short-b",
          "Trim the body harder first — keep the headline and offer framing.",
          `Shorten body copy more aggressively while preserving the primary CTA and offer for ${scope}.`,
        ),
        a(
          "short-bal",
          "Balance it — shave headline, body, and secondary lines proportionally.",
          `Reduce length across headline, body, and secondary lines proportionally for ${scope}.`,
        ),
        a(
          "short-sms",
          "Optimize for SMS / RCS limits first — then mirror the intent elsewhere.",
          `Optimize for character limits on SMS/RCS without losing intent for ${scope}.`,
        ),
      ],
    };
  }

  if (/\b(longer|expand|more detail|elaborate|deeper)\b/i.test(p)) {
    return {
      agentQuestion: "You’d like more depth. How should we expand?",
      answers: [
        a(
          "long-ben",
          "Add benefits, proof points, and one testimonial-style line.",
          `Expand with concrete benefits, proof points, and one short testimonial-style line for ${scope}.`,
        ),
        a(
          "long-story",
          "Use a short narrative: problem → solution → CTA.",
          `Lengthen with a concise story arc: problem → solution → CTA for ${scope}.`,
        ),
        a(
          "long-ch",
          "Go longer on email/web — keep SMS and WhatsApp lean.",
          `Add depth where the channel allows (email/web) and keep SMS/WhatsApp lean for ${scope}.`,
        ),
        a(
          "long-all",
          "A bit of everything where space allows.",
          `Expand with benefits, light narrative, and channel-appropriate depth for ${scope}.`,
        ),
      ],
    };
  }

  if (/\b(tone|voice|formal|casual|friendly|professional|playful|serious)\b/i.test(p)) {
    return {
      agentQuestion: "Let’s tune tone. What matters most?",
      answers: [
        a(
          "tone-brand",
          "Stay strictly inside our brand voice — no drift.",
          `Adjust tone but keep strict alignment with the existing brand voice guidelines for ${scope}.`,
        ),
        a(
          "tone-aud",
          "Optimize for how the audience actually reads this.",
          `Shift tone to better match the intended audience reading ${scope}.`,
        ),
        a(
          "tone-ch",
          "Slightly different tone per channel — still one campaign.",
          `Use slightly different tone per channel (e.g. warmer on WhatsApp, crisper on SMS) while staying consistent in ${scope}.`,
        ),
        a(
          "tone-warm",
          "A touch warmer overall, but still professional.",
          `Warm the tone slightly while keeping professionalism and brand fit for ${scope}.`,
        ),
      ],
    };
  }

  if (/\b(urgent|urgency|scarcity|deadline|limited)\b/i.test(p)) {
    return {
      agentQuestion: "How bold should urgency feel?",
      answers: [
        a(
          "urg-soft",
          "Keep it polite — nudges, not pressure.",
          `Add polite urgency without sounding aggressive for ${scope}.`,
        ),
        a(
          "urg-hard",
          "Stronger — deadlines and scarcity where it’s compliance-safe.",
          `Use clear deadlines and scarcity where appropriate (compliance-safe) for ${scope}.`,
        ),
        a(
          "urg-cta",
          "Mostly in the CTA and last line — calmer body.",
          `Emphasize urgency primarily in the CTA and final line for ${scope}.`,
        ),
        a(
          "urg-mix",
          "Blend light urgency in the body with a stronger close.",
          `Use moderate urgency in the body and a stronger push in the CTA for ${scope}.`,
        ),
      ],
    };
  }

  if (/\b(premium|luxury|high-end|exclusive|elevated)\b/i.test(p)) {
    return {
      agentQuestion: "What flavor of “premium” are you going for?",
      answers: [
        a(
          "prem-vocab",
          "Elevated vocabulary — premium, not corporate-cold.",
          `Refine wording to feel more premium without sounding stiff for ${scope}.`,
        ),
        a(
          "prem-min",
          "Quiet luxury — minimal, confident lines.",
          `Prefer understated, minimal copy with confident phrasing for ${scope}.`,
        ),
        a(
          "prem-bold",
          "Bolder claims, but only where we can back them up.",
          `Use bolder claims where appropriate, backed by concrete value for ${scope}.`,
        ),
        a(
          "prem-mix",
          "Mix elevated wording with one sharp proof point.",
          `Combine premium vocabulary with a concrete benefit or proof for ${scope}.`,
        ),
      ],
    };
  }

  if (/\b(translate|language|locale|spanish|french|german)\b/i.test(p)) {
    return {
      agentQuestion: "How deep should localization go?",
      answers: [
        a(
          "loc-mean",
          "Keep structure and tokens — translate for meaning.",
          `Preserve layout and tokens; translate meaningfully for the target locale affecting ${scope}.`,
        ),
        a(
          "loc-cult",
          "Full cultural pass — idioms and references, not literal only.",
          `Adapt idioms and cultural references, not just literal translation, for ${scope}.`,
        ),
        a(
          "loc-fmt",
          "Formats too — currency, dates, units for the market.",
          `Adjust currency, dates, and units for the target market in ${scope}.`,
        ),
        a(
          "loc-hybrid",
          "Faithful translation plus local examples where it helps.",
          `Translate faithfully and add locally relevant examples where appropriate for ${scope}.`,
        ),
      ],
    };
  }

  if (/\b(image|visual|hero|banner|photo|graphic)\b/i.test(p)) {
    return {
      agentQuestion: "What should we prioritize for visuals?",
      answers: [
        a(
          "vis-hero",
          "Hero and banner crops — aspect ratios per channel.",
          `Prioritize hero/banner recommendations and aspect ratios per channel for ${scope}.`,
        ),
        a(
          "vis-one",
          "One cohesive visual direction across every channel.",
          `Keep visual direction consistent across channels while respecting each format for ${scope}.`,
        ),
        a(
          "vis-a11y",
          "Accessibility — alt text and contrast-safe treatments.",
          `Include alt-text guidance and contrast-safe palettes for ${scope}.`,
        ),
        a(
          "vis-both",
          "Hero first, then align the rest of the journey visually.",
          `Prioritize hero/banner, then extend a consistent visual system for ${scope}.`,
        ),
      ],
    };
  }

  if (/\b(cta|button|click|shop|sign up|subscribe)\b/i.test(p)) {
    return {
      agentQuestion: "What’s the right CTA strategy here?",
      answers: [
        a(
          "cta-one",
          "One primary CTA — demote secondary asks.",
          `Use one primary action; demote secondary asks for ${scope}.`,
        ),
        a(
          "cta-ab",
          "Give me two CTA variants to test.",
          `Propose two CTA variants suitable for A/B testing for ${scope}.`,
        ),
        a(
          "cta-soft",
          "Softer commitment — “View” vs “Buy” where it helps.",
          `Soften commitment language (e.g. “View” vs “Buy”) where helpful for ${scope}.`,
        ),
        a(
          "cta-sharp",
          "Sharpen the main CTA — keep a subtle secondary if needed.",
          `Strengthen the primary CTA while optionally retaining a low-friction secondary for ${scope}.`,
        ),
      ],
    };
  }

  if (/\b(personal|personalization|token|\{\{)\b/i.test(p)) {
    return {
      agentQuestion: "How far should we take personalization?",
      answers: [
        a(
          "per-safe",
          "Safe defaults — tokens with solid fallbacks.",
          `Use personalization tokens responsibly with sensible fallbacks for ${scope}.`,
        ),
        a(
          "per-seg",
          "Assume a motivation-based segment and tailor lightly.",
          `Assume a motivation-based segment and tailor copy lightly for ${scope}.`,
        ),
        a(
          "per-min",
          "Light touch — names and basics only.",
          `Use minimal personalization (e.g. first name) with safe fallbacks for ${scope}.`,
        ),
        a(
          "per-rich",
          "Richer personalization where CRM data supports it.",
          `Apply richer personalization where data quality supports it without awkward gaps for ${scope}.`,
        ),
      ],
    };
  }

  return {
    agentQuestion: "Before I run with that — what should I optimize for as I apply your change?",
    answers: [
      a(
        "def-priority",
        "Impact first — subject, hero, and CTA before polish.",
        `Apply changes where they move metrics most (subject/hero/CTA) for ${scope}.`,
      ),
      a(
        "def-brand",
        "Brand guardrails — voice and compliance come first.",
        `Prioritize brand compliance and voice consistency across edits for ${scope}.`,
      ),
      a(
        "def-creative",
        "A bit more creative freedom — still on-brand.",
        `Take reasonable creative liberties while staying on-brand for ${scope}.`,
      ),
      a(
        "def-conv",
        "Conversion clarity — one obvious next step.",
        `Optimize for a clear next step and minimal ambiguity in ${scope}.`,
      ),
    ],
  };
}
