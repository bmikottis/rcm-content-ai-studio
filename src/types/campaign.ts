import { Channel } from "./project";
import { ColorPalette, Skill, DesignStyle, Attachment } from "./composer";

export type CampaignStatus = "planning" | "generating" | "draft" | "review" | "ready";

export interface ThinkingStep {
  id: string;
  label: string;
  description: string;
  status: "pending" | "active" | "completed";
  result?: string;
}

export interface ChannelContent {
  channel: Channel;
  headline: string;
  body: string;
  cta: string;
  visualDirection: string;
  personalization?: string[];
  assets?: string[];
}

export interface CampaignPlan {
  objective: string;
  targetAudience: string;
  keyMessage: string;
  tone: string;
  channels: Channel[];
  contentStrategy: string;
  assumptions?: string[];
}

export interface GeneratedCampaign {
  id: string;
  name: string;
  description: string;
  status: CampaignStatus;
  plan: CampaignPlan;
  content: ChannelContent[];
  createdAt: Date;
  updatedAt: Date;
  prompt: string;
  context: {
    brand?: string;
    audience?: string;
    palette?: ColorPalette;
    skills: Skill[];
    designStyle?: DesignStyle;
    attachments: Attachment[];
  };
}

export interface CampaignCreationState {
  isCreating: boolean;
  currentPhase: "idle" | "thinking" | "planning" | "generating" | "complete" | "error";
  thinkingSteps: ThinkingStep[];
  plan: CampaignPlan | null;
  generatedCampaign: GeneratedCampaign | null;
  error: string | null;
  progress: number;
  pendingCampaignId: string | null;
  pendingPrompt: string | null;
  pendingName: string | null;
}
