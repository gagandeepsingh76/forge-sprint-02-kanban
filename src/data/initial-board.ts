import type { Board, Task } from "@/types/kanban";

const now = new Date().toISOString();

const tasks: Record<string, Task> = {
  "task-discovery": {
    id: "task-discovery",
    title: "Map onboarding workflow",
    description:
      "Document the current sign-up, login, and first-board creation journey.",
    priority: "high",
    dueDate: "2026-07-01",
    assignee: "Product",
    status: "todo",
    subtasks: [],
    createdAt: now,
    updatedAt: now,
  },
  "task-schema": {
    id: "task-schema",
    title: "Design Kanban data model",
    description:
      "Define boards, columns, tasks, subtasks, priorities, and ownership boundaries.",
    priority: "urgent",
    dueDate: "2026-07-03",
    assignee: "Engineering",
    status: "todo",
    subtasks: [],
    createdAt: now,
    updatedAt: now,
  },
  "task-board-ui": {
    id: "task-board-ui",
    title: "Build interactive board shell",
    description:
      "Create reusable components for columns, cards, task modals, and dashboard navigation.",
    priority: "high",
    dueDate: "2026-07-05",
    assignee: "Frontend",
    status: "in-progress",
    subtasks: [],
    createdAt: now,
    updatedAt: now,
  },
  "task-bootstrap": {
    id: "task-bootstrap",
    title: "Initialize Next.js project",
    description:
      "Set up the App Router project with TypeScript, Tailwind CSS, and linting.",
    priority: "medium",
    assignee: "Platform",
    status: "done",
    subtasks: [],
    createdAt: now,
    updatedAt: now,
  },
};

export const initialBoard: Board = {
  id: "board-product-launch",
  title: "Product Launch Sprint",
  description: "Plan, sequence, and ship the AI-powered Kanban experience.",
  columns: [
    {
      id: "todo",
      title: "Todo",
      description: "Ready to be picked up",
      taskIds: ["task-discovery", "task-schema"],
    },
    {
      id: "in-progress",
      title: "In Progress",
      description: "Actively moving",
      taskIds: ["task-board-ui"],
    },
    {
      id: "done",
      title: "Done",
      description: "Shipped and verified",
      taskIds: ["task-bootstrap"],
    },
  ],
  tasks,
  createdAt: now,
  updatedAt: now,
};
