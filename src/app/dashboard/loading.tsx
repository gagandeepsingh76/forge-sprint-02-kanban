export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-surface px-4 py-4 md:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-surface-muted" />
            <div className="h-8 w-64 animate-pulse rounded bg-surface-muted" />
          </div>
          <div className="hidden gap-3 md:flex">
            <div className="h-10 w-32 animate-pulse rounded-lg bg-surface-muted" />
            <div className="h-10 w-10 animate-pulse rounded-lg bg-surface-muted" />
            <div className="h-10 w-28 animate-pulse rounded-lg bg-surface-muted" />
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
        <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
          <div className="h-80 animate-pulse rounded-lg border border-border bg-surface" />
          <div className="grid gap-4 xl:grid-cols-3">
            {["todo", "progress", "done"].map((column) => (
              <div
                key={column}
                className="min-h-[28rem] animate-pulse rounded-lg border border-border bg-surface-muted"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
