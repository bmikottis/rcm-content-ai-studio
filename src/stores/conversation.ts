"use client";

import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status?: "sending" | "complete" | "error";
  metadata?: {
    type?: "prompt" | "update" | "question";
    affectedChannels?: string[];
    changes?: string[];
  };
}

interface ConversationState {
  messages: ChatMessage[];
  isThinking: boolean;

  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => string;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setThinking: (isThinking: boolean) => void;
  clearMessages: () => void;

  sendPrompt: (prompt: string) => Promise<void>;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  messages: [
    {
      id: "welcome",
      role: "assistant",
      content: "I've generated your campaign content based on your brief. You can ask me to make changes, adjust tone, or update specific channels.",
      timestamp: new Date(Date.now() - 60000),
      status: "complete",
    },
  ],
  isThinking: false,

  addMessage: (message) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newMessage: ChatMessage = {
      ...message,
      id,
      timestamp: new Date(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
    return id;
  },

  updateMessage: (id, updates) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    }));
  },

  setThinking: (isThinking) => set({ isThinking }),

  clearMessages: () =>
    set({
      messages: [
        {
          id: "welcome",
          role: "assistant",
          content: "I've generated your campaign content based on your brief. You can ask me to make changes, adjust tone, or update specific channels.",
          timestamp: new Date(),
          status: "complete",
        },
      ],
    }),

  sendPrompt: async (prompt) => {
    const { addMessage, updateMessage, setThinking } = get();

    const userMsgId = addMessage({
      role: "user",
      content: prompt,
      status: "complete",
      metadata: { type: "prompt" },
    });

    setThinking(true);

    const assistantMsgId = addMessage({
      role: "assistant",
      content: "",
      status: "sending",
    });

    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1500));

    const responses = getContextualResponse(prompt);
    
    updateMessage(assistantMsgId, {
      content: responses.message,
      status: "complete",
      metadata: responses.metadata,
    });

    setThinking(false);
  },
}));

function getContextualResponse(prompt: string): { message: string; metadata?: ChatMessage["metadata"] } {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes("tone") || lowerPrompt.includes("formal") || lowerPrompt.includes("casual")) {
    return {
      message: "I've adjusted the tone across all channels. The email now uses a more conversational approach while maintaining professionalism. SMS and WhatsApp messages are slightly more casual to match channel expectations.",
      metadata: {
        type: "update",
        affectedChannels: ["Email", "SMS", "WhatsApp"],
        changes: ["Tone adjustment", "Copy refinement"],
      },
    };
  }

  if (lowerPrompt.includes("email") || lowerPrompt.includes("subject")) {
    return {
      message: "I've updated the email content. The new subject line is more action-oriented and the body copy now emphasizes the key benefits upfront. Preview the changes in the canvas.",
      metadata: {
        type: "update",
        affectedChannels: ["Email"],
        changes: ["Subject line", "Body copy"],
      },
    };
  }

  if (lowerPrompt.includes("sms") || lowerPrompt.includes("text")) {
    return {
      message: "SMS message updated. I've shortened the copy to fit within character limits while preserving the core message and CTA. The personalization token {{first_name}} is still included.",
      metadata: {
        type: "update",
        affectedChannels: ["SMS"],
        changes: ["Character optimization", "CTA refinement"],
      },
    };
  }

  if (lowerPrompt.includes("image") || lowerPrompt.includes("visual") || lowerPrompt.includes("photo")) {
    return {
      message: "I've noted your visual direction. Would you like me to: 1) Replace the hero image with a more dynamic option, 2) Adjust the image treatment across channels, or 3) Generate new visual recommendations based on your brand kit?",
      metadata: { type: "question" },
    };
  }

  if (lowerPrompt.includes("cta") || lowerPrompt.includes("button") || lowerPrompt.includes("call to action")) {
    return {
      message: "CTA updated across all channels. I've made the action more compelling and ensured consistency. Email: \"Discover Your Perfect Match\" → SMS: \"Shop Now\" → WhatsApp: \"Explore Collection\"",
      metadata: {
        type: "update",
        affectedChannels: ["Email", "SMS", "WhatsApp"],
        changes: ["CTA text", "Action verbs"],
      },
    };
  }

  if (lowerPrompt.includes("language") || lowerPrompt.includes("translate") || lowerPrompt.includes("spanish") || lowerPrompt.includes("french")) {
    return {
      message: "I can create language variants for this campaign. Currently supporting: English (US), Spanish (MX), and French (FR). Which languages would you like me to generate?",
      metadata: { type: "question" },
    };
  }

  if (lowerPrompt.includes("shorter") || lowerPrompt.includes("concise") || lowerPrompt.includes("brief")) {
    return {
      message: "I've condensed the copy across all channels. Email body reduced by 30%, SMS optimized for 160 characters, and WhatsApp message streamlined for mobile reading. Key messages and CTAs preserved.",
      metadata: {
        type: "update",
        affectedChannels: ["Email", "SMS", "WhatsApp"],
        changes: ["Copy length", "Message density"],
      },
    };
  }

  if (lowerPrompt.includes("premium") || lowerPrompt.includes("luxury") || lowerPrompt.includes("high-end")) {
    return {
      message: "I've elevated the messaging to reflect a more premium positioning. Updated vocabulary, refined the value proposition, and adjusted the visual direction recommendations. The brand compliance score has increased to 89%.",
      metadata: {
        type: "update",
        affectedChannels: ["Email", "SMS", "WhatsApp"],
        changes: ["Premium positioning", "Vocabulary", "Brand alignment"],
      },
    };
  }

  return {
    message: "I've noted your feedback and updated the campaign content accordingly. Check the canvas to see the changes reflected across your channels. Let me know if you'd like any further adjustments.",
    metadata: {
      type: "update",
      affectedChannels: ["Email", "SMS", "WhatsApp"],
      changes: ["Content update"],
    },
  };
}
