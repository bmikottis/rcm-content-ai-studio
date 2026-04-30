import { create } from "zustand";

export interface BrandColor {
  id: string;
  hex: string;
  label: string;
}

export interface BrandFont {
  id: string;
  name: string;
  role: "headline" | "body" | "accent";
}

export type ToneOption = "professional" | "friendly" | "playful" | "luxury" | "bold" | "minimal" | "warm" | "editorial";

export interface BrandState {
  colors: BrandColor[];
  fonts: BrandFont[];
  tones: ToneOption[];
}

interface BrandStore extends BrandState {
  addColor: (hex: string, label?: string) => void;
  removeColor: (id: string) => void;
  updateColor: (id: string, hex: string, label?: string) => void;
  addFont: (name: string, role: BrandFont["role"]) => void;
  removeFont: (id: string) => void;
  updateFont: (id: string, updates: Partial<Pick<BrandFont, "name" | "role">>) => void;
  toggleTone: (tone: ToneOption) => void;
  setTones: (tones: ToneOption[]) => void;
}

export const useBrandStore = create<BrandStore>((set) => ({
  // Williams Sonoma brand defaults
  colors: [
    { id: "c1", hex: "#4A6741", label: "Forest" },
    { id: "c2", hex: "#C4A35A", label: "Gold" },
    { id: "c3", hex: "#2C2C2C", label: "Charcoal" },
    { id: "c4", hex: "#8B4513", label: "Copper" },
    { id: "c5", hex: "#F5F0EB", label: "Cream" },
  ],
  fonts: [
    { id: "f1", name: "Salesforce Sans", role: "headline" },
    { id: "f2", name: "Salesforce Sans", role: "body" },
  ],
  tones: ["luxury", "warm"],

  addColor: (hex, label) => {
    const id = `c-${Date.now()}`;
    set((s) => ({ colors: [...s.colors, { id, hex, label: label ?? hex }] }));
  },
  removeColor: (id) => {
    set((s) => ({ colors: s.colors.filter((c) => c.id !== id) }));
  },
  updateColor: (id, hex, label) => {
    set((s) => ({
      colors: s.colors.map((c) => (c.id === id ? { ...c, hex, label: label ?? c.label } : c)),
    }));
  },
  addFont: (name, role) => {
    const id = `f-${Date.now()}`;
    set((s) => ({ fonts: [...s.fonts, { id, name, role }] }));
  },
  removeFont: (id) => {
    set((s) => ({ fonts: s.fonts.filter((f) => f.id !== id) }));
  },
  updateFont: (id, updates) => {
    set((s) => ({
      fonts: s.fonts.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));
  },
  toggleTone: (tone) => {
    set((s) => ({
      tones: s.tones.includes(tone) ? s.tones.filter((t) => t !== tone) : [...s.tones, tone],
    }));
  },
  setTones: (tones) => set({ tones }),
}));
