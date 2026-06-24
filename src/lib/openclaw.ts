import "server-only";

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { openClawAssistantResponseSchema } from "@/lib/validations/openclaw";
import type {
  OpenClawAssistantResponse,
  OpenClawMode,
} from "@/lib/validations/openclaw";

const OPENROUTER_CHAT_COMPLETIONS_URL =
  "https://openrouter.ai/api/v1/chat/completions";
const MAX_UPSTREAM_ERROR_BODY_LENGTH = 4000;

type AssistantProvider = "openclaw" | "openrouter";

interface OpenClawRequest {
  mode: OpenClawMode;
  prompt: string;
  boardTitle?: string;
  requestId?: string;
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
  provider: AssistantProvider | null;
}

interface AssistantProviderLogContext {
  model: string;
  provider: AssistantProvider;
  requestId: string | undefined;
  upstreamUrl: string;
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

function getProviderLogMeta(context: AssistantProviderLogContext) {
  return {
    requestId: context.requestId,
    provider: context.provider,
    openRouterApiKeyPresent: Boolean(env.OPENROUTER_API_KEY),
    model: context.model,
    upstreamUrl: context.upstreamUrl,
  };
}

function truncateLogValue(value: string) {
  return value.length > MAX_UPSTREAM_ERROR_BODY_LENGTH
    ? `${value.slice(0, MAX_UPSTREAM_ERROR_BODY_LENGTH)}...[truncated]`
    : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractUpstreamErrorMessage(body: string | null) {
  if (!body) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(body);

    if (!isRecord(parsed)) {
      return null;
    }

    if (typeof parsed.message === "string") {
      return parsed.message;
    }

    if (typeof parsed.error === "string") {
      return parsed.error;
    }

    if (isRecord(parsed.error) && typeof parsed.error.message === "string") {
      return parsed.error.message;
    }
  } catch {
    return truncateLogValue(body);
  }

  return null;
}

async function readUpstreamErrorBody(
  response: Response,
  context: AssistantProviderLogContext,
) {
  try {
    const body = await response.text();
    return body ? truncateLogValue(body) : null;
  } catch (error) {
    logger.warn("assistant.upstream_error_body_read_failed", {
      ...getProviderLogMeta(context),
      upstreamStatus: response.status,
      error,
    });

    return null;
  }
}

async function fetchAssistantUpstream(
  upstreamUrl: string,
  init: RequestInit,
  context: AssistantProviderLogContext,
) {
  logger.info("assistant.provider_selected", getProviderLogMeta(context));

  try {
    const response = await fetch(upstreamUrl, init);

    logger.info("assistant.upstream_response", {
      ...getProviderLogMeta(context),
      upstreamOk: response.ok,
      upstreamStatus: response.status,
    });

    return response;
  } catch (error) {
    logger.error("assistant.upstream_fetch_failed", {
      ...getProviderLogMeta(context),
      error,
    });

    throw error;
  }
}

async function throwUpstreamResponseError(
  providerName: "OpenClaw" | "OpenRouter",
  response: Response,
  context: AssistantProviderLogContext,
): Promise<never> {
  const upstreamErrorBody = await readUpstreamErrorBody(response, context);

  logger.error("assistant.upstream_error_response", {
    ...getProviderLogMeta(context),
    upstreamErrorBody,
    upstreamErrorMessage: extractUpstreamErrorMessage(upstreamErrorBody),
    upstreamStatus: response.status,
  });

  throw new Error(
    `${providerName} request failed with status ${response.status}.`,
  );
}

function parseAssistantResponse(
  text: string,
  providerName: "OpenClaw" | "OpenRouter",
  context: AssistantProviderLogContext,
) {
  try {
    return openClawAssistantResponseSchema.parse(parseJsonObject(text));
  } catch (error) {
    logger.error("assistant.response_parse_failed", {
      ...getProviderLogMeta(context),
      providerName,
      error,
    });

    throw error;
  }
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
  const upstreamUrl = `${gatewayConfig.gatewayUrl.replace(/\/$/, "")}/v1/responses`;
  const logContext = {
    model: env.OPENCLAW_MODEL,
    provider: "openclaw" as const,
    requestId: request.requestId,
    upstreamUrl,
  };
  const response = await fetchAssistantUpstream(
    upstreamUrl,
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
    logContext,
  );

  if (!response.ok) {
    await throwUpstreamResponseError("OpenClaw", response, logContext);
  }

  const payload = (await response.json()) as OpenResponsesPayload;
  const text = extractResponseText(payload);

  if (!text) {
    logger.error(
      "assistant.upstream_empty_response",
      getProviderLogMeta(logContext),
    );
    throw new Error("OpenClaw returned an empty response.");
  }

  return parseAssistantResponse(text, "OpenClaw", logContext);
}

async function callOpenRouterAssistant(
  request: OpenClawRequest,
): Promise<OpenClawAssistantResponse> {
  if (!env.OPENROUTER_API_KEY) {
    throw new OpenClawConfigurationError();
  }

  const logContext = {
    model: env.OPENROUTER_MODEL,
    provider: "openrouter" as const,
    requestId: request.requestId,
    upstreamUrl: OPENROUTER_CHAT_COMPLETIONS_URL,
  };
  const response = await fetchAssistantUpstream(
    OPENROUTER_CHAT_COMPLETIONS_URL,
    {
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
            content: [
              assistantInstructions,
              modeInstructions[request.mode],
            ].join("\n"),
          },
          {
            role: "user",
            content: createAssistantPrompt(request),
          },
        ],
      }),
    },
    logContext,
  );

  if (!response.ok) {
    await throwUpstreamResponseError("OpenRouter", response, logContext);
  }

  const payload = (await response.json()) as OpenResponsesPayload;
  const text = extractResponseText(payload);

  if (!text) {
    logger.error(
      "assistant.upstream_empty_response",
      getProviderLogMeta(logContext),
    );
    throw new Error("OpenRouter returned an empty response.");
  }

  return parseAssistantResponse(text, "OpenRouter", logContext);
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
