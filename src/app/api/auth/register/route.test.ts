import { beforeEach, describe, expect, it, vi } from "vitest";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/auth/register/route";

vi.mock("bcryptjs", () => ({
  hash: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      create: vi.fn(),
    },
  },
}));

const hashMock = vi.mocked(hash);
const createUserMock = vi.mocked(prisma.user.create);

function registerRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("register route", () => {
  beforeEach(() => {
    hashMock.mockResolvedValue("hashed-password");
    createUserMock.mockResolvedValue({
      id: "user-1",
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
  });

  it("rejects invalid registration payloads", async () => {
    const response = await POST(
      registerRequest({
        name: "A",
        email: "not-an-email",
        password: "short",
      }),
    );

    expect(response.status).toBe(400);
    expect(createUserMock).not.toHaveBeenCalled();
  });

  it("hashes the password and creates a user", async () => {
    const response = await POST(
      registerRequest({
        name: "Ada Lovelace",
        email: "ADA@Example.com",
        password: "pass1234",
      }),
    );

    expect(response.status).toBe(201);
    expect(hashMock).toHaveBeenCalledWith("pass1234", 12);
    expect(createUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: "Ada Lovelace",
          email: "ada@example.com",
          passwordHash: "hashed-password",
        },
      }),
    );
    await expect(response.json()).resolves.toEqual({
      user: {
        id: "user-1",
        name: "Ada Lovelace",
        email: "ada@example.com",
      },
    });
  });
});
