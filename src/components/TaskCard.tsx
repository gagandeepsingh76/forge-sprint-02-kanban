"use client";

import type { Task, TaskStatus } from "@/types/kanban";

const priorityStyles: Record<Task["priority"], string> = {
  low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  medium: "bg-sky-50 text-sky-700 ring-sky-200",
  high: "bg-amber-50 text-amber-700 ring-amber-200",
  urgent: "bg-rose-50 text-rose-700 ring-rose-200",
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
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold leading-6 text-slate-950">{task.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
            {task.description}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${priorityStyles[task.priority]}`}
        >
          {task.priority}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {task.assignee ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium">
            {task.assignee}
          </span>
        ) : null}
        {task.dueDate ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium">
            Due {task.dueDate}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
        >
          Delete
        </button>
      </div>

      <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        Move to
        <select
          value={task.status}
          onChange={(event) =>
            onMove(task.id, event.target.value as TaskStatus)
          }
          className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
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
