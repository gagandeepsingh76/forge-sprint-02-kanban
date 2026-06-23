export type SlackEventType =
  | "task.created"
  | "task.completed"
  | "task.assigned"
  | "board.created";

export interface SlackNotificationPayload {
  event: SlackEventType;
  boardTitle: string;
  taskTitle?: string;
  assignee?: string;
  priority?: string;
  message?: string;
}
