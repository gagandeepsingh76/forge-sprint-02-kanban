import type { SlackNotificationPayload } from "@/types/slack";
import { slackNotificationSchema } from "@/lib/validations/slack";

export async function notifySlack(payload: SlackNotificationPayload) {
  const parsedPayload = slackNotificationSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return;
  }

  try {
    await fetch("/api/slack/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsedPayload.data),
    });
  } catch {
    // Slack notifications must never block local board interactions.
  }
}
