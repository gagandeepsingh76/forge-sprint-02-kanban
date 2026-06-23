import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ThemeProvider } from "@/components/ThemeProvider";

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

  it("renders the initial sprint board", () => {
    renderBoard();

    expect(
      screen.getByRole("heading", { name: "Product Launch Sprint" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Map onboarding workflow")).toBeInTheDocument();
    expect(screen.getByText("Build interactive board shell")).toBeInTheDocument();
    expect(screen.getByText("Initialize Next.js project")).toBeInTheDocument();
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
