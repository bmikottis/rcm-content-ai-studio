import { create } from "zustand";
import { ChannelType, ContentBlock } from "@/types/canvas";
import { mockTestContacts } from "@/data/mock-contacts";

export type ViewMode = "canvas" | "preview" | "code";

function seedSavedEmails(): string[] {
  return [...new Set(mockTestContacts.map((c) => c.email.trim()).filter(Boolean))];
}

function seedSavedPhones(): string[] {
  return [...new Set(mockTestContacts.map((c) => c.phone?.trim()).filter(Boolean) as string[])];
}

interface PreviewPanelState {
  viewMode: ViewMode;
  isOpen: boolean;
  selectedChannel: ChannelType;
  selectedDevice: "desktop" | "mobile";
  selectedContactId: string;
  selectedLanguage: string;
  previewContent: ContentBlock | null;
  testEmail: string;
  testPhone: string;
  isSending: boolean;
  sendSuccess: boolean;
  isSendingPhone: boolean;
  sendPhoneSuccess: boolean;
  savedTestEmails: string[];
  savedTestPhones: string[];

  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  openPanel: (content?: ContentBlock) => void;
  closePanel: () => void;
  setChannel: (channel: ChannelType) => void;
  setDevice: (device: "desktop" | "mobile") => void;
  setContact: (contactId: string) => void;
  setLanguage: (language: string) => void;
  setTestEmail: (email: string) => void;
  setTestPhone: (phone: string) => void;
  sendTest: () => Promise<void>;
  sendPhoneTest: () => Promise<void>;
  addSavedTestEmail: (email: string) => void;
  addSavedTestPhone: (phone: string) => void;
  reset: () => void;
}

export const usePreviewStore = create<PreviewPanelState>((set, get) => ({
  viewMode: "canvas",
  isOpen: false,
  selectedChannel: "email",
  selectedDevice: "desktop",
  selectedContactId: mockTestContacts[0].id,
  selectedLanguage: "en-US",
  previewContent: null,
  testEmail: mockTestContacts[0]?.email ?? "",
  testPhone: mockTestContacts[0]?.phone ?? "",
  isSending: false,
  sendSuccess: false,
  isSendingPhone: false,
  sendPhoneSuccess: false,
  savedTestEmails: seedSavedEmails(),
  savedTestPhones: seedSavedPhones(),

  setViewMode: (mode) => set({ viewMode: mode }),

  toggleViewMode: () => set((state) => ({ 
    viewMode: state.viewMode === "canvas" ? "preview" : "canvas" 
  })),

  openPanel: (content) =>
    set({
      isOpen: true,
      previewContent: content || null,
      sendSuccess: false,
      sendPhoneSuccess: false,
    }),

  closePanel: () =>
    set({
      isOpen: false,
      sendSuccess: false,
      sendPhoneSuccess: false,
    }),

  setChannel: (channel) => set({ selectedChannel: channel }),

  setDevice: (device) => set({ selectedDevice: device }),

  setContact: (contactId) => set({ selectedContactId: contactId }),

  setLanguage: (language) => set({ selectedLanguage: language }),

  setTestEmail: (email) => set({ testEmail: email }),

  setTestPhone: (phone) => set({ testPhone: phone }),

  sendTest: async () => {
    set({ isSending: true, sendSuccess: false });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    set({ isSending: false, sendSuccess: true });
  },

  sendPhoneTest: async () => {
    set({ isSendingPhone: true, sendPhoneSuccess: false });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    set({ isSendingPhone: false, sendPhoneSuccess: true });
  },

  addSavedTestEmail: (email) => {
    const e = email.trim();
    if (!e) return;
    set((s) => ({
      savedTestEmails: [e, ...s.savedTestEmails.filter((x) => x.toLowerCase() !== e.toLowerCase())],
      testEmail: e,
    }));
  },

  addSavedTestPhone: (phone) => {
    const p = phone.trim();
    if (!p) return;
    set((s) => ({
      savedTestPhones: [p, ...s.savedTestPhones.filter((x) => x !== p)],
      testPhone: p,
    }));
  },

  reset: () =>
    set({
      viewMode: "canvas",
      isOpen: false,
      selectedChannel: "email",
      selectedDevice: "desktop",
      selectedContactId: mockTestContacts[0].id,
      selectedLanguage: "en-US",
      previewContent: null,
      testEmail: mockTestContacts[0]?.email ?? "",
      testPhone: mockTestContacts[0]?.phone ?? "",
      isSending: false,
      sendSuccess: false,
      isSendingPhone: false,
      sendPhoneSuccess: false,
      savedTestEmails: seedSavedEmails(),
      savedTestPhones: seedSavedPhones(),
    }),
}));
