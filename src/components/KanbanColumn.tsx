"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: {
      type: "column",
      status: column.id,
    },
  });

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-[28rem] flex-col rounded-lg border bg-surface-muted transition ${
        isOver ? "border-accent ring-2 ring-accent/20" : "border-border"
      }`}
    >
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-foreground">{column.title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {column.description}
            </p>
          </div>
          <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-border dark:text-slate-300">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
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
            <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-border bg-surface/70 p-6 text-center text-sm font-medium text-slate-400">
              Drop new work here
            </div>
          )}
        </SortableContext>
      </div>
    </section>
  );
}
