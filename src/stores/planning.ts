import { create } from "zustand";
import { PlanningStep, CampaignSummary } from "@/types/planning";

interface PlanningState {
  originalPrompt: string;
  steps: PlanningStep[];
  currentStepIndex: number;
  answers: Record<string, string | string[]>;
  summary: CampaignSummary | null;
  isGenerating: boolean;
  isThinking: boolean;

  setPrompt: (prompt: string) => void;
  setSteps: (steps: PlanningStep[]) => void;
  submitAnswer: (stepId: string, answer: string | string[]) => void;
  nextStep: () => void;
  previousStep: () => void;
  setSummary: (summary: CampaignSummary) => void;
  setGenerating: (generating: boolean) => void;
  setThinking: (thinking: boolean) => void;
  reset: () => void;
}

export const usePlanningStore = create<PlanningState>((set, get) => ({
  originalPrompt: "",
  steps: [],
  currentStepIndex: 0,
  answers: {},
  summary: null,
  isGenerating: false,
  isThinking: false,

  setPrompt: (prompt) => set({ originalPrompt: prompt }),
  
  setSteps: (steps) => set({ steps }),
  
  submitAnswer: (stepId, answer) => {
    set((state) => ({
      answers: { ...state.answers, [stepId]: answer },
      steps: state.steps.map((step) =>
        step.id === stepId ? { ...step, answer, isComplete: true } : step
      ),
    }));
  },
  
  nextStep: () => {
    const { currentStepIndex, steps } = get();
    if (currentStepIndex < steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    }
  },
  
  previousStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },
  
  setSummary: (summary) => set({ summary }),
  
  setGenerating: (generating) => set({ isGenerating: generating }),
  
  setThinking: (thinking) => set({ isThinking: thinking }),
  
  reset: () =>
    set({
      originalPrompt: "",
      steps: [],
      currentStepIndex: 0,
      answers: {},
      summary: null,
      isGenerating: false,
      isThinking: false,
    }),
}));
