import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/auth/AuthForm";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
}));

vi.mock("next-auth/react", () => ({
  signIn: mocks.signIn,
}));

describe("AuthForm", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.refresh.mockReset();
    mocks.signIn.mockReset();
    mocks.signIn.mockResolvedValue({ ok: true });
  });

  it("submits login credentials through NextAuth", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText(/^email$/i), "USER@Example.com ");
    await user.type(screen.getByLabelText(/^password$/i), "pass1234");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => {
      expect(mocks.signIn).toHaveBeenCalledWith("credentials", {
        email: "user@example.com",
        password: "pass1234",
        redirect: false,
      });
    });
    expect(mocks.push).toHaveBeenCalledWith("/dashboard");
  });

  it("creates an account before signing in during signup", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ user: { id: "user-1" } }), {
        status: 201,
      }),
    );
    globalThis.fetch = fetchMock;
    const user = userEvent.setup();

    render(<AuthForm mode="signup" />);

    await user.type(screen.getByLabelText(/^name$/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/^email$/i), "ADA@Example.com");
    await user.type(screen.getByLabelText(/^password$/i), "pass1234");
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/register",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "pass1234",
    });
    expect(mocks.signIn).toHaveBeenCalledWith("credentials", {
      email: "ada@example.com",
      password: "pass1234",
      redirect: false,
    });
  });
});
