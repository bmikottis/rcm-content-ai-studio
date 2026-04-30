import { create } from "zustand";
import { ContentBlock } from "@/types/canvas";

interface VibeEditState {
  selectedBlockId: string | null;
  isEditing: boolean;
  vibePrompt: string;
  isRegenerating: boolean;
  originalContent: ContentBlock | null;
  updatedContent: ContentBlock | null;
  diffView: "side-by-side" | "inline";
  showDiff: boolean;

  selectBlock: (blockId: string | null) => void;
  setVibePrompt: (prompt: string) => void;
  setEditing: (editing: boolean) => void;
  setRegenerating: (regenerating: boolean) => void;
  setOriginalContent: (content: ContentBlock | null) => void;
  setUpdatedContent: (content: ContentBlock | null) => void;
  setDiffView: (view: "side-by-side" | "inline") => void;
  setShowDiff: (show: boolean) => void;
  acceptChanges: () => void;
  revertChanges: () => void;
  cancelEdit: () => void;
  reset: () => void;
}

export const useVibeEditStore = create<VibeEditState>((set) => ({
  selectedBlockId: null,
  isEditing: false,
  vibePrompt: "",
  isRegenerating: false,
  originalContent: null,
  updatedContent: null,
  diffView: "inline",
  showDiff: false,

  selectBlock: (blockId) =>
    set({
      selectedBlockId: blockId,
      isEditing: blockId !== null,
    }),

  setVibePrompt: (prompt) => set({ vibePrompt: prompt }),

  setEditing: (editing) => set({ isEditing: editing }),

  setRegenerating: (regenerating) => set({ isRegenerating: regenerating }),

  setOriginalContent: (content) => set({ originalContent: content }),

  setUpdatedContent: (content) => set({ updatedContent: content }),

  setDiffView: (view) => set({ diffView: view }),

  setShowDiff: (show) => set({ showDiff: show }),

  acceptChanges: () =>
    set({
      originalContent: null,
      updatedContent: null,
      showDiff: false,
      vibePrompt: "",
      isEditing: false,
    }),

  revertChanges: () =>
    set({
      updatedContent: null,
      showDiff: false,
    }),

  cancelEdit: () =>
    set({
      isEditing: false,
      vibePrompt: "",
      originalContent: null,
      updatedContent: null,
      showDiff: false,
    }),

  reset: () =>
    set({
      selectedBlockId: null,
      isEditing: false,
      vibePrompt: "",
      isRegenerating: false,
      originalContent: null,
      updatedContent: null,
      showDiff: false,
    }),
}));
