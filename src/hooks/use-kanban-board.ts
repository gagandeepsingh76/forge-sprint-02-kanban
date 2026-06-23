"use client";

import { useCallback, useMemo, useState } from "react";
import type { Board, Task, TaskFormValues, TaskStatus } from "@/types/kanban";

const createTaskId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function useKanbanBoard(initialBoard: Board) {
  const [board, setBoard] = useState<Board>(initialBoard);

  const taskCount = useMemo(() => Object.keys(board.tasks).length, [board.tasks]);

  const addTask = useCallback((values: TaskFormValues) => {
    const taskId = createTaskId();
    const timestamp = new Date().toISOString();
    const task: Task = {
      id: taskId,
      ...values,
      subtasks: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setBoard((currentBoard) => ({
      ...currentBoard,
      tasks: {
        ...currentBoard.tasks,
        [taskId]: task,
      },
      columns: currentBoard.columns.map((column) =>
        column.id === values.status
          ? { ...column, taskIds: [...column.taskIds, taskId] }
          : column,
      ),
      updatedAt: timestamp,
    }));
  }, []);

  const editTask = useCallback((taskId: string, values: TaskFormValues) => {
    const timestamp = new Date().toISOString();

    setBoard((currentBoard) => {
      const existingTask = currentBoard.tasks[taskId];

      if (!existingTask) {
        return currentBoard;
      }

      const movedColumns =
        existingTask.status === values.status
          ? currentBoard.columns
          : currentBoard.columns.map((column) => {
              if (column.id === existingTask.status) {
                return {
                  ...column,
                  taskIds: column.taskIds.filter((id) => id !== taskId),
                };
              }

              if (column.id === values.status) {
                return { ...column, taskIds: [...column.taskIds, taskId] };
              }

              return column;
            });

      return {
        ...currentBoard,
        tasks: {
          ...currentBoard.tasks,
          [taskId]: {
            ...existingTask,
            ...values,
            updatedAt: timestamp,
          },
        },
        columns: movedColumns,
        updatedAt: timestamp,
      };
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    const timestamp = new Date().toISOString();

    setBoard((currentBoard) => {
      const remainingTasks = { ...currentBoard.tasks };
      delete remainingTasks[taskId];

      return {
        ...currentBoard,
        tasks: remainingTasks,
        columns: currentBoard.columns.map((column) => ({
          ...column,
          taskIds: column.taskIds.filter((id) => id !== taskId),
        })),
        updatedAt: timestamp,
      };
    });
  }, []);

  const moveTask = useCallback((taskId: string, targetStatus: TaskStatus) => {
    const timestamp = new Date().toISOString();

    setBoard((currentBoard) => {
      const task = currentBoard.tasks[taskId];

      if (!task || task.status === targetStatus) {
        return currentBoard;
      }

      return {
        ...currentBoard,
        tasks: {
          ...currentBoard.tasks,
          [taskId]: {
            ...task,
            status: targetStatus,
            updatedAt: timestamp,
          },
        },
        columns: currentBoard.columns.map((column) => {
          if (column.id === task.status) {
            return {
              ...column,
              taskIds: column.taskIds.filter((id) => id !== taskId),
            };
          }

          if (column.id === targetStatus) {
            return { ...column, taskIds: [...column.taskIds, taskId] };
          }

          return column;
        }),
        updatedAt: timestamp,
      };
    });
  }, []);

  const reorderTask = useCallback(
    (taskId: string, targetStatus: TaskStatus, targetTaskId?: string) => {
      const timestamp = new Date().toISOString();

      setBoard((currentBoard) => {
        const task = currentBoard.tasks[taskId];

        if (!task) {
          return currentBoard;
        }

        const sourceColumn = currentBoard.columns.find((column) =>
          column.taskIds.includes(taskId),
        );
        const targetColumn = currentBoard.columns.find(
          (column) => column.id === targetStatus,
        );

        if (!sourceColumn || !targetColumn) {
          return currentBoard;
        }

        const nextColumns = currentBoard.columns.map((column) => {
          const withoutDraggedTask = column.taskIds.filter((id) => id !== taskId);

          if (column.id !== targetStatus) {
            return {
              ...column,
              taskIds: withoutDraggedTask,
            };
          }

          const insertionIndex = targetTaskId
            ? withoutDraggedTask.indexOf(targetTaskId)
            : withoutDraggedTask.length;
          const safeInsertionIndex =
            insertionIndex >= 0 ? insertionIndex : withoutDraggedTask.length;

          return {
            ...column,
            taskIds: [
              ...withoutDraggedTask.slice(0, safeInsertionIndex),
              taskId,
              ...withoutDraggedTask.slice(safeInsertionIndex),
            ],
          };
        });

        return {
          ...currentBoard,
          tasks: {
            ...currentBoard.tasks,
            [taskId]: {
              ...task,
              status: targetStatus,
              updatedAt: timestamp,
            },
          },
          columns: nextColumns,
          updatedAt: timestamp,
        };
      });
    },
    [],
  );

  return {
    board,
    taskCount,
    addTask,
    editTask,
    deleteTask,
    moveTask,
    reorderTask,
  };
}
