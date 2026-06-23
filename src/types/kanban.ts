export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskStatus = "todo" | "in-progress" | "done";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate?: string;
  assignee?: string;
  status: TaskStatus;
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  description: string;
  taskIds: string[];
}

export interface Board {
  id: string;
  title: string;
  description: string;
  columns: KanbanColumn[];
  tasks: Record<string, Task>;
  createdAt: string;
  updatedAt: string;
}

export interface BoardCollection {
  activeBoardId: string;
  boards: Board[];
}

export interface TaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate?: string;
  assignee?: string;
  status: TaskStatus;
}
