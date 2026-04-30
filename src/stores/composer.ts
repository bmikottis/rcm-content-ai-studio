import { create } from "zustand";
import { 
  InlineToken, 
  Attachment, 
  ColorPalette, 
  Skill, 
  DesignStyle,
  ComposerState 
} from "@/types/composer";

interface ComposerStore extends ComposerState {
  // Prompt
  setPrompt: (prompt: string) => void;
  
  // Tokens
  addToken: (token: InlineToken) => void;
  removeToken: (id: string) => void;
  clearTokens: () => void;
  
  // Attachments
  addAttachment: (attachment: Attachment) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  
  // Palette
  setPalette: (palette: ColorPalette | null) => void;
  
  // Skills
  toggleSkill: (skill: Skill) => void;
  clearSkills: () => void;
  
  // Design Style
  setDesignStyle: (style: DesignStyle | null) => void;
  
  // Thinking Mode
  setThinkingMode: (enabled: boolean) => void;
  
  // Reset
  reset: () => void;
}

const initialState: ComposerState = {
  prompt: "",
  tokens: [],
  attachments: [],
  selectedPalette: null,
  selectedSkills: [],
  designStyle: null,
  thinkingMode: false,
};

export const useComposerStore = create<ComposerStore>((set) => ({
  ...initialState,

  setPrompt: (prompt) => set({ prompt }),

  addToken: (token) => set((state) => ({
    tokens: [...state.tokens.filter(t => t.id !== token.id), token],
  })),

  removeToken: (id) => set((state) => ({
    tokens: state.tokens.filter(t => t.id !== id),
  })),

  clearTokens: () => set({ tokens: [] }),

  addAttachment: (attachment) => set((state) => ({
    attachments: [...state.attachments, attachment],
  })),

  removeAttachment: (id) => set((state) => ({
    attachments: state.attachments.filter(a => a.id !== id),
  })),

  clearAttachments: () => set({ attachments: [] }),

  setPalette: (palette) => set({ selectedPalette: palette }),

  toggleSkill: (skill) => set((state) => {
    const exists = state.selectedSkills.find(s => s.id === skill.id);
    return {
      selectedSkills: exists 
        ? state.selectedSkills.filter(s => s.id !== skill.id)
        : [...state.selectedSkills, skill],
    };
  }),

  clearSkills: () => set({ selectedSkills: [] }),

  setDesignStyle: (style) => set({ designStyle: style }),

  setThinkingMode: (enabled) => set({ thinkingMode: enabled }),

  reset: () => set(initialState),
}));

// Mock data
export const mockSkills: Skill[] = [
  { id: "multichannel", name: "Multi-channel Campaign", description: "Generate coordinated content across email, SMS, and WhatsApp", icon: "📬", category: "generation" },
  { id: "product-launch", name: "Product Launch", description: "Create a comprehensive product launch sequence", icon: "🚀", category: "generation" },
  { id: "email-sms-opt", name: "Email + SMS Optimization", description: "Optimize messaging for both channels", icon: "⚡", category: "optimization" },
  { id: "localization", name: "Multi-language", description: "Generate content in multiple languages", icon: "🌍", category: "localization" },
  { id: "personalization", name: "Personalization Strategy", description: "Add dynamic personalization tokens", icon: "👤", category: "personalization" },
  { id: "asset-reuse", name: "Asset Reuse", description: "Reuse and adapt assets across channels", icon: "♻️", category: "optimization" },
];

export const mockDesignStyles: DesignStyle[] = [
  { id: "brand", name: "Brand Default", description: "Use your brand's design system" },
  { id: "minimal", name: "Minimal", description: "Clean, simple layouts" },
  { id: "bold", name: "Bold", description: "Strong colors and typography" },
  { id: "editorial", name: "Editorial", description: "Magazine-style layouts" },
  { id: "modern", name: "Modern", description: "Contemporary design patterns" },
];

export const mockPalettes: ColorPalette[] = [
  { id: "brand-primary", name: "Brand Primary", colors: ["#00A1E0", "#0078A8", "#1B3A57", "#FFFFFF"], source: "brand" },
  { id: "brand-secondary", name: "Brand Accent", colors: ["#6B5ACC", "#9B8CDB", "#E8E4F8", "#FFFFFF"], source: "brand" },
  { id: "holiday", name: "Holiday Season", colors: ["#C41E3A", "#165B33", "#FFD700", "#FFFFFF"], source: "campaign" },
  { id: "summer", name: "Summer Vibes", colors: ["#FF6B6B", "#4ECDC4", "#FFE66D", "#FFFFFF"], source: "campaign" },
];
