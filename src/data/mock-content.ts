import { ContentBlock, AgentMessage } from "@/types/canvas";

export const mockGeneratedContent: ContentBlock[] = [
  {
    id: "email-1",
    channel: "email",
    variant: 1,
    headline: "Adventure meets responsibility, {{first_name}}",
    body: `Dear {{first_name}},

The road to tomorrow starts today. Introducing the Salesforce Palette Electric SUV — designed for families who refuse to compromise.

With 350 miles of range and room for everything that matters, it's time to move forward. Together.

We've crafted every detail with your family in mind. From the whisper-quiet cabin to the industry-leading safety features, this is the SUV that grows with you.`,
    image: {
      id: "hero-1",
      placeholder: "Salesforce Palette Electric SUV exterior, modern cityscape",
      aspectRatio: "16:9",
      altText: "Salesforce Palette Electric SUV parked in urban setting",
    },
    cta: { text: "Discover More", url: "#" },
    personalization: ["{{first_name}}"],
    brandCompliance: 92,
    generatedAt: new Date(),
  },
  {
    id: "sms-1",
    channel: "sms",
    headline: "",
    body: "{{first_name}}, the Salesforce Palette Electric SUV is here. Adventure meets responsibility. Book your test drive: aura.co/suv",
    image: null,
    cta: { text: "aura.co/suv", url: "#" },
    personalization: ["{{first_name}}"],
    brandCompliance: 78,
    characterCount: 112,
    generatedAt: new Date(),
  },
  {
    id: "whatsapp-1",
    channel: "whatsapp",
    headline: "Hi {{first_name}}! 👋",
    body: `Ready to experience the future of family driving?

The Salesforce Palette Electric SUV combines:
✓ 350 miles of range
✓ Space for the whole family
✓ Zero compromises

Tap below to book your exclusive test drive.`,
    image: {
      id: "product-1",
      placeholder: "Salesforce Palette Electric SUV product shot",
      aspectRatio: "1:1",
      altText: "Salesforce Palette Electric SUV front view",
    },
    cta: { text: "Book Test Drive 🚗", url: "#" },
    personalization: ["{{first_name}}"],
    brandCompliance: 85,
    characterCount: 245,
    generatedAt: new Date(),
  },
];

export const mockAgentMessages: AgentMessage[] = [
  {
    id: "msg-1",
    type: "agent",
    content: "I've created 3 content variants for your campaign: 1 email, 1 SMS, and 1 WhatsApp message.",
    timestamp: new Date(),
    contentRefs: ["email-1", "sms-1", "whatsapp-1"],
  },
  {
    id: "msg-2",
    type: "agent",
    content: "All content uses Salesforce Palette's refined tone and includes personalization tokens. Brand compliance scores are shown on each block.",
    timestamp: new Date(),
  },
];
