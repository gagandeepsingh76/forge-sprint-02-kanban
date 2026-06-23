import { describe, expect, it } from "vitest";
import {
  boardCollectionSchema,
  taskFormSchema,
} from "@/lib/validations/kanban";
import { initialBoard } from "@/data/initial-board";

describe("kanban validation", () => {
  it("normalizes task form values", () => {
    const parsed = taskFormSchema.parse({
      title: "  Write tests  ",
      description: "  Cover board behavior  ",
      priority: "high",
      dueDate: "",
      assignee: "  ",
      status: "todo",
    });

    expect(parsed).toEqual({
      title: "Write tests",
      description: "Cover board behavior",
      priority: "high",
      dueDate: undefined,
      assignee: undefined,
      status: "todo",
    });
  });

  it("accepts a complete board collection", () => {
    expect(
      boardCollectionSchema.safeParse({
        activeBoardId: initialBoard.id,
        boards: [initialBoard],
      }).success,
    ).toBe(true);
  });

  it("rejects empty board collections", () => {
    expect(
      boardCollectionSchema.safeParse({
        activeBoardId: "",
        boards: [],
      }).success,
    ).toBe(false);
  });
});
