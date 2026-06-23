import "server-only";

import { env } from "@/lib/env";
import { openClawAssistantResponseSchema } from "@/lib/validations/openclaw";
import type {
  OpenClawAssistantResponse,
  OpenClawMode,
} from "@/lib/validations/openclaw";

interface OpenClawRequest {
  mode: OpenClawMode;
  prompt: string;
  boardTitle?: string;
  userId: string;
}

interface OpenResponsesPayload {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export class OpenClawConfigurationError extends Error {
  constructor() {
    super("OPENCLAW_GATEWAY_URL and OPENCLAW_GATEWAY_TOKEN are not configured.");
  }
}

const modeInstructions: Record<OpenClawMode, string> = {
  "create-tasks": "Create actionable Kanban tasks from natural language.",
  "sprint-plan": "Generate a practical sprint plan with delivery sequencing.",
  backlog: "Generate a prioritized product backlog.",
  "user-stories": "Generate user stories with acceptance criteria.",
};

function extractResponseText(payload: OpenResponsesPayload) {
  if (payload.output_text) {
    return payload.output_text;
  }

  const outputText = payload.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n");

  if (outputText) {
    return outputText;
  }

  return payload.choices?.[0]?.message?.content;
}

function parseJsonObject(text: string) {
  const fencedJson = text.match(/```json\s*([\s\S]*?)```/i)?.[1];
  return JSON.parse(fencedJson ?? text);
}

export async function callOpenClawAssistant({
  mode,
  prompt,
  boardTitle,
  userId,
}: OpenClawRequest): Promise<OpenClawAssistantResponse> {
  const gatewayUrl = env.OPENCLAW_GATEWAY_URL;
  const gatewayToken =
    env.OPENCLAW_GATEWAY_TOKEN ?? env.OPENCLAW_GATEWAY_PASSWORD;

  if (!gatewayUrl || !gatewayToken) {
    throw new OpenClawConfigurationError();
  }

  const response = await fetch(
    `${gatewayUrl.replace(/\/$/, "")}/v1/responses`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gatewayToken}`,
        "Content-Type": "application/json",
        "x-openclaw-agent-id": env.OPENCLAW_AGENT_ID,
      },
      body: JSON.stringify({
        model: env.OPENCLAW_MODEL,
        user: `forge-kanban-${userId}`,
        max_output_tokens: 1400,
        temperature: 0.2,
        instructions: [
          "You are the OpenClaw assistant embedded in a Kanban SaaS dashboard.",
          modeInstructions[mode],
          "Return only valid JSON with: summary, tasks, sprintPlan, backlog, userStories.",
          "Task objects must include title, description, priority, optional dueDate, optional assignee, and subtasks.",
        ].join("\n"),
        input: [
          `Mode: ${mode}`,
          `Board: ${boardTitle ?? "Untitled board"}`,
          `User request: ${prompt}`,
        ].join("\n"),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`OpenClaw request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as OpenResponsesPayload;
  const text = extractResponseText(payload);

  if (!text) {
    throw new Error("OpenClaw returned an empty response.");
  }

  return openClawAssistantResponseSchema.parse(parseJsonObject(text));
}
