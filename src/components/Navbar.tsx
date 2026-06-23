"use client";

interface NavbarProps {
  boardTitle: string;
  taskCount: number;
  onAddTask: () => void;
}

export function Navbar({ boardTitle, taskCount, onAddTask }: NavbarProps) {
  return (
    <header className="border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Forge Sprint 02</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
            {boardTitle}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">
            {taskCount} tasks
          </div>
          <button
            type="button"
            onClick={onAddTask}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Add Task
          </button>
        </div>
      </div>
    </header>
  );
}
