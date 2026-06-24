"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

const themeButtonClassName =
  "inline-flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-slate-600 transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent/40 dark:text-slate-200";

function ThemeTogglePlaceholder() {
  return (
    <button
      type="button"
      className={themeButtonClassName}
      aria-label="Toggle theme"
    />
  );
}

function MountedThemeToggle() {
  const { theme, isThemeResolved, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (!isThemeResolved) {
    return <ThemeTogglePlaceholder />;
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      className={themeButtonClassName}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        setMounted(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!mounted) {
    return <ThemeTogglePlaceholder />;
  }

  return <MountedThemeToggle />;
}
