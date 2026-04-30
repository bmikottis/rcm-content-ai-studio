import { create } from "zustand";
import { useSimpleCanvasStore, simulateCardGeneration } from "./simple-canvas";

export interface GenerationStep {
  id: string;
  label: string;
  status: "pending" | "active" | "completed";
  detail?: string;
}

interface ProgressiveGenerationState {
  isGenerating: boolean;
  steps: GenerationStep[];
  campaignName: string | null;
  prompt: string | null;
  showConsole: boolean;
}

interface ProgressiveGenerationStore extends ProgressiveGenerationState {
  startGeneration: (prompt: string, campaignName: string) => void;
  completeStep: (stepId: string, detail?: string) => void;
  setShowConsole: (show: boolean) => void;
  finishGeneration: () => void;
  reset: () => void;
}

const createGenerationSteps = (): GenerationStep[] => [
  { id: "understand", label: "Understanding your request...", status: "pending" },
  { id: "plan", label: "Planning campaign structure...", status: "pending" },
  { id: "email-start", label: "Generating email content...", status: "pending" },
  { id: "email-done", label: "Email content ready", status: "pending" },
  { id: "sms-start", label: "Creating SMS copy...", status: "pending" },
  { id: "sms-done", label: "SMS content ready", status: "pending" },
  { id: "complete", label: "Campaign ready for review", status: "pending" },
];

const initialState: ProgressiveGenerationState = {
  isGenerating: false,
  steps: createGenerationSteps(),
  campaignName: null,
  prompt: null,
  showConsole: false,
};

export const useProgressiveGenerationStore = create<ProgressiveGenerationStore>((set, get) => ({
  ...initialState,

  startGeneration: (prompt, campaignName) => {
    const steps = createGenerationSteps();
    steps[0].status = "active";
    
    set({
      isGenerating: true,
      steps,
      campaignName,
      prompt,
      showConsole: true,
    });

    // Start the simple canvas generation
    simulateCardGeneration(prompt, (stepId, detail) => {
      get().completeStep(stepId, detail);
      
      // Check if complete
      if (stepId === "complete") {
        get().finishGeneration();
      }
    });
  },

  completeStep: (stepId, detail) => {
    set((state) => {
      const steps = [...state.steps];
      const stepIndex = steps.findIndex((s) => s.id === stepId);
      
      if (stepIndex === -1) return state;
      
      steps[stepIndex] = {
        ...steps[stepIndex],
        status: "completed",
        detail,
      };
      
      // Activate next step
      if (stepIndex < steps.length - 1) {
        steps[stepIndex + 1] = {
          ...steps[stepIndex + 1],
          status: "active",
        };
      }
      
      return { steps };
    });
  },

  setShowConsole: (show) => {
    set({ showConsole: show });
  },

  finishGeneration: () => {
    set((state) => ({
      isGenerating: false,
      steps: state.steps.map((s) => ({ ...s, status: "completed" as const })),
    }));
    
    // Auto-hide console after completion
    setTimeout(() => {
      set({ showConsole: false });
    }, 2000);
  },

  reset: () => {
    set(initialState);
  },
}));
