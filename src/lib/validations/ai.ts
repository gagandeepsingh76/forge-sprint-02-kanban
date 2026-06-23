import { z } from "zod";

export const generatedTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.string().optional(),
  assignee: z.string().optional(),
  subtasks: z.array(z.string().min(1)).default([]),
});

export const generateTasksRequestSchema = z.object({
  projectDescription: z.string().min(20),
  boardTitle: z.string().optional(),
  count: z.number().int().min(1).max(12).default(6),
});

export const generateTasksResponseSchema = z.object({
  tasks: z.array(generatedTaskSchema).min(1),
});

export const breakdownTaskRequestSchema = z.object({
  taskTitle: z.string().min(1),
  taskDescription: z.string().optional(),
  desiredSubtasks: z.number().int().min(2).max(10).default(5),
});

export const generatedSubtaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.string().optional(),
});

export const breakdownTaskResponseSchema = z.object({
  subtasks: z.array(generatedSubtaskSchema).min(1),
});

export const prioritizeTasksRequestSchema = z.object({
  projectGoal: z.string().optional(),
  tasks: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        dueDate: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      }),
    )
    .min(1)
    .max(20),
});

export const prioritizedTaskSchema = z.object({
  title: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  rationale: z.string().min(1),
  suggestedDueDate: z.string().optional(),
});

export const prioritizeTasksResponseSchema = z.object({
  tasks: z.array(prioritizedTaskSchema).min(1),
});

export type GeneratedTask = z.infer<typeof generatedTaskSchema>;
export type GeneratedSubtask = z.infer<typeof generatedSubtaskSchema>;
export type PrioritizedTask = z.infer<typeof prioritizedTaskSchema>;
