"use client";

import { useMemo, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CalendarClock, CheckCircle2, CircleDot, TimerReset } from "lucide-react";
import { initialBoard } from "@/data/initial-board";
import { useKanbanBoard } from "@/hooks/use-kanban-board";
import type { Task, TaskFormValues, TaskStatus } from "@/types/kanban";
import { AddTaskModal } from "@/components/AddTaskModal";
import { KanbanColumn } from "@/components/KanbanColumn";
import { Navbar } from "@/components/Navbar";

export function KanbanBoard() {
  const {
    board,
    taskCount,
    addTask,
    editTask,
    deleteTask,
    moveTask,
    reorderTask,
  } = useKanbanBoard(initialBoard);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const statuses = useMemo(
    () => board.columns.map((column) => column.id),
    [board.columns],
  );

  const openAddTaskModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleTaskSubmit = (values: TaskFormValues) => {
    if (editingTask) {
      editTask(editingTask.id, values);
    } else {
      addTask(values);
    }

    closeTaskModal();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const overData = over.data.current;
    const activeData = active.data.current;

    if (activeData?.type !== "task") {
      return;
    }

    if (overData?.type === "column") {
      reorderTask(String(active.id), overData.status as TaskStatus);
      return;
    }

    if (overData?.type === "task") {
      reorderTask(
        String(active.id),
        overData.status as TaskStatus,
        String(over.id),
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        boardTitle={board.title}
        taskCount={taskCount}
        onAddTask={openAddTaskModal}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
        <section className="mb-6 grid gap-4 lg:grid-cols-[1fr_22rem]">
          <div className="py-2">
            <p className="text-sm font-semibold uppercase text-accent">
              Dashboard
            </p>
            <div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {board.description}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Add, edit, delete, and move tasks through the sprint workflow.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-surface p-3 shadow-sm">
            <div className="rounded-md bg-teal-50 p-3 text-teal-900 dark:bg-teal-400/10 dark:text-teal-200">
              <CircleDot size={18} />
              <p className="mt-3 text-lg font-bold">{taskCount}</p>
              <p className="text-xs font-semibold uppercase">Tasks</p>
            </div>
            <div className="rounded-md bg-indigo-50 p-3 text-indigo-900 dark:bg-indigo-400/10 dark:text-indigo-200">
              <TimerReset size={18} />
              <p className="mt-3 text-lg font-bold">
                {board.columns.find((column) => column.id === "in-progress")
                  ?.taskIds.length ?? 0}
              </p>
              <p className="text-xs font-semibold uppercase">Active</p>
            </div>
            <div className="rounded-md bg-emerald-50 p-3 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-200">
              <CheckCircle2 size={18} />
              <p className="mt-3 text-lg font-bold">
                {board.columns.find((column) => column.id === "done")?.taskIds
                  .length ?? 0}
              </p>
              <p className="text-xs font-semibold uppercase">Done</p>
            </div>
          </div>

          <p className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 lg:col-span-2">
            <CalendarClock size={16} />
            Last updated {new Date(board.updatedAt).toLocaleDateString()}
          </p>
        </section>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {board.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={column.taskIds
                  .map((taskId) => board.tasks[taskId])
                  .filter(Boolean)}
                availableStatuses={statuses}
                onEditTask={openEditTaskModal}
                onDeleteTask={deleteTask}
                onMoveTask={moveTask}
              />
            ))}
          </div>
        </DndContext>
      </main>

      {isTaskModalOpen ? (
        <AddTaskModal
          statuses={statuses}
          editingTask={editingTask}
          onClose={closeTaskModal}
          onSubmit={handleTaskSubmit}
        />
      ) : null}
    </div>
  );
}
