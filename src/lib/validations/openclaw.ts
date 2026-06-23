import { z } from "zod";
import { generatedTaskSchema } from "@/lib/validations/ai";

export const openClawModeSchema = z.enum([
  "create-tasks",
  "sprint-plan",
  "backlog",
  "user-stories",
]);

export const openClawAssistantRequestSchema = z.object({
  mode: openClawModeSchema,
  prompt: z.string().min(5),
  boardTitle: z.string().min(1).optional(),
});

export const openClawAssistantResponseSchema = z.object({
  summary: z.string().min(1),
  tasks: z.array(generatedTaskSchema).default([]),
  sprintPlan: z.array(z.string()).default([]),
  backlog: z.array(generatedTaskSchema).default([]),
  userStories: z.array(z.string()).default([]),
});

export type OpenClawMode = z.infer<typeof openClawModeSchema>;
export type OpenClawAssistantResponse = z.infer<
  typeof openClawAssistantResponseSchema
>;
