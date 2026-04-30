export interface TestContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** E.164 or formatted — used for SMS / WhatsApp test sends in preview */
  phone?: string;
  company: string;
  segment: string;
  language: string;
}

export const mockTestContacts: TestContact[] = [
  {
    id: "contact-1",
    firstName: "VIP",
    lastName: "Platinum",
    email: "vip-platinum@example.com",
    phone: "+1 (415) 555-0142",
    company: "TechCorp",
    segment: "VIP-Platinum",
    language: "en-US",
  },
  {
    id: "contact-2",
    firstName: "VIP",
    lastName: "Gold",
    email: "vip-gold@example.com",
    phone: "+1 (646) 555-0198",
    company: "GreenLife Co",
    segment: "VIP-Gold",
    language: "en-US",
  },
  {
    id: "contact-3",
    firstName: "Guest",
    lastName: "",
    email: "guest@example.com",
    phone: "+34 612 555 883",
    company: "Startup Inc",
    segment: "Guest",
    language: "es-ES",
  },
];

export const supportedLanguages = [
  { code: "en-US", label: "English (US)", flag: "🇺🇸" },
  { code: "en-GB", label: "English (UK)", flag: "🇬🇧" },
  { code: "es-ES", label: "Español", flag: "🇪🇸" },
  { code: "fr-FR", label: "Français", flag: "🇫🇷" },
  { code: "de-DE", label: "Deutsch", flag: "🇩🇪" },
  { code: "ja-JP", label: "日本語", flag: "🇯🇵" },
];
