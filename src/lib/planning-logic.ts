import { PlanningStep, PlanningContext, Channel, CampaignGoal } from "@/types/planning";
import { SalesforceContext } from "@/types/context";

export function analyzePrompt(prompt: string): {
  detectedAudience: string | null;
  detectedProduct: string | null;
  detectedGoal: string | null;
} {
  const lowercasePrompt = prompt.toLowerCase();
  
  let detectedAudience = null;
  if (lowercasePrompt.includes("urban") || lowercasePrompt.includes("professional")) {
    detectedAudience = "Urban professionals";
  } else if (lowercasePrompt.includes("family") || lowercasePrompt.includes("families")) {
    detectedAudience = "Families";
  } else if (lowercasePrompt.includes("eco") || lowercasePrompt.includes("sustainable")) {
    detectedAudience = "Eco-conscious consumers";
  }

  let detectedProduct = null;
  if (lowercasePrompt.includes("suv") || lowercasePrompt.includes("electric")) {
    detectedProduct = "Electric SUV";
  } else if (lowercasePrompt.includes("candle")) {
    detectedProduct = "Signature Candle";
  } else if (lowercasePrompt.includes("collection") || lowercasePrompt.includes("launch")) {
    detectedProduct = "New Collection";
  }

  let detectedGoal = null;
  if (lowercasePrompt.includes("launch") || lowercasePrompt.includes("announce")) {
    detectedGoal = "awareness";
  } else if (lowercasePrompt.includes("engage") || lowercasePrompt.includes("connect")) {
    detectedGoal = "engagement";
  } else if (lowercasePrompt.includes("sell") || lowercasePrompt.includes("convert")) {
    detectedGoal = "conversion";
  }

  return { detectedAudience, detectedProduct, detectedGoal };
}

export function generateSteps(
  prompt: string,
  context: SalesforceContext | null,
  analysis: ReturnType<typeof analyzePrompt>
): PlanningStep[] {
  const steps: PlanningStep[] = [];

  // Acknowledgment step
  const acknowledgments: string[] = [];
  
  if (analysis.detectedAudience) {
    acknowledgments.push(`I see you're targeting ${analysis.detectedAudience.toLowerCase()}.`);
  }
  
  if (context?.brand) {
    acknowledgments.push(`Using ${context.brand.name}'s ${context.brand.tone.toLowerCase()} tone.`);
  }

  if (acknowledgments.length > 0) {
    steps.push({
      id: "ack-1",
      type: "acknowledgment",
      content: acknowledgments.join(" "),
      isComplete: true,
    });
  }

  // Key message question (always ask)
  steps.push({
    id: "q-key-message",
    type: "question",
    content: "What's the key message you want to convey?",
    inputType: "text",
    isComplete: false,
  });

  // Channels question (always ask)
  steps.push({
    id: "q-channels",
    type: "question",
    content: "Which channels should we target?",
    inputType: "multi-select",
    options: [
      { id: "email", label: "Email" },
      { id: "sms", label: "SMS" },
      { id: "whatsapp", label: "WhatsApp" },
      { id: "social", label: "Social" },
    ],
    isComplete: false,
  });

  // Campaign goal question (if not detected)
  if (!analysis.detectedGoal) {
    steps.push({
      id: "q-goal",
      type: "question",
      content: "What's the primary goal?",
      inputType: "single-select",
      options: [
        { id: "awareness", label: "Awareness" },
        { id: "engagement", label: "Engagement" },
        { id: "conversion", label: "Conversion" },
        { id: "retention", label: "Retention" },
      ],
      isComplete: false,
    });
  }

  // Summary step (added after all questions are answered)
  steps.push({
    id: "summary",
    type: "summary",
    content: "",
    isComplete: false,
  });

  return steps;
}

export function buildSummary(
  prompt: string,
  context: SalesforceContext | null,
  answers: Record<string, string | string[]>
): {
  title: string;
  audience: string;
  channels: Channel[];
  keyMessage: string;
  tone: string;
  goal: CampaignGoal;
} {
  const analysis = analyzePrompt(prompt);
  
  return {
    title: extractTitle(prompt),
    audience: analysis.detectedAudience || context?.audiences?.[0]?.name || "General audience",
    channels: (answers["q-channels"] as Channel[]) || ["email"],
    keyMessage: (answers["q-key-message"] as string) || "",
    tone: context?.brand?.tone || "Professional",
    goal: (answers["q-goal"] as CampaignGoal) || (analysis.detectedGoal as CampaignGoal) || "awareness",
  };
}

function extractTitle(prompt: string): string {
  const words = prompt.split(" ").slice(0, 6);
  let title = words.join(" ");
  if (prompt.split(" ").length > 6) {
    title += "...";
  }
  return title.charAt(0).toUpperCase() + title.slice(1);
}
