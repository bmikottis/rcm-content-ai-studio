import { create } from "zustand";

export type RegulatedContentType = "hcp_email" | "dtc_email" | "multichannel";
export type RegulatedAudience = "hcp" | "patient" | "payer";
export type RegulatedRegion = "us" | "eu_uk" | "jp" | "global";
export type RegulatedIntent = "promotional" | "educational" | "reminder";

export interface RegulatedProfile {
  contentType: RegulatedContentType;
  audience: RegulatedAudience;
  region: RegulatedRegion;
  intent: RegulatedIntent;
  /** Featured molecules / brands (e.g. ONCURA) */
  productCodes: string[];
}

export interface ApprovedClaim {
  id: string;
  code: string;
  title: string;
  body: string;
  status: "approved" | "draft" | "retired";
  recommendationReasoning: string;
  references: { id: string; label: string; anchorCount: number; href?: string }[];
  audiences: RegulatedAudience[];
  regions: RegulatedRegion[];
  intents: RegulatedIntent[];
  products: string[];
  channelHints: ("email" | "sms")[];
  elementTypes: ("headline" | "body" | "cta" | "image")[];
}

/** Mock claims library — would be hydrated from Veeva / IQVIA / internal CMS in production. */
export const APPROVED_CLAIMS: ApprovedClaim[] = [
  {
    id: "claim-oncura-001",
    code: "RCS-0001",
    title: "MOA — pathway framing",
    body:
      "ONCURA® (oncurimab) is a humanized monoclonal antibody designed to bind its target with high specificity, supporting tumor microenvironment modulation as described in the approved prescribing information.",
    status: "approved",
    recommendationReasoning:
      "Recommended because this block is educational HCP email copy in US/global context and needs a label-aligned mechanism statement for early body content.",
    references: [
      {
        id: "oncura-pi-us-v3-2",
        label: "ONCURA US Prescribing Information v3.2",
        anchorCount: 4,
      },
    ],
    audiences: ["hcp"],
    regions: ["us", "global"],
    intents: ["educational", "promotional"],
    products: ["ONCURA"],
    channelHints: ["email"],
    elementTypes: ["body", "headline"],
  },
  {
    id: "claim-oncura-002",
    code: "RCS-0002",
    title: "Efficacy framing (label-aligned placeholder)",
    body:
      "Efficacy results, study design, and endpoint hierarchy must mirror the approved label and MLR-stamped slide deck. Replace this claim with verbatim approved language before use.",
    status: "approved",
    recommendationReasoning:
      "Recommended when efficacy framing is needed but generated copy is missing explicit label alignment reminders for medical/legal review.",
    references: [
      {
        id: "oncura-core-slide-deck-mlr",
        label: "ONCURA MLR Approved Core Deck",
        anchorCount: 3,
      },
    ],
    audiences: ["hcp"],
    regions: ["us", "eu_uk", "global"],
    intents: ["educational", "promotional"],
    products: ["ONCURA"],
    channelHints: ["email"],
    elementTypes: ["body"],
  },
  {
    id: "claim-oncura-003",
    code: "RCS-0003",
    title: "ISI anchor line",
    body:
      "IMPORTANT SAFETY INFORMATION: [Insert boxed warning, contraindications, warnings and precautions, and adverse reactions per local label]. Please see full Prescribing Information for ONCURA® (oncurimab).",
    status: "approved",
    recommendationReasoning:
      "Recommended because this content type frequently requires an ISI anchor for fair-balance and this block position supports required safety framing.",
    references: [
      {
        id: "oncura-isi-template-us",
        label: "ONCURA ISI Template (US) - Approved",
        anchorCount: 5,
      },
    ],
    audiences: ["hcp", "patient"],
    regions: ["us", "global"],
    intents: ["promotional", "educational", "reminder"],
    products: ["ONCURA"],
    channelHints: ["email"],
    elementTypes: ["body"],
  },
  {
    id: "claim-oncura-eu-01",
    code: "RCS-0004",
    title: "EU — SmPC reference",
    body:
      "For healthcare professionals in the EU: refer to the Summary of Product Characteristics (SmPC) before prescribing. Local requirements may differ from US labeling.",
    status: "approved",
    recommendationReasoning:
      "Recommended for EU/UK profile to ensure region-specific SmPC language is surfaced instead of US-only labeling references.",
    references: [
      {
        id: "oncura-smpc-eu",
        label: "ONCURA SmPC (EU/UK)",
        anchorCount: 2,
      },
    ],
    audiences: ["hcp"],
    regions: ["eu_uk"],
    intents: ["educational", "promotional"],
    products: ["ONCURA"],
    channelHints: ["email"],
    elementTypes: ["body"],
  },
  {
    id: "claim-oncura-img-01",
    code: "RCS-0005",
    title: "Approved visual — mechanism schematic",
    body: "Use only the MLR-approved mechanism schematic (version 3.2 or later) from the digital asset library. Do not crop mandatory footnotes.",
    status: "approved",
    recommendationReasoning:
      "Recommended for image blocks in regulated email so creative teams use approved mechanism visuals with required footnotes intact.",
    references: [
      {
        id: "oncura-dam-mech-v3-2",
        label: "ONCURA DAM Asset: Mechanism Schematic v3.2",
        anchorCount: 3,
      },
    ],
    audiences: ["hcp"],
    regions: ["us", "eu_uk", "global"],
    intents: ["educational", "promotional"],
    products: ["ONCURA"],
    channelHints: ["email"],
    elementTypes: ["image"],
  },
];

const defaultProfile: RegulatedProfile = {
  contentType: "hcp_email",
  audience: "hcp",
  region: "us",
  intent: "educational",
  productCodes: ["ONCURA"],
};

interface RegulatedContentState {
  profile: RegulatedProfile;
  /** `${cardId}:${elementId}` → dismissed claim ids */
  dismissedByElement: Record<string, string[]>;
  /** Author-marked blocks for compliance review — `${cardId}:${elementId}` */
  creatorComplianceFlags: Record<string, boolean>;
  /** Dismissed non-blocking compliance flags by element key (`${cardId}:${elementId}`). */
  dismissedComplianceFlags: Record<string, boolean>;
  setProfile: (partial: Partial<RegulatedProfile>) => void;
  dismissClaim: (elementKey: string, claimId: string) => void;
  clearDismissedForElement: (elementKey: string) => void;
  toggleCreatorComplianceFlag: (elementKey: string) => void;
  dismissComplianceFlag: (elementKey: string) => void;
  restoreComplianceFlag: (elementKey: string) => void;
}

export const useRegulatedContentStore = create<RegulatedContentState>((set) => ({
  profile: { ...defaultProfile },
  dismissedByElement: {},
  creatorComplianceFlags: {},
  dismissedComplianceFlags: {},

  setProfile: (partial) =>
    set((s) => ({
      profile: { ...s.profile, ...partial },
    })),

  dismissClaim: (elementKey, claimId) =>
    set((s) => {
      const prev = s.dismissedByElement[elementKey] ?? [];
      if (prev.includes(claimId)) return s;
      return {
        dismissedByElement: {
          ...s.dismissedByElement,
          [elementKey]: [...prev, claimId],
        },
      };
    }),

  clearDismissedForElement: (elementKey) =>
    set((s) => {
      const { [elementKey]: _, ...rest } = s.dismissedByElement;
      return { dismissedByElement: rest };
    }),

  toggleCreatorComplianceFlag: (elementKey) =>
    set((s) => {
      const next = { ...s.creatorComplianceFlags };
      if (next[elementKey]) delete next[elementKey];
      else next[elementKey] = true;
      return { creatorComplianceFlags: next };
    }),

  dismissComplianceFlag: (elementKey) =>
    set((s) => ({
      dismissedComplianceFlags: {
        ...s.dismissedComplianceFlags,
        [elementKey]: true,
      },
    })),

  restoreComplianceFlag: (elementKey) =>
    set((s) => {
      const { [elementKey]: _, ...rest } = s.dismissedComplianceFlags;
      return { dismissedComplianceFlags: rest };
    }),
}));

export function elementKey(cardId: string, elementId: string): string {
  return `${cardId}:${elementId}`;
}

function regionMatches(claimRegions: RegulatedRegion[], profileRegion: RegulatedRegion): boolean {
  if (claimRegions.includes("global")) return true;
  return claimRegions.includes(profileRegion);
}

export function filterClaimsForContext(params: {
  profile: RegulatedProfile;
  channel: "email" | "sms";
  elementType: "headline" | "body" | "cta" | "image" | "divider";
  dismissedIds: string[];
}): ApprovedClaim[] {
  const { profile, channel, elementType, dismissedIds } = params;
  if (elementType === "divider") return [];

  return APPROVED_CLAIMS.filter((c) => {
    if (c.status !== "approved") return false;
    if (dismissedIds.includes(c.id)) return false;
    if (!c.audiences.includes(profile.audience)) return false;
    if (!regionMatches(c.regions, profile.region)) return false;
    if (!c.intents.includes(profile.intent)) return false;
    if (!c.channelHints.includes(channel)) return false;
    if (!c.elementTypes.includes(elementType)) return false;
    if (profile.productCodes.length > 0) {
      const hit = c.products.some((p) =>
        profile.productCodes.some((code) => code.toUpperCase() === p.toUpperCase()),
      );
      if (!hit) return false;
    }
    return true;
  });
}
