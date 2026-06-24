"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Theme, ThemeContext } from "@/hooks/use-theme";

const THEME_STORAGE_KEY = "forge-sprint-theme";

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>("light");
  const [isThemeResolved, setIsThemeResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      const preferredTheme = getPreferredTheme();

      setTheme(preferredTheme);
      setIsThemeResolved(true);
      applyTheme(preferredTheme);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isThemeResolved) {
      return;
    }

    applyTheme(theme);
  }, [isThemeResolved, theme]);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) =>
      currentTheme === "dark" ? "light" : "dark",
    );
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isThemeResolved,
      toggleTheme,
    }),
    [isThemeResolved, theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
