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
import { initialBoard } from "@/data/initial-board";
import { useKanbanBoard } from "@/hooks/use-kanban-board";
import type { Task, TaskFormValues, TaskStatus } from "@/types/kanban";
import { AddTaskModal } from "@/components/AddTaskModal";
import { KanbanColumn } from "@/components/KanbanColumn";
import { Navbar } from "@/components/Navbar";

export function KanbanBoard() {
  const { board, taskCount, addTask, editTask, deleteTask, moveTask, reorderTask } =
    useKanbanBoard(initialBoard);
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
    <div className="min-h-screen bg-slate-100">
      <Navbar
        boardTitle={board.title}
        taskCount={taskCount}
        onAddTask={openAddTaskModal}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Dashboard
          </p>
          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                {board.description}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Add, edit, delete, and move tasks through the sprint workflow.
              </p>
            </div>
            <p className="text-sm font-medium text-slate-500">
              Last updated {new Date(board.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

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
