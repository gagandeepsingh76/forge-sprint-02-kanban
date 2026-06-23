import { beforeEach, describe, expect, it } from "vitest";
import {
  loadBoardCollection,
  saveBoardCollection,
} from "@/lib/board-storage";
import { initialBoard } from "@/data/initial-board";

describe("board storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a valid board collection", () => {
    const collection = {
      activeBoardId: initialBoard.id,
      boards: [initialBoard],
    };

    saveBoardCollection(collection);

    expect(loadBoardCollection(initialBoard)).toEqual(collection);
  });

  it("falls back to the initial board when storage is corrupt", () => {
    window.localStorage.setItem(
      "forge-sprint-kanban-board-collection",
      JSON.stringify({ activeBoardId: "", boards: [] }),
    );

    expect(loadBoardCollection(initialBoard)).toEqual({
      activeBoardId: initialBoard.id,
      boards: [initialBoard],
    });
  });
});
