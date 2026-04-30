"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme";

export function ThemeInitializer() {
  const { theme, resolvedTheme, hydrate } = useThemeStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = mq.matches ? "dark" : "light";
      document.documentElement.dataset.theme = resolved;
      useThemeStore.setState({ resolvedTheme: resolved });
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return null;
}
