import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SalesforceContext } from "@/types/context";
import { mockContext } from "@/data/mock-context";

interface ContextStore {
  context: SalesforceContext | null;
  isLoaded: boolean;
  
  // Computed getters
  brandLoaded: () => boolean;
  assetsLoaded: () => boolean;
  audienceLoaded: () => boolean;
  
  // Actions
  loadContext: () => void;
  clearContext: () => void;
}

export const useContextStore = create<ContextStore>()(
  persist(
    (set, get) => ({
      context: null,
      isLoaded: false,
      
      brandLoaded: () => get().context?.brand !== undefined,
      assetsLoaded: () => get().context?.assets !== undefined,
      audienceLoaded: () => (get().context?.audiences?.length ?? 0) > 0,
      
      loadContext: () => {
        set({
          context: {
            ...mockContext,
            loadedAt: new Date(),
          },
          isLoaded: true,
        });
      },
      
      clearContext: () => {
        set({
          context: null,
          isLoaded: false,
        });
      },
    }),
    {
      name: "salesforce-context",
      version: 3,
      migrate: () => ({ context: null, isLoaded: false } as unknown as ContextStore),
    }
  )
);
