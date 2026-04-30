export type ChannelType = "email" | "sms" | "whatsapp";

export interface ContentBlock {
  id: string;
  channel: ChannelType;
  variant?: number;
  headline: string;
  body: string;
  image?: MockImage | null;
  cta: { text: string; url: string };
  personalization: string[];
  brandCompliance: number;
  characterCount?: number;
  generatedAt: Date;
}

export interface MockImage {
  id: string;
  placeholder: string;
  aspectRatio: "16:9" | "1:1" | "4:5";
  altText: string;
}

export interface AgentMessage {
  id: string;
  type: "agent" | "user";
  content: string;
  timestamp: Date;
  contentRefs?: string[];
}

export interface BrandComplianceScore {
  overall: number;
  breakdown: {
    toneAlignment: number;
    colorUsage: number;
    messageClarity: number;
    ctaEffectiveness: number;
  };
}
