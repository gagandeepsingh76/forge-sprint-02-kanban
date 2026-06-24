import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ThemeProvider } from "@/components/ThemeProvider";
import { initialBoard } from "@/data/initial-board";

const BOARD_COLLECTION_STORAGE_KEY = "forge-sprint-kanban-board-collection";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

vi.mock("@/lib/slack-client", () => ({
  notifySlack: vi.fn(),
}));

function renderBoard() {
  return render(
    <ThemeProvider>
      <KanbanBoard />
    </ThemeProvider>,
  );
}

describe("KanbanBoard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("renders the initial sprint board", () => {
    renderBoard();

    expect(
      screen.getByRole("heading", { name: "Product Launch Sprint" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Map onboarding workflow")).toBeInTheDocument();
    expect(screen.getByText("Build interactive board shell")).toBeInTheDocument();
    expect(screen.getByText("Initialize Next.js project")).toBeInTheDocument();
  });

  it("hydrates date and stored-board state without mismatch warnings", async () => {
    const storedBoard = {
      ...initialBoard,
      id: "board-stored",
      title: "Stored Sprint Board",
      description: "Persisted board loaded after hydration.",
      updatedAt: "2026-12-31T23:30:00.000Z",
    };
    const serverHtml = renderToString(
      <ThemeProvider>
        <KanbanBoard />
      </ThemeProvider>,
    );
    const container = document.createElement("div");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    let root: Root | null = null;

    window.localStorage.setItem(
      BOARD_COLLECTION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        collection: {
          activeBoardId: storedBoard.id,
          boards: [storedBoard],
        },
      }),
    );
    container.innerHTML = serverHtml;
    document.body.append(container);

    expect(container).toHaveTextContent("Last updated 24/06/2026");

    try {
      await act(async () => {
        root = hydrateRoot(
          container,
          <ThemeProvider>
            <KanbanBoard />
          </ThemeProvider>,
        );
      });

      const errorOutput = consoleError.mock.calls.flat().map(String).join("\n");

      expect(errorOutput).not.toMatch(/hydration|did not match/i);
      expect(
        await screen.findByRole("heading", { name: "Stored Sprint Board" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Last updated 31/12/2026")).toBeInTheDocument();
    } finally {
      await act(async () => {
        root?.unmount();
      });
    }
  });

  it("adds a task through the task modal", async () => {
    const user = userEvent.setup();
    renderBoard();

    await user.click(screen.getByRole("button", { name: /add task/i }));
    await user.type(screen.getByLabelText(/^title$/i), "Write route tests");
    await user.type(
      screen.getByLabelText(/^description$/i),
      "Cover AI, Slack, and auth route behavior.",
    );
    await user.selectOptions(screen.getByLabelText(/^priority$/i), "urgent");
    await user.click(screen.getByRole("button", { name: /create task/i }));

    expect(screen.getByText("Write route tests")).toBeInTheDocument();
    expect(
      screen.getByText("Cover AI, Slack, and auth route behavior."),
    ).toBeInTheDocument();
  });
});
