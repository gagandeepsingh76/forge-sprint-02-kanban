"use client";

import { AddTaskModal } from "@/components/AddTaskModal";
import type { Task, TaskFormValues, TaskStatus } from "@/types/kanban";

interface EditTaskModalProps {
  task: Task;
  statuses: TaskStatus[];
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
}

export function EditTaskModal({
  task,
  statuses,
  onClose,
  onSubmit,
}: EditTaskModalProps) {
  return (
    <AddTaskModal
      statuses={statuses}
      editingTask={task}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
