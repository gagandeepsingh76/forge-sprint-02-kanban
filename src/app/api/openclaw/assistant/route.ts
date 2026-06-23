import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiOk } from "@/lib/api-response";
import {
  OpenClawConfigurationError,
  callOpenClawAssistant,
} from "@/lib/openclaw";
import {
  HttpError,
  parseJsonBody,
  withRouteHandler,
} from "@/lib/route-handler";
import { openClawAssistantRequestSchema } from "@/lib/validations/openclaw";

export const runtime = "nodejs";

export const POST = withRouteHandler("openclaw.assistant", async (request) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new HttpError(401, "Unauthorized", "UNAUTHORIZED");
  }

  const body = await parseJsonBody(
    request,
    openClawAssistantRequestSchema,
    "Provide a valid OpenClaw assistant request.",
  );

  try {
    const result = await callOpenClawAssistant({
      ...body,
      userId: session.user.id,
    });

    return apiOk(result);
  } catch (error) {
    if (error instanceof OpenClawConfigurationError) {
      throw new HttpError(503, error.message, "OPENCLAW_NOT_CONFIGURED");
    }

    throw new HttpError(
      502,
      "Unable to reach OpenClaw assistant.",
      "OPENCLAW_REQUEST_FAILED",
    );
  }
});
