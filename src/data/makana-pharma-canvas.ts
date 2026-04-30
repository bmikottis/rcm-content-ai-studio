import type { ChannelCard, ImageData } from "@/types/simple-canvas";

/**
 * Demo-only HCP email blocks for Makana Health / ONCURA® (oncurimab).
 * Layout mirrors a typical oncology sales aid (MOA, clinical profile, ISI, PI references).
 * ONCURA® (oncurimab) is fictitious for UI development; copy is not sourced from a real label.
 */

const MAKANA_LOGO: ImageData = {
  src: "/images/makana/makana-logo.png",
  alt: "Makana Health",
  fit: "contain",
};

const HCP_HERO = {
  src: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=960&q=80",
  alt: "Research and clinical development",
  fit: "cover" as const,
};

const EMAIL_W = 360;
const GAP = 40;
const COL = EMAIL_W + GAP;

function estimateCardHeight(elements: ChannelCard["elements"]): number {
  const HEADER = 56;
  const PAD = 48;
  let h = HEADER + PAD;
  for (const el of elements) {
    switch (el.type) {
      case "image": {
        const fit = el.imageData?.fit || "cover";
        h += fit === "contain" ? 56 : 180;
        break;
      }
      case "headline":
        h += 52;
        break;
      case "body": {
        const lines = el.content.split("\n").length;
        const charLen = el.content.length;
        const wrappedLines = Math.max(lines, Math.ceil(charLen / 38));
        h += Math.max(48, wrappedLines * 20 + 16);
        break;
      }
      case "cta":
        h += 52;
        break;
      case "divider":
        h += 16;
        break;
    }
  }
  return h;
}

function layoutMakanaEmails(cards: ChannelCard[]): ChannelCard[] {
  const heights = cards.map((c) => estimateCardHeight(c.elements));
  const maxH = Math.max(...heights);
  return cards.map((c, col) => ({
    ...c,
    size: { width: EMAIL_W, height: heights[col]! },
    position: {
      x: 80 + col * COL,
      y: 80 + (maxH - heights[col]!) / 2,
    },
  }));
}

export function buildMakanaOncuraEmailCards(): ChannelCard[] {
  const isiBlock =
    "IMPORTANT SAFETY INFORMATION (ISI) — PLACEHOLDER\n\n" +
    "This email is a design prototype only. Insert MLR-approved ISI, boxed warning (if applicable), " +
    "and contraindications exactly as required by local regulations. Do not use for promotional purposes.\n\n" +
    "Please see full Prescribing Information for ONCURA® (oncurimab) [link to PI].";

  const cards: ChannelCard[] = [
    {
      id: "mh-oncura-email-1",
      channel: "email",
      title: "HCP — MOA & patient selection",
      subjectLine: "ONCURA® (oncurimab): mechanism aligned to your practice",
      preheader: "A differentiated anti-tumor pathway — educational overview for HCPs",
      status: "draft",
      tags: ["hcp", "moa", "oncura"],
      position: { x: 0, y: 0 },
      size: { width: EMAIL_W, height: 0 },
      elements: [
        { id: "mh1-logo", type: "image", content: "Makana Health", imageData: MAKANA_LOGO },
        {
          id: "mh1-hero",
          type: "image",
          content: "Hero",
          imageData: HCP_HERO,
        },
        {
          id: "mh1-h1",
          type: "headline",
          content: "Help appropriate patients stay on therapy with ONCURA®",
        },
        {
          id: "mh1-body",
          type: "body",
          content:
            "Dear {{hcp_salutation}},\n\n" +
            "This series is modeled on the Makana Health — ONCURA® (oncurimab) sales aid structure: " +
            "a brief mechanism-of-action narrative, where oncurimab may fit in sequence or combination regimens, " +
            "and prompts to consult diagnostic and biomarker guidance as reflected in your approved label.\n\n" +
            "Use only approved claims and visuals after MLR review. Replace bracketed items with label-accurate statements.\n\n" +
            "Reference: the bundled sales aid PDF in this demo lives at /docs/makana/oncura-sales-aid.pdf (open in a new tab after deploy).\n\n" +
            "Drafting note: phrases like best in class should be tied to an approved claim citation before MLR submission.",
        },
        {
          id: "mh1-body2",
          type: "body",
          content:
            "Suggested aid sections to mirror in final copy:\n" +
            "• Product overview & brand positioning\n" +
            "• MOA / pathway graphic (per approved visual aid)\n" +
            "• Indication statement & key eligibility notes\n" +
            "• Patient identification & monitoring checklist",
        },
        { id: "mh1-cta", type: "cta", content: "Open bundled sales aid (PDF)" },
        { id: "mh1-div", type: "divider", content: "" },
        { id: "mh1-isi", type: "body", content: isiBlock },
      ],
    },
    {
      id: "mh-oncura-email-2",
      channel: "email",
      title: "HCP — Clinical profile & access",
      subjectLine: "ONCURA® (oncurimab): evidence, safety, and dosing snapshot",
      preheader: "Study context, monitoring, and resources — insert PI-accurate data",
      status: "draft",
      tags: ["hcp", "clinical", "oncura"],
      position: { x: 0, y: 0 },
      size: { width: EMAIL_W, height: 0 },
      elements: [
        { id: "mh2-logo", type: "image", content: "Makana Health", imageData: MAKANA_LOGO },
        {
          id: "mh2-h1",
          type: "headline",
          content: "Clinical profile shaped for the sales conversation",
        },
        {
          id: "mh2-body",
          type: "body",
          content:
            "Map final copy to your PDF sections (e.g., pivotal study design, primary endpoint hierarchy, " +
            "pre-specified subgroup analyses, exposure–response where applicable). " +
            "Insert only statistics and cohort definitions that appear verbatim in the label or approved slide deck.",
        },
        {
          id: "mh2-body2",
          type: "body",
          content:
            "Safety & tolerability:\n" +
            "• Summarize adverse reactions and lab abnormalities per label frequency categories\n" +
            "• Include dose modification / interruption guidance as approved\n\n" +
            "Dosing & administration:\n" +
            "• Pre-medication, infusion rate, and duration of therapy per PI\n" +
            "• Renal/hepatic adjustment bullets if labeled",
        },
        { id: "mh2-cta", type: "cta", content: "Request an MSL discussion" },
        { id: "mh2-cta2", type: "cta", content: "Download PI & medication guide" },
        { id: "mh2-div", type: "divider", content: "" },
        { id: "mh2-isi", type: "body", content: isiBlock },
      ],
    },
  ];

  return layoutMakanaEmails(cards);
}
