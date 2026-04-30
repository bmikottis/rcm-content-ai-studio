import { create } from "zustand";

export type ThemeOption = "light" | "dark" | "system";

const STORAGE_KEY = "palette-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: ThemeOption): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = resolved;
}

function readStored(): ThemeOption {
  if (typeof window === "undefined") return "light";
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "light";
}

interface ThemeState {
  theme: ThemeOption;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeOption) => void;
  hydrate: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "light",
  resolvedTheme: "light",
  setTheme: (theme) => {
    const r = resolveTheme(theme);
    applyTheme(r);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, theme);
    }
    set({ theme, resolvedTheme: r });
  },
  hydrate: () => {
    const stored = readStored();
    const resolved = resolveTheme(stored);
    applyTheme(resolved);
    set({ theme: stored, resolvedTheme: resolved });
  },
}));

if (typeof window !== "undefined") {
  const stored = readStored();
  const resolved = resolveTheme(stored);
  applyTheme(resolved);
  useThemeStore.setState({ theme: stored, resolvedTheme: resolved });

  if (stored === "system") {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", () => {
      const s = useThemeStore.getState();
      if (s.theme === "system") {
        const r = getSystemTheme();
        applyTheme(r);
        useThemeStore.setState({ resolvedTheme: r });
      }
    });
  }
}
