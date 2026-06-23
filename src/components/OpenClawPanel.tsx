"use client";

import { FormEvent, useState } from "react";
import { Bot, Loader2, Plus, Sparkles } from "lucide-react";
import type { TaskFormValues } from "@/types/kanban";
import {
  openClawAssistantRequestSchema,
  openClawAssistantResponseSchema,
  type OpenClawAssistantResponse,
  type OpenClawMode,
} from "@/lib/validations/openclaw";

const modes: Array<{ value: OpenClawMode; label: string }> = [
  { value: "create-tasks", label: "Create tasks" },
  { value: "sprint-plan", label: "Sprint plan" },
  { value: "backlog", label: "Backlog" },
  { value: "user-stories", label: "User stories" },
];

interface OpenClawPanelProps {
  boardTitle: string;
  onCreateTask: (values: TaskFormValues) => void;
}

export function OpenClawPanel({
  boardTitle,
  onCreateTask,
}: OpenClawPanelProps) {
  const [mode, setMode] = useState<OpenClawMode>("create-tasks");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<OpenClawAssistantResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const generatedTasks = result
    ? [...result.tasks, ...result.backlog]
    : [];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setIsPending(true);
    const requestPayload = {
      mode,
      prompt,
      boardTitle,
    };
    const parsedRequest =
      openClawAssistantRequestSchema.safeParse(requestPayload);

    if (!parsedRequest.success) {
      setError("Add a clear OpenClaw prompt before running the assistant.");
      setIsPending(false);
      return;
    }

    const response = await fetch("/api/openclaw/assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsedRequest.data),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(payload?.error ?? "OpenClaw request failed.");
      setIsPending(false);
      return;
    }

    const payload: unknown = await response.json();
    const parsedPayload = openClawAssistantResponseSchema.safeParse(payload);

    if (!parsedPayload.success) {
      setError("OpenClaw returned an unexpected response.");
      setIsPending(false);
      return;
    }

    setResult(parsedPayload.data);
    setIsPending(false);
  };

  const addGeneratedTasks = () => {
    generatedTasks.forEach((task) => {
      onCreateTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        assignee: task.assignee,
        status: "todo",
      });
    });
  };

  return (
    <section className="mb-6 rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase text-accent">
            <Bot size={16} />
            OpenClaw
          </p>
          <h2 className="mt-2 text-xl font-bold text-foreground">
            Assistant panel
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid flex-1 gap-3 lg:max-w-3xl lg:grid-cols-[12rem_1fr_auto]"
        >
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as OpenClawMode)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            {modes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Plan onboarding, AI tasks, backlog grooming..."
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            required
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            Run
          </button>
        </form>
      </div>

      {error ? (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_18rem]">
          <div className="rounded-md bg-surface-muted p-4">
            <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
              {result.summary}
            </p>
            {result.sprintPlan.length > 0 ? (
              <ul className="mt-3 list-inside list-disc text-sm leading-6 text-slate-600 dark:text-slate-300">
                {result.sprintPlan.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {result.userStories.length > 0 ? (
              <ul className="mt-3 list-inside list-disc text-sm leading-6 text-slate-600 dark:text-slate-300">
                {result.userStories.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="rounded-md border border-border p-4">
            <p className="text-sm font-bold text-foreground">
              {generatedTasks.length} tasks
            </p>
            <button
              type="button"
              onClick={addGeneratedTasks}
              disabled={generatedTasks.length === 0}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200"
            >
              <Plus size={16} />
              Add to board
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
