"use client";

import type { CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  GripVertical,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react";
import type { Task, TaskStatus } from "@/types/kanban";

const priorityStyles: Record<Task["priority"], string> = {
  low: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20",
  medium:
    "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-200 dark:ring-sky-400/20",
  high: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20",
  urgent:
    "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-200 dark:ring-rose-400/20",
};

interface TaskCardProps {
  task: Task;
  availableStatuses: TaskStatus[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMove: (taskId: string, status: TaskStatus) => void;
}

export function TaskCard({
  task,
  availableStatuses,
  onEdit,
  onDelete,
  onMove,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      status: task.status,
    },
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-border bg-surface p-4 shadow-sm transition hover:shadow-md ${
        isDragging ? "relative z-10 opacity-70 ring-2 ring-accent/30" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-start gap-2">
            <button
              type="button"
              className="mt-0.5 inline-flex size-8 cursor-grab items-center justify-center rounded-md border border-border text-slate-400 transition hover:bg-surface-muted active:cursor-grabbing"
              aria-label={`Drag ${task.title}`}
              {...attributes}
              {...listeners}
            >
              <GripVertical size={16} />
            </button>
            <h3 className="font-semibold leading-6 text-foreground">
              {task.title}
            </h3>
          </div>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {task.description}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${priorityStyles[task.priority]}`}
        >
          {task.priority}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        {task.assignee ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 font-medium">
            <UserRound size={12} />
            {task.assignee}
          </span>
        ) : null}
        {task.dueDate ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 font-medium">
            <CalendarDays size={12} />
            Due {task.dueDate}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-surface-muted dark:text-slate-200"
        >
          <Pencil size={15} />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-400/30 dark:text-rose-300 dark:hover:bg-rose-400/10"
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>

      <label className="mt-3 block text-xs font-semibold uppercase text-slate-400">
        Move to
        <select
          value={task.status}
          onChange={(event) =>
            onMove(task.id, event.target.value as TaskStatus)
          }
          className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium normal-case text-slate-700 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 dark:text-slate-200"
        >
          {availableStatuses.map((status) => (
            <option key={status} value={status}>
              {status.replace("-", " ")}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}
