"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadBoardCollection,
  saveBoardCollection,
} from "@/lib/board-storage";
import type {
  Board,
  BoardCollection,
  KanbanColumn,
  Task,
  TaskFormValues,
  TaskStatus,
} from "@/types/kanban";

const createId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createDefaultColumns = (): KanbanColumn[] => [
  {
    id: "todo",
    title: "Todo",
    description: "Ready to be picked up",
    taskIds: [],
  },
  {
    id: "in-progress",
    title: "In Progress",
    description: "Actively moving",
    taskIds: [],
  },
  {
    id: "done",
    title: "Done",
    description: "Shipped and verified",
    taskIds: [],
  },
];

const createBlankBoard = (title: string): Board => {
  const timestamp = new Date().toISOString();

  return {
    id: createId("board"),
    title,
    description: `Plan and track work for ${title}.`,
    columns: createDefaultColumns(),
    tasks: {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

export function useKanbanBoard(initialBoard: Board) {
  const [collection, setCollection] = useState<BoardCollection>(() =>
    loadBoardCollection(initialBoard),
  );

  const board = useMemo(() => {
    return (
      collection.boards.find((candidate) => candidate.id === collection.activeBoardId) ??
      collection.boards[0] ??
      initialBoard
    );
  }, [collection.activeBoardId, collection.boards, initialBoard]);

  const taskCount = useMemo(() => Object.keys(board.tasks).length, [board.tasks]);

  useEffect(() => {
    saveBoardCollection(collection);
  }, [collection]);

  const updateActiveBoard = useCallback((updater: (board: Board) => Board) => {
    setCollection((currentCollection) => ({
      ...currentCollection,
      boards: currentCollection.boards.map((currentBoard) =>
        currentBoard.id === currentCollection.activeBoardId
          ? updater(currentBoard)
          : currentBoard,
      ),
    }));
  }, []);

  const createBoard = useCallback((title: string) => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    const boardToCreate = createBlankBoard(trimmedTitle);

    setCollection((currentCollection) => ({
      activeBoardId: boardToCreate.id,
      boards: [...currentCollection.boards, boardToCreate],
    }));
  }, []);

  const renameBoard = useCallback((boardId: string, title: string) => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    const timestamp = new Date().toISOString();

    setCollection((currentCollection) => ({
      ...currentCollection,
      boards: currentCollection.boards.map((currentBoard) =>
        currentBoard.id === boardId
          ? {
              ...currentBoard,
              title: trimmedTitle,
              description: `Plan and track work for ${trimmedTitle}.`,
              updatedAt: timestamp,
            }
          : currentBoard,
      ),
    }));
  }, []);

  const deleteBoard = useCallback(
    (boardId: string) => {
      setCollection((currentCollection) => {
        const remainingBoards = currentCollection.boards.filter(
          (currentBoard) => currentBoard.id !== boardId,
        );

        if (remainingBoards.length === 0) {
          const replacementBoard = createBlankBoard("Product Launch Sprint");

          return {
            activeBoardId: replacementBoard.id,
            boards: [replacementBoard],
          };
        }

        return {
          activeBoardId:
            currentCollection.activeBoardId === boardId
              ? remainingBoards[0].id
              : currentCollection.activeBoardId,
          boards: remainingBoards,
        };
      });
    },
    [],
  );

  const switchBoard = useCallback((boardId: string) => {
    setCollection((currentCollection) => {
      const boardExists = currentCollection.boards.some(
        (currentBoard) => currentBoard.id === boardId,
      );

      if (!boardExists) {
        return currentCollection;
      }

      return {
        ...currentCollection,
        activeBoardId: boardId,
      };
    });
  }, []);

  const addTask = useCallback(
    (values: TaskFormValues) => {
      const taskId = createId("task");
      const timestamp = new Date().toISOString();
      const task: Task = {
        id: taskId,
        ...values,
        subtasks: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      updateActiveBoard((currentBoard) => ({
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
    },
    [updateActiveBoard],
  );

  const editTask = useCallback(
    (taskId: string, values: TaskFormValues) => {
      const timestamp = new Date().toISOString();

      updateActiveBoard((currentBoard) => {
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
    },
    [updateActiveBoard],
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      const timestamp = new Date().toISOString();

      updateActiveBoard((currentBoard) => {
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
    },
    [updateActiveBoard],
  );

  const moveTask = useCallback(
    (taskId: string, targetStatus: TaskStatus) => {
      const timestamp = new Date().toISOString();

      updateActiveBoard((currentBoard) => {
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
    },
    [updateActiveBoard],
  );

  const reorderTask = useCallback(
    (taskId: string, targetStatus: TaskStatus, targetTaskId?: string) => {
      const timestamp = new Date().toISOString();

      updateActiveBoard((currentBoard) => {
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
    [updateActiveBoard],
  );

  return {
    board,
    boards: collection.boards,
    activeBoardId: collection.activeBoardId,
    taskCount,
    addTask,
    editTask,
    deleteTask,
    moveTask,
    reorderTask,
    createBoard,
    renameBoard,
    deleteBoard,
    switchBoard,
  };
}
