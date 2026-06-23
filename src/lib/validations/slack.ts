import { z } from "zod";

export const slackNotificationSchema = z.object({
  event: z.enum([
    "task.created",
    "task.completed",
    "task.assigned",
    "board.created",
  ]),
  boardTitle: z.string().min(1),
  taskTitle: z.string().optional(),
  assignee: z.string().optional(),
  priority: z.string().optional(),
  message: z.string().optional(),
});
