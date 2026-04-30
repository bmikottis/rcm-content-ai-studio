export type InlineTokenType = 
  | "brand" 
  | "audience" 
  | "asset" 
  | "image" 
  | "file" 
  | "palette" 
  | "segment";

export interface InlineToken {
  id: string;
  type: InlineTokenType;
  label: string;
  preview?: string;
  data?: Record<string, unknown>;
}

export interface Attachment {
  id: string;
  type: "pdf" | "image" | "figma" | "doc" | "asset";
  name: string;
  size?: string;
  preview?: string;
  source: "upload" | "salesforce" | "existing";
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
  source: "brand" | "campaign" | "custom";
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "generation" | "optimization" | "localization" | "personalization";
}

export interface DesignStyle {
  id: string;
  name: string;
  description: string;
  preview?: string;
}

export interface ComposerState {
  prompt: string;
  tokens: InlineToken[];
  attachments: Attachment[];
  selectedPalette: ColorPalette | null;
  selectedSkills: Skill[];
  designStyle: DesignStyle | null;
  thinkingMode: boolean;
}
