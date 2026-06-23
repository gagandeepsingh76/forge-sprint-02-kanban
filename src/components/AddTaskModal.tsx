"use client";

import { FormEvent, useState } from "react";
import type { Task, TaskFormValues, TaskPriority, TaskStatus } from "@/types/kanban";

const priorities: TaskPriority[] = ["low", "medium", "high", "urgent"];

const emptyForm = (editingTask?: Task | null): TaskFormValues => ({
  title: editingTask?.title ?? "",
  description: editingTask?.description ?? "",
  priority: editingTask?.priority ?? "medium",
  dueDate: editingTask?.dueDate ?? "",
  assignee: editingTask?.assignee ?? "",
  status: editingTask?.status ?? "todo",
});

const defaultForm: TaskFormValues = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: "",
  assignee: "",
  status: "todo",
};

interface AddTaskModalProps {
  statuses: TaskStatus[];
  editingTask?: Task | null;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
}

export function AddTaskModal({
  statuses,
  editingTask,
  onClose,
  onSubmit,
}: AddTaskModalProps) {
  const [formValues, setFormValues] = useState<TaskFormValues>(
    editingTask ? emptyForm(editingTask) : defaultForm,
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formValues.title.trim()) {
      return;
    }

    onSubmit({
      ...formValues,
      title: formValues.title.trim(),
      description: formValues.description.trim(),
      assignee: formValues.assignee?.trim(),
      dueDate: formValues.dueDate || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-lg bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-950">
            {editingTask ? "Edit task" : "Add task"}
          </h2>
          <p className="text-sm text-slate-500">
            Capture the owner, priority, due date, and current status.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <label className="block text-sm font-semibold text-slate-700">
            Title
            <input
              value={formValues.title}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              placeholder="Write API contract"
              required
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Description
            <textarea
              value={formValues.description}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="mt-1 block min-h-28 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              placeholder="Add implementation notes, context, or acceptance criteria."
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Priority
              <select
                value={formValues.priority}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    priority: event.target.value as TaskPriority,
                  }))
                }
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Status
              <select
                value={formValues.status}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    status: event.target.value as TaskStatus,
                  }))
                }
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replace("-", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Assignee
              <input
                value={formValues.assignee}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    assignee: event.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder="Design, API, QA"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Due date
              <input
                type="date"
                value={formValues.dueDate}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    dueDate: event.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {editingTask ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
