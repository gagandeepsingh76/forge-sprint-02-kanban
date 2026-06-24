import { afterEach, describe, expect, it, vi } from "vitest";

const assistantPayload = {
  summary: "Recommended sprint plan.",
  tasks: [],
  sprintPlan: ["Start with auth hardening."],
  backlog: [],
  userStories: [],
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
