"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const isSignup = mode === "signup";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "");
    const parsedCredentials = isSignup
      ? registerSchema.safeParse({ name, email, password })
      : loginSchema.safeParse({ email, password });

    if (!parsedCredentials.success) {
      setError(parsedCredentials.error.issues[0]?.message ?? "Invalid input.");
      setIsPending(false);
      return;
    }

    if (isSignup) {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedCredentials.data),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(payload?.error ?? "Unable to create account.");
        setIsPending(false);
        return;
      }
    }

    const result = await signIn("credentials", {
      email: parsedCredentials.data.email,
      password: parsedCredentials.data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setIsPending(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold text-accent">Forge Sprint 02</p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">
            {isSignup ? "Create your workspace" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {isSignup
              ? "Start planning boards, tasks, and AI-assisted delivery."
              : "Sign in to continue to your protected dashboard."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isSignup ? (
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Name
              <input
                name="name"
                autoComplete="name"
                className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                required
              />
            </label>
          ) : null}

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              required
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Password
            <input
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              required
            />
          </label>

          {error ? (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? (
              <Loader2 size={17} className="animate-spin" />
            ) : isSignup ? (
              <UserPlus size={17} />
            ) : (
              <LogIn size={17} />
            )}
            {isSignup ? "Sign up" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {isSignup ? "Already have an account?" : "Need an account?"}{" "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-semibold text-accent"
          >
            {isSignup ? "Log in" : "Sign up"}
          </Link>
        </p>
      </div>
    </div>
  );
}
