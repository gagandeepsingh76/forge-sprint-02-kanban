import { getServerSession } from "next-auth";
import { prioritizeTasksJsonSchema } from "@/lib/ai-json-schemas";
import { authOptions } from "@/lib/auth";
import { apiOk } from "@/lib/api-response";
import { GeminiConfigurationError, callGeminiJson } from "@/lib/gemini";
import {
  HttpError,
  parseJsonBody,
  withRouteHandler,
} from "@/lib/route-handler";
import {
  prioritizeTasksRequestSchema,
  prioritizeTasksResponseSchema,
} from "@/lib/validations/ai";

export const runtime = "nodejs";

export const POST = withRouteHandler("ai.prioritize", async (request) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new HttpError(401, "Unauthorized", "UNAUTHORIZED");
  }

  const body = await parseJsonBody(
    request,
    prioritizeTasksRequestSchema,
    "Provide at least one task to prioritize.",
  );

  try {
    const result = await callGeminiJson({
      jsonSchema: prioritizeTasksJsonSchema,
      responseSchema: prioritizeTasksResponseSchema,
      prompt: [
        "Prioritize these Kanban tasks for a delivery team.",
        "Return a matching task list with priority, rationale, and suggestedDueDate when useful.",
        `Project goal: ${body.projectGoal ?? "Not provided."}`,
        `Tasks: ${JSON.stringify(body.tasks)}`,
      ].join("\n"),
    });

    return apiOk(result);
  } catch (error) {
    if (error instanceof GeminiConfigurationError) {
      throw new HttpError(503, error.message, "GEMINI_NOT_CONFIGURED");
    }

    throw new HttpError(
      502,
      "Unable to prioritize tasks right now.",
      "GEMINI_REQUEST_FAILED",
    );
  }
});
