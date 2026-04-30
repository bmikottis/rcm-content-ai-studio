import { create } from "zustand";
import { ContentBlock, AgentMessage } from "@/types/canvas";
import { mockGeneratedContent, mockAgentMessages } from "@/data/mock-content";

interface CanvasStore {
  projectId: string;
  title: string;
  blocks: ContentBlock[];
  isGenerating: boolean;
  generationProgress: number;
  rightPanelOpen: boolean;
  agentMessages: AgentMessage[];
  editingBlockId: string | null;
  selectedBlockId: string | null;

  setProjectId: (id: string) => void;
  setTitle: (title: string) => void;
  addBlock: (block: ContentBlock) => void;
  updateBlock: (id: string, updates: Partial<ContentBlock>) => void;
  removeBlock: (id: string) => void;
  reorderBlocks: (fromIndex: number, toIndex: number) => void;
  regenerateBlock: (id: string) => void;
  toggleRightPanel: () => void;
  sendAgentMessage: (message: string) => void;
  setEditing: (blockId: string | null) => void;
  setSelectedBlock: (blockId: string | null) => void;
  loadMockContent: () => void;
  setGenerating: (generating: boolean) => void;
  setGenerationProgress: (progress: number) => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  projectId: "",
  title: "New Project",
  blocks: [],
  isGenerating: false,
  generationProgress: 0,
  rightPanelOpen: true,
  agentMessages: [],
  editingBlockId: null,
  selectedBlockId: null,

  setProjectId: (id) => set({ projectId: id }),
  
  setTitle: (title) => set({ title }),
  
  addBlock: (block) =>
    set((state) => ({ blocks: [...state.blocks, block] })),
  
  updateBlock: (id, updates) =>
    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    })),
  
  removeBlock: (id) =>
    set((state) => ({
      blocks: state.blocks.filter((b) => b.id !== id),
    })),
  
  reorderBlocks: (fromIndex, toIndex) =>
    set((state) => {
      const newBlocks = [...state.blocks];
      const [removed] = newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, removed);
      return { blocks: newBlocks };
    }),
  
  regenerateBlock: (id) => {
    const { updateBlock } = get();
    updateBlock(id, { generatedAt: new Date() });
  },
  
  toggleRightPanel: () =>
    set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  
  sendAgentMessage: (message) => {
    const newMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      type: "user",
      content: message,
      timestamp: new Date(),
    };
    
    set((state) => ({
      agentMessages: [...state.agentMessages, newMessage],
    }));
    
    // Simulate agent response
    setTimeout(() => {
      const response: AgentMessage = {
        id: `msg-${Date.now()}-response`,
        type: "agent",
        content: "I'll work on that change for you. Give me a moment...",
        timestamp: new Date(),
      };
      set((state) => ({
        agentMessages: [...state.agentMessages, response],
      }));
    }, 1000);
  },
  
  setEditing: (blockId) => set({ editingBlockId: blockId }),
  
  setSelectedBlock: (blockId) => set({ selectedBlockId: blockId }),
  
  loadMockContent: () =>
    set({
      blocks: mockGeneratedContent,
      agentMessages: mockAgentMessages,
    }),
  
  setGenerating: (generating) => set({ isGenerating: generating }),
  
  setGenerationProgress: (progress) => set({ generationProgress: progress }),
}));
