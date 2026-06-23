import type { SlackNotificationPayload } from "@/types/slack";

export async function notifySlack(payload: SlackNotificationPayload) {
  try {
    await fetch("/api/slack/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Slack notifications must never block local board interactions.
  }
}
