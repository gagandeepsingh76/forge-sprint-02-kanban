import "server-only";

import type { SlackNotificationPayload } from "@/types/slack";

const eventLabels: Record<SlackNotificationPayload["event"], string> = {
  "task.created": "Task created",
  "task.completed": "Task completed",
  "task.assigned": "Task assigned",
  "board.created": "Board created",
};

function formatSlackText(payload: SlackNotificationPayload) {
  const lines = [
    `*${eventLabels[payload.event]}*`,
    `Board: ${payload.boardTitle}`,
  ];

  if (payload.taskTitle) {
    lines.push(`Task: ${payload.taskTitle}`);
  }

  if (payload.assignee) {
    lines.push(`Assignee: ${payload.assignee}`);
  }

  if (payload.priority) {
    lines.push(`Priority: ${payload.priority}`);
  }

  if (payload.message) {
    lines.push(payload.message);
  }

  return lines.join("\n");
}

export async function sendSlackNotification(
  payload: SlackNotificationPayload,
) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    return { delivered: false, skipped: true };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: formatSlackText(payload),
    }),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed with status ${response.status}.`);
  }

  return { delivered: true, skipped: false };
}
