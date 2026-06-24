import { afterEach, describe, expect, it, vi } from "vitest";

const assistantPayload = {
  summary: "Recommended sprint plan.",
  tasks: [],
  sprintPlan: ["Start with auth hardening."],
  backlog: [],
  userStories: [],
};

const loggerMock = {
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

const baseEnv = {
  NEXTAUTH_URL: "https://kanban.example.com",
  OPENCLAW_AGENT_ID: "main",
  OPENCLAW_MODEL: "openclaw/default",
  OPENROUTER_MODEL: "~openai/gpt-latest",
};

async function importOpenClaw(env: Record<string, string | undefined>) {
  vi.resetModules();
  vi.doMock("server-only", () => ({}));
  vi.doMock("@/lib/env", () => ({
    env: {
      ...baseEnv,
      ...env,
    },
  }));
  vi.doMock("@/lib/logger", () => ({
    logger: loggerMock,
  }));

  return import("@/lib/openclaw");
}

function request() {
  return {
    mode: "create-tasks" as const,
    prompt: "Plan the next onboarding sprint.",
    boardTitle: "Launch",
    userId: "user-1",
  };
}

describe("OpenClaw assistant provider selection", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("uses the OpenClaw gateway when URL and token are configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        output_text: JSON.stringify(assistantPayload),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { callOpenClawAssistant, getAssistantProviderStatus } =
      await importOpenClaw({
        OPENCLAW_GATEWAY_URL: "https://openclaw.example.com",
        OPENCLAW_GATEWAY_TOKEN: "openclaw-token",
        OPENROUTER_API_KEY: "openrouter-key",
      });

    await expect(callOpenClawAssistant(request())).resolves.toEqual(
      assistantPayload,
    );
    expect(getAssistantProviderStatus()).toEqual({
      enabled: true,
      provider: "openclaw",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://openclaw.example.com/v1/responses",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer openclaw-token",
          "x-openclaw-agent-id": "main",
        }),
      }),
    );

    const fetchCall = fetchMock.mock.calls[0];
    expect(fetchCall).toBeDefined();
    const [, init] = fetchCall as [string, RequestInit];
    const payload = JSON.parse(init.body as string) as Record<string, unknown>;

    expect(payload).toMatchObject({
      input: expect.stringContaining("Plan the next onboarding sprint."),
      max_output_tokens: 1400,
      model: "openclaw/default",
      temperature: 0.2,
      user: "forge-kanban-user-1",
    });
    expect(payload.instructions).toEqual(
      expect.stringContaining("Create actionable Kanban tasks"),
    );
    expect(loggerMock.info).toHaveBeenCalledWith(
      "assistant.provider_selected",
      expect.objectContaining({
        model: "openclaw/default",
        openRouterApiKeyPresent: true,
        provider: "openclaw",
        upstreamUrl: "https://openclaw.example.com/v1/responses",
      }),
    );
  });

  it("uses OpenRouter when only OPENROUTER_API_KEY is configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify(assistantPayload),
            },
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { callOpenClawAssistant, getAssistantProviderStatus } =
      await importOpenClaw({
        OPENROUTER_API_KEY: "openrouter-key",
      });

    await expect(callOpenClawAssistant(request())).resolves.toEqual(
      assistantPayload,
    );
    expect(getAssistantProviderStatus()).toEqual({
      enabled: true,
      provider: "openrouter",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer openrouter-key",
        }),
      }),
    );

    const fetchCall = fetchMock.mock.calls[0];
    expect(fetchCall).toBeDefined();
    const [, init] = fetchCall as [string, RequestInit];
    const payload = JSON.parse(init.body as string) as {
      messages: Array<{ content: string; role: string }>;
      model: string;
      response_format: { type: string };
      temperature: number;
    };

    expect(payload).toMatchObject({
      model: "~openai/gpt-latest",
      response_format: {
        type: "json_object",
      },
      temperature: 0.2,
    });
    expect(payload.messages).toEqual([
      expect.objectContaining({
        content: expect.stringContaining("Create actionable Kanban tasks"),
        role: "system",
      }),
      expect.objectContaining({
        content: expect.stringContaining("Plan the next onboarding sprint."),
        role: "user",
      }),
    ]);
    expect(loggerMock.info).toHaveBeenCalledWith(
      "assistant.provider_selected",
      expect.objectContaining({
        model: "~openai/gpt-latest",
        openRouterApiKeyPresent: true,
        provider: "openrouter",
        upstreamUrl: "https://openrouter.ai/api/v1/chat/completions",
      }),
    );
    expect(loggerMock.info).toHaveBeenCalledWith(
      "assistant.upstream_response",
      expect.objectContaining({
        provider: "openrouter",
        upstreamOk: true,
        upstreamStatus: 200,
      }),
    );
    expect(JSON.stringify(loggerMock.info.mock.calls)).not.toContain(
      "openrouter-key",
    );
  });

  it("logs OpenRouter upstream error responses without leaking secrets", async () => {
    const upstreamError = {
      error: {
        message: "No auth credentials found",
      },
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(upstreamError), {
        headers: {
          "Content-Type": "application/json",
        },
        status: 401,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { callOpenClawAssistant } = await importOpenClaw({
      OPENROUTER_API_KEY: "openrouter-key",
    });

    await expect(callOpenClawAssistant(request())).rejects.toThrow(
      "OpenRouter request failed with status 401.",
    );
    expect(loggerMock.error).toHaveBeenCalledWith(
      "assistant.upstream_error_response",
      expect.objectContaining({
        model: "~openai/gpt-latest",
        openRouterApiKeyPresent: true,
        provider: "openrouter",
        upstreamErrorBody: JSON.stringify(upstreamError),
        upstreamErrorMessage: "No auth credentials found",
        upstreamStatus: 401,
        upstreamUrl: "https://openrouter.ai/api/v1/chat/completions",
      }),
    );
    expect(
      JSON.stringify([
        ...loggerMock.info.mock.calls,
        ...loggerMock.error.mock.calls,
      ]),
    ).not.toContain("openrouter-key");
  });

  it("throws a configuration error only when no assistant provider is configured", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const {
      OpenClawConfigurationError,
      callOpenClawAssistant,
      getAssistantProviderStatus,
    } = await importOpenClaw({});

    await expect(callOpenClawAssistant(request())).rejects.toBeInstanceOf(
      OpenClawConfigurationError,
    );
    expect(getAssistantProviderStatus()).toEqual({
      enabled: false,
      provider: null,
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
