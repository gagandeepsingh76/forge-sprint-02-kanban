"use client";

import { FormEvent, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Board } from "@/types/kanban";

type BoardModalMode = "create" | "rename";

interface BoardSwitcherProps {
  boards: Board[];
  activeBoardId: string;
  onSwitchBoard: (boardId: string) => void;
  onCreateBoard: (title: string) => void;
  onRenameBoard: (boardId: string, title: string) => void;
  onDeleteBoard: (boardId: string) => void;
}

export function BoardSwitcher({
  boards,
  activeBoardId,
  onSwitchBoard,
  onCreateBoard,
  onRenameBoard,
  onDeleteBoard,
}: BoardSwitcherProps) {
  const [modalMode, setModalMode] = useState<BoardModalMode | null>(null);
  const [title, setTitle] = useState("");
  const activeBoard = useMemo(
    () => boards.find((board) => board.id === activeBoardId) ?? boards[0],
    [activeBoardId, boards],
  );

  const openCreateModal = () => {
    setTitle("");
    setModalMode("create");
  };

  const openRenameModal = () => {
    setTitle(activeBoard?.title ?? "");
    setModalMode("rename");
  };

  const closeModal = () => {
    setModalMode(null);
    setTitle("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (modalMode === "create") {
      onCreateBoard(title);
    }

    if (modalMode === "rename" && activeBoard) {
      onRenameBoard(activeBoard.id, title);
    }

    closeModal();
  };

  const handleDelete = () => {
    if (!activeBoard || boards.length <= 1) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete "${activeBoard.title}"? This only removes the local board copy.`,
    );

    if (shouldDelete) {
      onDeleteBoard(activeBoard.id);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={activeBoardId}
        onChange={(event) => onSwitchBoard(event.target.value)}
        aria-label="Switch board"
        className="h-10 min-w-48 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
      >
        {boards.map((board) => (
          <option key={board.id} value={board.id}>
            {board.title}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={openCreateModal}
        aria-label="Create board"
        className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-slate-600 transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent/40 dark:text-slate-200"
      >
        <Plus size={18} />
      </button>
      <button
        type="button"
        onClick={openRenameModal}
        aria-label="Rename board"
        className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-slate-600 transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent/40 dark:text-slate-200"
      >
        <Pencil size={17} />
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={boards.length <= 1}
        aria-label="Delete board"
        className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-rose-600 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-40 dark:text-rose-300 dark:hover:bg-rose-400/10"
      >
        <Trash2 size={17} />
      </button>

      {modalMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-2xl"
          >
            <h2 className="text-lg font-bold text-foreground">
              {modalMode === "create" ? "Create board" : "Rename board"}
            </h2>
            <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Board title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                required
                autoFocus
              />
            </label>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-surface-muted dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
