import { z } from "zod";

export const taskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const taskStatusSchema = z.enum(["todo", "in-progress", "done"]);

export const subtaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  completed: z.boolean(),
});

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  priority: taskPrioritySchema,
  dueDate: z.string().optional(),
  assignee: z.string().optional(),
  status: taskStatusSchema,
  subtasks: z.array(subtaskSchema),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const kanbanColumnSchema = z.object({
  id: taskStatusSchema,
  title: z.string().min(1),
  description: z.string(),
  taskIds: z.array(z.string().min(1)),
});

export const boardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  columns: z.array(kanbanColumnSchema).min(1),
  tasks: z.record(z.string(), taskSchema),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const boardCollectionSchema = z.object({
  activeBoardId: z.string().min(1),
  boards: z.array(boardSchema).min(1),
});

export const taskFormSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim(),
  priority: taskPrioritySchema,
  dueDate: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  assignee: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  status: taskStatusSchema,
});

export const boardTitleSchema = z.string().trim().min(1).max(120);
