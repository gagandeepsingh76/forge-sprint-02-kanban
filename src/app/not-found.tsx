import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase text-accent">404</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          This workspace route does not exist.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
        >
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
