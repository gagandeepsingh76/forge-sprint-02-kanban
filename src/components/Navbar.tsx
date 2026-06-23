"use client";

import { Moon, Plus, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

interface NavbarProps {
  boardTitle: string;
  taskCount: number;
  onAddTask: () => void;
}

export function Navbar({ boardTitle, taskCount, onAddTask }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 px-4 py-4 shadow-sm backdrop-blur md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-accent">Forge Sprint 02</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {boardTitle}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-border bg-surface-muted px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            {taskCount} tasks
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-slate-600 transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent/40 dark:text-slate-200"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            onClick={onAddTask}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-background"
          >
            <Plus size={18} />
            Add Task
          </button>
        </div>
      </div>
    </header>
  );
}
