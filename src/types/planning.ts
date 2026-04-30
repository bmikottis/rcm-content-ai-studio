import { BrandKit, Assets, AudienceSegment } from "./context";

export type Channel = "email" | "sms" | "whatsapp" | "social" | "print";
export type CampaignGoal = "awareness" | "engagement" | "conversion" | "retention";

export interface PlanningContext {
  brand: BrandKit | null;
  assets: Assets | null;
  audiences: AudienceSegment[] | null;
  detectedAudience: string | null;
  detectedProduct: string | null;
  detectedGoal: string | null;
  keyMessage: string | null;
  channels: Channel[];
  toneAdjustments: string | null;
  campaignGoal: CampaignGoal | null;
}

export interface PlanningStep {
  id: string;
  type: "acknowledgment" | "question" | "summary";
  content: string;
  inputType?: "text" | "single-select" | "multi-select";
  options?: { id: string; label: string }[];
  answer?: string | string[];
  isComplete: boolean;
}

export interface CampaignSummary {
  title: string;
  audience: string;
  channels: Channel[];
  keyMessage: string;
  tone: string;
  goal: CampaignGoal;
}
