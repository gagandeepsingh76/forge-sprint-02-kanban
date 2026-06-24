import "server-only";

import { env } from "@/lib/env";
import { openClawAssistantResponseSchema } from "@/lib/validations/openclaw";
import type {
  OpenClawAssistantResponse,
  OpenClawMode,
} from "@/lib/validations/openclaw";

const OPENROUTER_CHAT_COMPLETIONS_URL =
  "https://openrouter.ai/api/v1/chat/completions";

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

interface AssistantProviderStatus {
  enabled: boolean;
  provider: "openclaw" | "openrouter" | null;
}

export class OpenClawConfigurationError extends Error {
  constructor() {
    super("Assistant provider is not configured.");
  }
}

const modeInstructions: Record<OpenClawMode, string> = {
  "create-tasks": "Create actionable Kanban tasks from natural language.",
  "sprint-plan": "Generate a practical sprint plan with delivery sequencing.",
  backlog: "Generate a prioritized product backlog.",
  "user-stories": "Generate user stories with acceptance criteria.",
};

function getOpenClawGatewayConfig() {
  const gatewayUrl = env.OPENCLAW_GATEWAY_URL;
  const gatewayToken =
    env.OPENCLAW_GATEWAY_TOKEN ?? env.OPENCLAW_GATEWAY_PASSWORD;

  return gatewayUrl && gatewayToken
    ? {
        gatewayUrl,
        gatewayToken,
      }
    : null;
}

export function getAssistantProviderStatus(): AssistantProviderStatus {
  if (getOpenClawGatewayConfig()) {
    return {
      enabled: true,
      provider: "openclaw",
    };
  }

  if (env.OPENROUTER_API_KEY) {
    return {
      enabled: true,
      provider: "openrouter",
    };
  }

  return {
    enabled: false,
    provider: null,
  };
}

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

function createAssistantPrompt({
  mode,
  prompt,
  boardTitle,
}: Pick<OpenClawRequest, "boardTitle" | "mode" | "prompt">) {
  return [
    `Mode: ${mode}`,
    `Board: ${boardTitle ?? "Untitled board"}`,
    `User request: ${prompt}`,
  ].join("\n");
}

const assistantInstructions = [
  "You are the assistant embedded in a Kanban SaaS dashboard.",
  "Return only valid JSON with: summary, tasks, sprintPlan, backlog, userStories.",
  "Task objects must include title, description, priority, optional dueDate, optional assignee, and subtasks.",
  "Use empty arrays for sections that do not apply.",
].join("\n");

async function callOpenClawGateway(
  request: OpenClawRequest,
  gatewayConfig: NonNullable<ReturnType<typeof getOpenClawGatewayConfig>>,
) {
  const response = await fetch(
    `${gatewayConfig.gatewayUrl.replace(/\/$/, "")}/v1/responses`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gatewayConfig.gatewayToken}`,
        "Content-Type": "application/json",
        "x-openclaw-agent-id": env.OPENCLAW_AGENT_ID,
      },
      body: JSON.stringify({
        model: env.OPENCLAW_MODEL,
        user: `forge-kanban-${request.userId}`,
        max_output_tokens: 1400,
        temperature: 0.2,
        instructions: [
          assistantInstructions,
          modeInstructions[request.mode],
        ].join("\n"),
        input: createAssistantPrompt(request),
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

async function callOpenRouterAssistant(
  request: OpenClawRequest,
): Promise<OpenClawAssistantResponse> {
  if (!env.OPENROUTER_API_KEY) {
    throw new OpenClawConfigurationError();
  }

  const response = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": env.NEXTAUTH_URL ?? "http://localhost:3000",
      "X-OpenRouter-Title": "Forge Sprint Kanban",
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL,
      temperature: 0.2,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: [assistantInstructions, modeInstructions[request.mode]].join(
            "\n",
          ),
        },
        {
          role: "user",
          content: createAssistantPrompt(request),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as OpenResponsesPayload;
  const text = extractResponseText(payload);

  if (!text) {
    throw new Error("OpenRouter returned an empty response.");
  }

  return openClawAssistantResponseSchema.parse(parseJsonObject(text));
}

export async function callOpenClawAssistant(
  request: OpenClawRequest,
): Promise<OpenClawAssistantResponse> {
  const gatewayConfig = getOpenClawGatewayConfig();

  if (gatewayConfig) {
    return callOpenClawGateway(request, gatewayConfig);
  }

  return callOpenRouterAssistant(request);
}
