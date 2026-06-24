"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadBoardCollection,
  saveBoardCollection,
} from "@/lib/board-storage";
import { notifySlack } from "@/lib/slack-client";
import { boardTitleSchema, taskFormSchema } from "@/lib/validations/kanban";
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

const createInitialCollection = (initialBoard: Board): BoardCollection => ({
  activeBoardId: initialBoard.id,
  boards: [initialBoard],
});

export function useKanbanBoard(initialBoard: Board) {
  const [collection, setCollection] = useState<BoardCollection>(() =>
    createInitialCollection(initialBoard),
  );
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setCollection(loadBoardCollection(initialBoard));
      setIsStorageLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [initialBoard]);

  const board = useMemo(() => {
    return (
      collection.boards.find(
        (candidate) => candidate.id === collection.activeBoardId,
      ) ??
      collection.boards[0] ??
      initialBoard
    );
  }, [collection.activeBoardId, collection.boards, initialBoard]);

  const taskCount = useMemo(() => Object.keys(board.tasks).length, [board.tasks]);

  useEffect(() => {
    if (!isStorageLoaded) {
      return;
    }

    saveBoardCollection(collection);
  }, [collection, isStorageLoaded]);

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
    const parsedTitle = boardTitleSchema.safeParse(title);

    if (!parsedTitle.success) {
      return;
    }

    const boardToCreate = createBlankBoard(parsedTitle.data);

    setCollection((currentCollection) => ({
      activeBoardId: boardToCreate.id,
      boards: [...currentCollection.boards, boardToCreate],
    }));

    void notifySlack({
      event: "board.created",
      boardTitle: boardToCreate.title,
    });
  }, []);

  const renameBoard = useCallback((boardId: string, title: string) => {
    const parsedTitle = boardTitleSchema.safeParse(title);

    if (!parsedTitle.success) {
      return;
    }

    const timestamp = new Date().toISOString();

    setCollection((currentCollection) => ({
      ...currentCollection,
      boards: currentCollection.boards.map((currentBoard) =>
        currentBoard.id === boardId
          ? {
              ...currentBoard,
              title: parsedTitle.data,
              description: `Plan and track work for ${parsedTitle.data}.`,
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
      const parsedValues = taskFormSchema.safeParse(values);

      if (!parsedValues.success) {
        return;
      }

      const taskId = createId("task");
      const timestamp = new Date().toISOString();
      const task: Task = {
        id: taskId,
        ...parsedValues.data,
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
          column.id === parsedValues.data.status
            ? { ...column, taskIds: [...column.taskIds, taskId] }
            : column,
        ),
        updatedAt: timestamp,
      }));

      void notifySlack({
        event: "task.created",
        boardTitle: board.title,
        taskTitle: task.title,
        priority: task.priority,
      });

      if (task.assignee) {
        void notifySlack({
          event: "task.assigned",
          boardTitle: board.title,
          taskTitle: task.title,
          assignee: task.assignee,
          priority: task.priority,
        });
      }
    },
    [board.title, updateActiveBoard],
  );

  const editTask = useCallback(
    (taskId: string, values: TaskFormValues) => {
      const parsedValues = taskFormSchema.safeParse(values);

      if (!parsedValues.success) {
        return;
      }

      const timestamp = new Date().toISOString();

      updateActiveBoard((currentBoard) => {
        const existingTask = currentBoard.tasks[taskId];

        if (!existingTask) {
          return currentBoard;
        }

        const movedColumns =
          existingTask.status === parsedValues.data.status
            ? currentBoard.columns
            : currentBoard.columns.map((column) => {
                if (column.id === existingTask.status) {
                  return {
                    ...column,
                    taskIds: column.taskIds.filter((id) => id !== taskId),
                  };
                }

                if (column.id === parsedValues.data.status) {
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
              ...parsedValues.data,
              updatedAt: timestamp,
            },
          },
          columns: movedColumns,
          updatedAt: timestamp,
        };
      });

      const existingTask = board.tasks[taskId];

      if (
        existingTask?.status !== "done" &&
        parsedValues.data.status === "done"
      ) {
        void notifySlack({
          event: "task.completed",
          boardTitle: board.title,
          taskTitle: parsedValues.data.title,
          priority: parsedValues.data.priority,
        });
      }

      if (
        parsedValues.data.assignee &&
        parsedValues.data.assignee !== existingTask?.assignee
      ) {
        void notifySlack({
          event: "task.assigned",
          boardTitle: board.title,
          taskTitle: parsedValues.data.title,
          assignee: parsedValues.data.assignee,
          priority: parsedValues.data.priority,
        });
      }
    },
    [board.tasks, board.title, updateActiveBoard],
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

      const existingTask = board.tasks[taskId];

      if (existingTask?.status !== "done" && targetStatus === "done") {
        void notifySlack({
          event: "task.completed",
          boardTitle: board.title,
          taskTitle: existingTask.title,
          priority: existingTask.priority,
        });
      }
    },
    [board.tasks, board.title, updateActiveBoard],
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

      const existingTask = board.tasks[taskId];

      if (existingTask?.status !== "done" && targetStatus === "done") {
        void notifySlack({
          event: "task.completed",
          boardTitle: board.title,
          taskTitle: existingTask.title,
          priority: existingTask.priority,
        });
      }
    },
    [board.tasks, board.title, updateActiveBoard],
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
