import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  isAuthenticated: boolean;
  isLoginModalOpen: boolean;
  pendingPrompt: string | null;
  
  openLoginModal: (pendingPrompt?: string) => void;
  closeLoginModal: () => void;
  login: () => Promise<void>;
  logout: () => void;
  clearPendingPrompt: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoginModalOpen: false,
      pendingPrompt: null,
      
      openLoginModal: (pendingPrompt) => 
        set({ 
          isLoginModalOpen: true, 
          pendingPrompt: pendingPrompt || get().pendingPrompt 
        }),
      
      closeLoginModal: () => set({ isLoginModalOpen: false }),
      
      login: async () => {
        // Simulate login delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        set({ isAuthenticated: true, isLoginModalOpen: false });
      },
      
      logout: () => set({ isAuthenticated: false, pendingPrompt: null }),
      
      clearPendingPrompt: () => set({ pendingPrompt: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    }
  )
);
