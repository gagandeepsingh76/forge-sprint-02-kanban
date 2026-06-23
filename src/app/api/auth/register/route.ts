import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsedBody = registerSchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json(
      { error: "Please provide a valid name, email, and password." },
      { status: 400 },
    );
  }

  try {
    const passwordHash = await hash(parsedBody.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: parsedBody.data.name,
        email: parsedBody.data.email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return Response.json({ user }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    return Response.json(
      { error: "Unable to create account right now." },
      { status: 500 },
    );
  }
}
