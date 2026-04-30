import { create } from "zustand";
import { 
  CampaignCreationState, 
  ThinkingStep, 
  CampaignPlan, 
  GeneratedCampaign,
  ChannelContent 
} from "@/types/campaign";
import { Channel, Project } from "@/types/project";
import { ComposerState } from "@/types/composer";
import { useProjectsStore } from "./projects";
import { useComposerStore } from "./composer";

interface CampaignCreationStore extends CampaignCreationState {
  startCreation: (prompt: string, composerState: ComposerState) => Promise<string>;
  updateThinkingStep: (id: string, updates: Partial<ThinkingStep>) => void;
  setPlan: (plan: CampaignPlan) => void;
  setGeneratedCampaign: (campaign: GeneratedCampaign) => void;
  setPhase: (phase: CampaignCreationState["currentPhase"]) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialThinkingSteps: ThinkingStep[] = [
  { id: "understand", label: "Understanding request", description: "Analyzing your campaign brief and context", status: "pending" },
  { id: "audience", label: "Identifying audience", description: "Matching target segments from your data", status: "pending" },
  { id: "strategy", label: "Building strategy", description: "Developing content approach and messaging", status: "pending" },
  { id: "channels", label: "Selecting channels", description: "Choosing optimal delivery channels", status: "pending" },
  { id: "assets", label: "Gathering assets", description: "Collecting brand assets and visuals", status: "pending" },
  { id: "content", label: "Generating content", description: "Creating channel-specific content", status: "pending" },
];

const initialState: CampaignCreationState = {
  isCreating: false,
  currentPhase: "idle",
  thinkingSteps: initialThinkingSteps,
  plan: null,
  generatedCampaign: null,
  error: null,
  progress: 0,
  pendingCampaignId: null,
  pendingPrompt: null,
  pendingName: null,
};

export const useCampaignCreationStore = create<CampaignCreationStore>((set, get) => ({
  ...initialState,

  startCreation: async (prompt: string, composerState: ComposerState) => {
    const { thinkingMode, selectedSkills, selectedPalette, designStyle, attachments } = composerState;
    
    const campaignId = `campaign-${Date.now()}`;
    const campaignName = generateCampaignName(prompt);

    set({ 
      isCreating: true, 
      currentPhase: thinkingMode ? "thinking" : "planning",
      thinkingSteps: initialThinkingSteps.map(s => ({ ...s, status: "pending" as const })),
      plan: null,
      generatedCampaign: null,
      error: null,
      progress: 0,
      pendingCampaignId: campaignId,
      pendingPrompt: prompt,
      pendingName: campaignName,
    });

    try {
      // Phase 1: Thinking/Planning
      if (thinkingMode) {
        await simulateThinkingPhase(set, get, prompt, composerState);
      }

      // Phase 2: Generate plan
      set({ currentPhase: "planning", progress: 30 });
      const plan = await generatePlan(prompt, composerState);
      set({ plan, progress: 50 });

      // Phase 3: Generate content
      set({ currentPhase: "generating", progress: 60 });
      const content = await generateContent(plan, composerState);
      set({ progress: 85 });

      // Phase 4: Create campaign object
      const campaign: GeneratedCampaign = {
        id: campaignId,
        name: campaignName,
        description: plan.objective,
        status: "draft",
        plan,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
        prompt,
        context: {
          brand: "Salesforce Palette",
          audience: plan.targetAudience,
          palette: selectedPalette || undefined,
          skills: selectedSkills,
          designStyle: designStyle || undefined,
          attachments,
        },
      };

      set({ generatedCampaign: campaign, progress: 95 });

      // Phase 5: Add to projects
      const project: Project = {
        id: campaignId,
        title: campaignName,
        description: plan.objective,
        status: "draft",
        channels: plan.channels,
        createdAt: new Date(),
        updatedAt: new Date(),
        languages: ["en"],
      };

      useProjectsStore.getState().addProject(project);

      // Complete
      set({ currentPhase: "complete", progress: 100 });

      // Reset composer
      useComposerStore.getState().reset();
      useProjectsStore.getState().setPrompt("");

      return campaignId;
    } catch (error) {
      set({ 
        currentPhase: "error", 
        error: error instanceof Error ? error.message : "Failed to create campaign",
        isCreating: false,
      });
      throw error;
    }
  },

  updateThinkingStep: (id, updates) => {
    set((state) => ({
      thinkingSteps: state.thinkingSteps.map((step) =>
        step.id === id ? { ...step, ...updates } : step
      ),
    }));
  },

  setPlan: (plan) => set({ plan }),
  setGeneratedCampaign: (campaign) => set({ generatedCampaign: campaign }),
  setPhase: (phase) => set({ currentPhase: phase }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));

// Helper functions

function generateCampaignName(prompt: string): string {
  const cleanedPrompt = prompt.trim();
  
  if (cleanedPrompt.length < 5) {
    return `Campaign ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }
  
  const words = cleanedPrompt.split(/\s+/).slice(0, 5);
  const base = words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  
  return base.length > 35 ? base.slice(0, 32) + "..." : base;
}

async function simulateThinkingPhase(
  set: (state: Partial<CampaignCreationState>) => void,
  get: () => CampaignCreationStore,
  prompt?: string,
  composerState?: ComposerState
): Promise<void> {
  const steps = get().thinkingSteps;
  
  const dynamicResults = generateDynamicResults(prompt || "", composerState);
  
  for (let i = 0; i < steps.length; i++) {
    set({
      thinkingSteps: steps.map((s, idx) => ({
        ...s,
        status: idx < i ? "completed" : idx === i ? "active" : "pending",
      })),
      progress: Math.round((i / steps.length) * 30),
    });

    await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800));

    set({
      thinkingSteps: steps.map((s, idx) => ({
        ...s,
        status: idx <= i ? "completed" : "pending",
        result: idx === i ? dynamicResults[i] : s.result,
      })),
    });
  }
}

function generateDynamicResults(prompt: string, composerState?: ComposerState): string[] {
  const promptLower = prompt.toLowerCase();
  
  let campaignType = "brand awareness campaign";
  if (promptLower.includes("launch")) campaignType = "product launch campaign";
  else if (promptLower.includes("holiday")) campaignType = "seasonal holiday campaign";
  else if (promptLower.includes("win-back")) campaignType = "customer win-back campaign";
  else if (promptLower.includes("email")) campaignType = "email marketing campaign";
  
  const hasSkills = composerState?.selectedSkills && composerState.selectedSkills.length > 0;
  const hasPalette = composerState?.selectedPalette;
  const hasAttachments = composerState?.attachments && composerState.attachments.length > 0;
  
  return [
    `Identified ${campaignType} with premium positioning`,
    "Matched target: Urban professionals, 25-45, premium lifestyle",
    `Building ${hasSkills ? "skill-enhanced" : "AI-optimized"} content strategy`,
    "Selected channels: Email (primary), SMS (urgency), Social (engagement)",
    `${hasPalette ? "Applied brand palette, " : ""}${hasAttachments ? `Processing ${composerState?.attachments.length} attachment(s), ` : ""}6 brand assets ready`,
    "Generated 3 channel variants with personalization options",
  ];
}

async function generatePlan(prompt: string, composerState: ComposerState): Promise<CampaignPlan> {
  await new Promise((resolve) => setTimeout(resolve, 1800));

  // Analyze prompt to determine channels
  const promptLower = prompt.toLowerCase();
  const channels: Channel[] = [];
  
  if (promptLower.includes("email") || !promptLower.includes("sms")) {
    channels.push("email");
  }
  if (promptLower.includes("sms") || promptLower.includes("text")) {
    channels.push("sms");
  }
  if (promptLower.includes("whatsapp") || promptLower.includes("chat")) {
    channels.push("whatsapp");
  }
  if (promptLower.includes("social") || promptLower.includes("instagram") || promptLower.includes("facebook")) {
    channels.push("social");
  }
  
  // Default to email + sms if none specified
  if (channels.length === 0) {
    channels.push("email", "sms");
  }

  // Generate plan based on context
  const hasMultiLanguage = composerState.selectedSkills.some(s => s.id === "localization");
  const hasPersonalization = composerState.selectedSkills.some(s => s.id === "personalization");

  return {
    objective: extractObjective(prompt),
    targetAudience: "Urban professionals aged 25-45 with interest in premium lifestyle products",
    keyMessage: extractKeyMessage(prompt),
    tone: composerState.designStyle?.name || "Professional yet approachable",
    channels,
    contentStrategy: `Multi-channel campaign with ${hasPersonalization ? "personalized" : "targeted"} messaging${hasMultiLanguage ? " across multiple languages" : ""}`,
    assumptions: [
      "Target audience prefers digital communication",
      "Campaign runs for 2 weeks",
      "Budget allows for premium creative assets",
    ],
  };
}

function extractObjective(prompt: string): string {
  if (prompt.toLowerCase().includes("launch")) {
    return "Drive awareness and initial conversions for product launch";
  }
  if (prompt.toLowerCase().includes("holiday") || prompt.toLowerCase().includes("seasonal")) {
    return "Maximize seasonal engagement and sales during holiday period";
  }
  if (prompt.toLowerCase().includes("win-back") || prompt.toLowerCase().includes("re-engage")) {
    return "Re-engage dormant customers and drive repeat purchases";
  }
  return "Build brand awareness and drive qualified leads";
}

function extractKeyMessage(prompt: string): string {
  if (prompt.toLowerCase().includes("launch")) {
    return "Introducing something new that transforms your everyday";
  }
  if (prompt.toLowerCase().includes("holiday")) {
    return "Celebrate the season with exclusive offers";
  }
  if (prompt.toLowerCase().includes("win-back")) {
    return "We've missed you - here's something special";
  }
  return "Discover what makes us different";
}

async function generateContent(plan: CampaignPlan, composerState: ComposerState): Promise<ChannelContent[]> {
  await new Promise((resolve) => setTimeout(resolve, 2500));

  const content: ChannelContent[] = [];

  for (const channel of plan.channels) {
    content.push(generateChannelContent(channel, plan, composerState));
  }

  return content;
}

function generateChannelContent(
  channel: Channel, 
  plan: CampaignPlan, 
  composerState: ComposerState
): ChannelContent {
  const hasPersonalization = composerState.selectedSkills.some(s => s.id === "personalization");
  
  const templates: Record<Channel, Omit<ChannelContent, "channel">> = {
    email: {
      headline: `${plan.keyMessage}`,
      body: `Hi {{first_name}},\n\nWe're excited to share something special with you. ${plan.objective.toLowerCase()}.\n\nAs a valued member of our community, you're among the first to experience this.\n\nBest,\nThe Team`,
      cta: "Explore Now →",
      visualDirection: "Hero image with product focus, brand colors, clean typography",
      personalization: hasPersonalization ? ["{{first_name}}", "{{last_purchase}}", "{{loyalty_tier}}"] : undefined,
      assets: ["hero-banner.jpg", "product-showcase.jpg"],
    },
    sms: {
      headline: "Quick update",
      body: `{{first_name}}, ${plan.keyMessage.toLowerCase()}. Limited time only. Tap to explore: [link]`,
      cta: "Shop Now",
      visualDirection: "No visuals (SMS), emoji accent optional",
      personalization: hasPersonalization ? ["{{first_name}}"] : undefined,
    },
    whatsapp: {
      headline: plan.keyMessage,
      body: `Hey {{first_name}}! 👋\n\n${plan.objective}.\n\nWant to know more? Just reply YES and I'll share all the details!`,
      cta: "Reply YES",
      visualDirection: "Conversational tone, single product image, quick reply buttons",
      personalization: hasPersonalization ? ["{{first_name}}", "{{preferred_category}}"] : undefined,
      assets: ["product-square.jpg"],
    },
    social: {
      headline: plan.keyMessage,
      body: `✨ ${plan.objective}\n\nDouble tap if you're ready to discover something new.\n\n#NewArrivals #Lifestyle #Premium`,
      cta: "Link in Bio",
      visualDirection: "Square format, lifestyle imagery, bold typography overlay",
      assets: ["social-hero.jpg", "carousel-1.jpg", "carousel-2.jpg"],
    },
  };

  return {
    channel,
    ...templates[channel],
  };
}
