"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "app.error_boundary",
        error: {
          name: error.name,
          message: error.message,
          digest: error.digest,
        },
      }),
    );
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase text-accent">
          Recovery
        </p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          The workspace hit an unexpected error. Try again to reload this view.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="mt-5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
