"use client";

import type { KanbanColumn as KanbanColumnType, Task, TaskStatus } from "@/types/kanban";
import { TaskCard } from "@/components/TaskCard";

interface KanbanColumnProps {
  column: KanbanColumnType;
  tasks: Task[];
  availableStatuses: TaskStatus[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (taskId: string, status: TaskStatus) => void;
}

export function KanbanColumn({
  column,
  tasks,
  availableStatuses,
  onEditTask,
  onDeleteTask,
  onMoveTask,
}: KanbanColumnProps) {
  return (
    <section className="flex min-h-[28rem] flex-col rounded-lg border border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-950">{column.title}</h2>
            <p className="text-sm text-slate-500">{column.description}</p>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              availableStatuses={availableStatuses}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onMove={onMoveTask}
            />
          ))
        ) : (
          <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm font-medium text-slate-400">
            Drop new work here
          </div>
        )}
      </div>
    </section>
  );
}
