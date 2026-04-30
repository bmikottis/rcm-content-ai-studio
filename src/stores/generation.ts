import { create } from "zustand";
import { GenerationStep, GenerationStepStatus } from "@/types/generation";

interface GenerationState {
  steps: GenerationStep[];
  isGenerating: boolean;
  currentStepIndex: number;
  expandedSteps: Set<string>;
  
  startGeneration: () => void;
  completeStep: (stepId: string) => void;
  setStepStatus: (stepId: string, status: GenerationStepStatus) => void;
  setStepProgress: (stepId: string, progress: number) => void;
  toggleExpanded: (stepId: string) => void;
  reset: () => void;
}

const initialSteps: GenerationStep[] = [
  {
    id: "understand",
    title: "Understanding brief",
    description: "Analyzing campaign objective and requirements",
    status: "pending",
    icon: "brain",
    expandable: true,
    thought: "Parsing prompt for key themes: product launch, target audience, tone preferences, and channel requirements.",
  },
  {
    id: "brand",
    title: "Identifying brand tone",
    description: "Matching content style to brand guidelines",
    status: "pending",
    icon: "palette",
    expandable: true,
    thought: "Applying Salesforce Palette brand voice: modern, refined, premium. Using approved color palette and typography standards.",
  },
  {
    id: "assets",
    title: "Gathering assets",
    description: "Selecting approved imagery and content",
    status: "pending",
    icon: "assets",
    expandable: true,
    subSteps: [
      { id: "assets-hero", label: "Hero images", status: "pending" },
      { id: "assets-product", label: "Product shots", status: "pending" },
      { id: "assets-logo", label: "Brand assets", status: "pending" },
    ],
  },
  {
    id: "channels",
    title: "Composing channel variants",
    description: "Generating Email, SMS, and WhatsApp content",
    status: "pending",
    icon: "channels",
    expandable: true,
    subSteps: [
      { id: "channel-email", label: "Email campaign", status: "pending", detail: "Subject + body + CTA" },
      { id: "channel-sms", label: "SMS message", status: "pending", detail: "160 chars optimized" },
      { id: "channel-whatsapp", label: "WhatsApp template", status: "pending", detail: "Rich media + buttons" },
    ],
  },
  {
    id: "personalization",
    title: "Applying personalization",
    description: "Inserting dynamic tokens and audience rules",
    status: "pending",
    icon: "personalization",
    expandable: true,
    thought: "Adding {{first_name}}, {{company}}, and segment-specific variations for Urban Professionals and Eco-conscious Families.",
  },
  {
    id: "language",
    title: "Creating language variants",
    description: "Translating and localizing content",
    status: "pending",
    icon: "language",
    subSteps: [
      { id: "lang-en", label: "English (US)", status: "pending" },
      { id: "lang-es", label: "Spanish", status: "pending" },
      { id: "lang-fr", label: "French", status: "pending" },
    ],
  },
  {
    id: "compliance",
    title: "Checking compliance",
    description: "Validating brand alignment and legal requirements",
    status: "pending",
    icon: "shield",
    expandable: true,
    thought: "Verifying CAN-SPAM compliance, unsubscribe links, brand color usage, and approved messaging guidelines.",
  },
  {
    id: "linking",
    title: "Linking variants",
    description: "Connecting assets across all channel variants",
    status: "pending",
    icon: "link",
  },
];

export const useGenerationStore = create<GenerationState>((set, get) => ({
  steps: initialSteps,
  isGenerating: false,
  currentStepIndex: -1,
  expandedSteps: new Set<string>(),

  startGeneration: () => {
    set({ 
      isGenerating: true, 
      currentStepIndex: 0,
      steps: initialSteps.map((s, i) => ({
        ...s,
        status: i === 0 ? "in_progress" : "pending",
        subSteps: s.subSteps?.map(sub => ({ ...sub, status: "pending" })),
      })),
      expandedSteps: new Set(["understand"]),
    });
  },

  completeStep: (stepId: string) => {
    const { steps, currentStepIndex } = get();
    const stepIndex = steps.findIndex(s => s.id === stepId);
    
    if (stepIndex === -1) return;

    const newSteps = steps.map((step, i) => {
      if (step.id === stepId) {
        return {
          ...step,
          status: "completed" as GenerationStepStatus,
          progress: 100,
          subSteps: step.subSteps?.map(sub => ({ ...sub, status: "completed" as GenerationStepStatus })),
        };
      }
      if (i === stepIndex + 1) {
        return { ...step, status: "in_progress" as GenerationStepStatus };
      }
      return step;
    });

    const newExpandedSteps = new Set(get().expandedSteps);
    if (stepIndex + 1 < steps.length) {
      newExpandedSteps.add(steps[stepIndex + 1].id);
    }

    set({ 
      steps: newSteps, 
      currentStepIndex: stepIndex + 1,
      expandedSteps: newExpandedSteps,
      isGenerating: stepIndex + 1 < steps.length,
    });
  },

  setStepStatus: (stepId: string, status: GenerationStepStatus) => {
    set({
      steps: get().steps.map(step =>
        step.id === stepId ? { ...step, status } : step
      ),
    });
  },

  setStepProgress: (stepId: string, progress: number) => {
    set({
      steps: get().steps.map(step =>
        step.id === stepId ? { ...step, progress } : step
      ),
    });
  },

  toggleExpanded: (stepId: string) => {
    const newExpanded = new Set(get().expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    set({ expandedSteps: newExpanded });
  },

  reset: () => {
    set({
      steps: initialSteps,
      isGenerating: false,
      currentStepIndex: -1,
      expandedSteps: new Set(),
    });
  },
}));
