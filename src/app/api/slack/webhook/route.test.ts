import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerSession } from "next-auth";
import { POST } from "@/app/api/slack/webhook/route";
import { sendSlackNotification } from "@/lib/slack";

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

vi.mock("@/lib/slack", () => ({
  sendSlackNotification: vi.fn(),
}));

const getServerSessionMock = vi.mocked(getServerSession);
const sendSlackNotificationMock = vi.mocked(sendSlackNotification);

function slackRequest(body: unknown) {
  return new Request("http://localhost/api/slack/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("Slack webhook route", () => {
  beforeEach(() => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    });
    sendSlackNotificationMock.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await POST(
      slackRequest({
        event: "task.created",
        boardTitle: "Launch",
      }),
    );

    expect(response.status).toBe(401);
  });

  it("validates notification payloads", async () => {
    const response = await POST(slackRequest({ event: "task.created" }));

    expect(response.status).toBe(400);
    expect(sendSlackNotificationMock).not.toHaveBeenCalled();
  });

  it("delivers valid notifications", async () => {
    sendSlackNotificationMock.mockResolvedValue({
      delivered: true,
      skipped: false,
    });

    const response = await POST(
      slackRequest({
        event: "task.completed",
        boardTitle: "Launch",
        taskTitle: "Ship tests",
        priority: "high",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      delivered: true,
      skipped: false,
    });
    expect(sendSlackNotificationMock).toHaveBeenCalledWith({
      event: "task.completed",
      boardTitle: "Launch",
      taskTitle: "Ship tests",
      priority: "high",
    });
  });
});
