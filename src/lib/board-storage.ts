import type { Board } from "@/types/kanban";

const BOARD_STORAGE_KEY = "forge-sprint-kanban-board";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isBoard(value: unknown): value is Board {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Board>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    Array.isArray(candidate.columns) &&
    typeof candidate.tasks === "object" &&
    candidate.tasks !== null
  );
}

export function saveBoard(board: Board) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(board));
}

export function loadBoard() {
  if (!canUseStorage()) {
    return null;
  }

  const storedBoard = window.localStorage.getItem(BOARD_STORAGE_KEY);

  if (!storedBoard) {
    return null;
  }

  try {
    const parsedBoard: unknown = JSON.parse(storedBoard);
    return isBoard(parsedBoard) ? parsedBoard : null;
  } catch {
    return null;
  }
}
