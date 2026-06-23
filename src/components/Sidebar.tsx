"use client";

import { Layers3, Plus, Target, TimerReset } from "lucide-react";
import type { Board } from "@/types/kanban";

interface SidebarProps {
  boards: Board[];
  activeBoardId: string;
  activeTaskCount: number;
  completedTaskCount: number;
  onSwitchBoard: (boardId: string) => void;
  onCreateBoard: (title: string) => void;
}

export function Sidebar({
  boards,
  activeBoardId,
  activeTaskCount,
  completedTaskCount,
  onSwitchBoard,
  onCreateBoard,
}: SidebarProps) {
  const handleCreateBoard = () => {
    const nextBoardTitle = `Sprint Board ${boards.length + 1}`;
    onCreateBoard(nextBoardTitle);
  };

  return (
    <aside className="rounded-lg border border-border bg-surface p-4 shadow-sm lg:sticky lg:top-28 lg:self-start">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">Workspace</p>
          <h2 className="mt-1 font-bold text-foreground">Boards</h2>
        </div>
        <button
          type="button"
          onClick={handleCreateBoard}
          aria-label="Create board"
          className="inline-flex size-9 items-center justify-center rounded-md border border-border text-slate-600 transition hover:bg-surface-muted dark:text-slate-200"
        >
          <Plus size={17} />
        </button>
      </div>

      <nav className="mt-4 grid gap-2" aria-label="Boards">
        {boards.map((board) => (
          <button
            key={board.id}
            type="button"
            onClick={() => onSwitchBoard(board.id)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold transition ${
              board.id === activeBoardId
                ? "bg-accent text-white"
                : "text-slate-600 hover:bg-surface-muted dark:text-slate-300"
            }`}
          >
            <Layers3 size={16} />
            <span className="min-w-0 flex-1 truncate">{board.title}</span>
          </button>
        ))}
      </nav>

      <div className="mt-5 grid gap-2 border-t border-border pt-4">
        <div className="flex items-center justify-between rounded-md bg-surface-muted px-3 py-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <TimerReset size={15} />
            Active
          </span>
          <span className="text-sm font-bold text-foreground">
            {activeTaskCount}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-md bg-surface-muted px-3 py-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <Target size={15} />
            Done
          </span>
          <span className="text-sm font-bold text-foreground">
            {completedTaskCount}
          </span>
        </div>
      </div>
    </aside>
  );
}
