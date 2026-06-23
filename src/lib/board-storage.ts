import type { Board, BoardCollection } from "@/types/kanban";

const BOARD_STORAGE_KEY = "forge-sprint-kanban-board";
const BOARD_COLLECTION_STORAGE_KEY = "forge-sprint-kanban-board-collection";
const STORAGE_VERSION = 2;

interface VersionedBoardPayload {
  version: number;
  board: Board;
}

interface VersionedBoardCollectionPayload {
  version: number;
  collection: BoardCollection;
}

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

function isBoardCollection(value: unknown): value is BoardCollection {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<BoardCollection>;

  return (
    typeof candidate.activeBoardId === "string" &&
    Array.isArray(candidate.boards) &&
    candidate.boards.every(isBoard)
  );
}

function isVersionedBoardPayload(
  value: unknown,
): value is VersionedBoardPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<VersionedBoardPayload>;

  return typeof candidate.version === "number" && isBoard(candidate.board);
}

function isVersionedBoardCollectionPayload(
  value: unknown,
): value is VersionedBoardCollectionPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<VersionedBoardCollectionPayload>;

  return (
    typeof candidate.version === "number" &&
    isBoardCollection(candidate.collection)
  );
}

export function saveBoard(board: Board) {
  if (!canUseStorage()) {
    return;
  }

  const payload: VersionedBoardPayload = {
    version: STORAGE_VERSION,
    board,
  };

  window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(payload));
}

export function saveBoardCollection(collection: BoardCollection) {
  if (!canUseStorage()) {
    return;
  }

  const payload: VersionedBoardCollectionPayload = {
    version: STORAGE_VERSION,
    collection,
  };

  window.localStorage.setItem(BOARD_COLLECTION_STORAGE_KEY, JSON.stringify(payload));
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

    if (isVersionedBoardPayload(parsedBoard)) {
      return parsedBoard.board;
    }

    return isBoard(parsedBoard) ? parsedBoard : null;
  } catch {
    return null;
  }
}

export function loadBoardCollection(initialBoard: Board): BoardCollection {
  if (!canUseStorage()) {
    return {
      activeBoardId: initialBoard.id,
      boards: [initialBoard],
    };
  }

  const storedCollection = window.localStorage.getItem(
    BOARD_COLLECTION_STORAGE_KEY,
  );

  if (storedCollection) {
    try {
      const parsedCollection: unknown = JSON.parse(storedCollection);

      if (
        isVersionedBoardCollectionPayload(parsedCollection) &&
        parsedCollection.collection.boards.length > 0
      ) {
        return parsedCollection.collection;
      }

      if (
        isBoardCollection(parsedCollection) &&
        parsedCollection.boards.length > 0
      ) {
        return parsedCollection;
      }
    } catch {
      window.localStorage.removeItem(BOARD_COLLECTION_STORAGE_KEY);
    }
  }

  const legacyBoard = loadBoard();

  return {
    activeBoardId: legacyBoard?.id ?? initialBoard.id,
    boards: [legacyBoard ?? initialBoard],
  };
}
