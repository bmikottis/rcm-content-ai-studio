import { create } from "zustand";
import { ToolType, SelectionContext, ImageEditState, GroupEditAction } from "@/types/tools";

export type InspectorDetail =
  | null
  | { type: "block"; blockId: string }
  | { type: "group"; groupId: string }
  | { type: "image-edit"; blockId: string; mode: ImageEditState["mode"] };

interface ToolsState {
  activeTool: ToolType;
  selectionContext: SelectionContext;
  showContextPanel: boolean;
  /** When true, side panel shows transcript only (no composer) — opened from Ask Agentforce history. */
  agentPanelHistoryOnly: boolean;
  /** Drill-in: declarative editor for a fragment or group (back button to exit). */
  inspectorDetail: InspectorDetail;
  imageEditState: ImageEditState | null;
  pendingGroupEdit: GroupEditAction | null;
  isProcessing: boolean;
  
  // Tool actions (closeInspector defaults true for toolbar shortcuts; left sidebar uses false for Blocks/Brand/Assets)
  setActiveTool: (tool: ToolType, options?: { closeInspector?: boolean }) => void;
  openInspectorBlockDetail: (blockId: string) => void;
  openInspectorGroupDetail: (groupId: string) => void;
  closeInspectorDetail: () => void;
  updateSelectionContext: (context: Partial<SelectionContext>) => void;
  toggleContextPanel: () => void;
  openAgentHistoryPanel: () => void;
  closeAgentPanel: () => void;
  
  // Image editing
  startImageEdit: (blockId: string, mode: ImageEditState["mode"]) => void;
  updateImageEdit: (updates: Partial<ImageEditState>) => void;
  cancelImageEdit: () => void;
  applyImageEdit: () => Promise<void>;
  
  // Group editing
  startGroupEdit: (groupId: string, action: GroupEditAction["action"]) => void;
  applyGroupEdit: () => Promise<void>;
  cancelGroupEdit: () => void;
  
  // Processing
  setProcessing: (isProcessing: boolean) => void;
}

export const useToolsStore = create<ToolsState>((set, get) => ({
  activeTool: "select",
  selectionContext: { type: "none", ids: [] },
  showContextPanel: false,
  agentPanelHistoryOnly: false,
  inspectorDetail: null,
  imageEditState: null,
  pendingGroupEdit: null,
  isProcessing: false,

  setActiveTool: (tool, options) => {
    const closeInspector = options?.closeInspector !== false;
    set({
      activeTool: tool,
      ...(closeInspector ? { inspectorDetail: null } : {}),
    });
    if (tool !== "select") {
      set({ showContextPanel: false, agentPanelHistoryOnly: false });
    }
  },

  openInspectorBlockDetail: (blockId) => {
    set({ inspectorDetail: { type: "block", blockId }, activeTool: "select" });
  },

  openInspectorGroupDetail: (groupId) => {
    set({ inspectorDetail: { type: "group", groupId }, activeTool: "select" });
  },

  closeInspectorDetail: () => {
    const prev = get().inspectorDetail;
    if (prev?.type === "image-edit") {
      set({ inspectorDetail: null, imageEditState: null });
    } else {
      set({ inspectorDetail: null });
    }
  },

  updateSelectionContext: (context) => {
    set((state) => ({
      selectionContext: { ...state.selectionContext, ...context },
    }));
  },

  toggleContextPanel: () => {
    set((state) => ({
      showContextPanel: !state.showContextPanel,
      ...(!state.showContextPanel ? {} : { agentPanelHistoryOnly: false }),
    }));
  },

  openAgentHistoryPanel: () => {
    set({ showContextPanel: true, agentPanelHistoryOnly: true });
  },

  closeAgentPanel: () => {
    set({ showContextPanel: false, agentPanelHistoryOnly: false });
  },

  startImageEdit: (blockId, mode) => {
    set({
      activeTool: "select",
      imageEditState: { blockId, mode },
      inspectorDetail: { type: "image-edit", blockId, mode },
    });
  },

  updateImageEdit: (updates) => {
    set((state) => ({
      imageEditState: state.imageEditState
        ? { ...state.imageEditState, ...updates }
        : null,
    }));
  },

  cancelImageEdit: () => {
    set({
      imageEditState: null,
      inspectorDetail: null,
      activeTool: "select",
    });
  },

  applyImageEdit: async () => {
    const { imageEditState } = get();
    if (!imageEditState) return;

    set({ isProcessing: true });
    
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    set({
      isProcessing: false,
      imageEditState: null,
      inspectorDetail: null,
      activeTool: "select",
    });
  },

  startGroupEdit: (groupId, action) => {
    set({
      activeTool: "group-edit",
      pendingGroupEdit: { groupId, action },
      showContextPanel: true,
      agentPanelHistoryOnly: false,
      inspectorDetail: null,
    });
  },

  applyGroupEdit: async () => {
    const { pendingGroupEdit } = get();
    if (!pendingGroupEdit) return;

    set({ isProcessing: true });
    
    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    set({
      isProcessing: false,
      pendingGroupEdit: null,
      activeTool: "select",
    });
  },

  cancelGroupEdit: () => {
    set({
      pendingGroupEdit: null,
      activeTool: "select",
    });
  },

  setProcessing: (isProcessing) => {
    set({ isProcessing });
  },
}));
