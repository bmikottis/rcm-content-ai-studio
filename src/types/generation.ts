export type GenerationStepStatus = "pending" | "in_progress" | "completed" | "error";

export interface GenerationSubStep {
  id: string;
  label: string;
  status: GenerationStepStatus;
  detail?: string;
}

export interface GenerationStep {
  id: string;
  title: string;
  description: string;
  status: GenerationStepStatus;
  icon: "brain" | "palette" | "assets" | "channels" | "personalization" | "language" | "shield" | "link" | "sparkles";
  progress?: number;
  subSteps?: GenerationSubStep[];
  expandable?: boolean;
  thought?: string;
  duration?: number;
}

export interface GenerationLog {
  steps: GenerationStep[];
  startedAt: Date;
  completedAt?: Date;
  currentStepIndex: number;
}
