import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { apiCreated } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import {
  HttpError,
  parseJsonBody,
  withRouteHandler,
} from "@/lib/route-handler";
import { registerSchema } from "@/lib/validations/auth";

export const runtime = "nodejs";

export const POST = withRouteHandler("auth.register", async (request) => {
  const body = await parseJsonBody(
    request,
    registerSchema,
    "Please provide a valid name, email, and password.",
  );

  try {
    const passwordHash = await hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return apiCreated({ user });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new HttpError(
        409,
        "An account with this email already exists.",
        "ACCOUNT_EXISTS",
      );
    }

    throw new HttpError(
      500,
      "Unable to create account right now.",
      "ACCOUNT_CREATE_FAILED",
      undefined,
      error,
    );
  }
});
