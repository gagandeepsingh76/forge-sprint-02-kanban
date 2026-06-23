import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerSession } from "next-auth";
import { callGeminiJson } from "@/lib/gemini";
import { POST as breakdownTask } from "@/app/api/ai/breakdown-task/route";
import { POST as generateTasks } from "@/app/api/ai/generate-tasks/route";
import { POST as prioritizeTasks } from "@/app/api/ai/prioritize/route";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@/lib/gemini", () => ({
  GeminiConfigurationError: class GeminiConfigurationError extends Error {
    constructor() {
      super("GEMINI_API_KEY is not configured.");
    }
  },
  callGeminiJson: vi.fn(),
}));

const getServerSessionMock = vi.mocked(getServerSession);
const callGeminiJsonMock = vi.mocked(callGeminiJson);

function jsonRequest(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("AI routes", () => {
  beforeEach(() => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    });
    callGeminiJsonMock.mockReset();
  });

  it("rejects unauthenticated generate requests", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await generateTasks(
      jsonRequest("/api/ai/generate-tasks", {
        projectDescription: "Build enough product context for task generation.",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
      error: "Unauthorized",
    });
  });

  it("generates tasks from a valid project description", async () => {
    const payload = {
      tasks: [
        {
          title: "Write API tests",
          description: "Cover happy and unhappy API paths.",
          priority: "high",
          subtasks: [],
        },
      ],
    };
    callGeminiJsonMock.mockResolvedValue(payload);

    const response = await generateTasks(
      jsonRequest("/api/ai/generate-tasks", {
        projectDescription:
          "Build a production Kanban release with AI task generation.",
        boardTitle: "Launch",
        count: 1,
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(payload);
    expect(callGeminiJsonMock).toHaveBeenCalledOnce();
  });

  it("breaks a task into subtasks", async () => {
    const payload = {
      subtasks: [
        {
          title: "Create route tests",
          description: "Exercise route validation and responses.",
          priority: "medium",
        },
      ],
    };
    callGeminiJsonMock.mockResolvedValue(payload);

    const response = await breakdownTask(
      jsonRequest("/api/ai/breakdown-task", {
        taskTitle: "Add testing suite",
        taskDescription: "Cover app behavior.",
        desiredSubtasks: 2,
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(payload);
  });

  it("prioritizes a valid task list", async () => {
    const payload = {
      tasks: [
        {
          title: "Secure API routes",
          priority: "urgent",
          rationale: "Protects production traffic.",
        },
      ],
    };
    callGeminiJsonMock.mockResolvedValue(payload);

    const response = await prioritizeTasks(
      jsonRequest("/api/ai/prioritize", {
        projectGoal: "Ship production hardening",
        tasks: [{ title: "Secure API routes", priority: "high" }],
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(payload);
  });
});
