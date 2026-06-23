import { getServerSession } from "next-auth";
import { breakdownTaskJsonSchema } from "@/lib/ai-json-schemas";
import { authOptions } from "@/lib/auth";
import { apiOk } from "@/lib/api-response";
import { GeminiConfigurationError, callGeminiJson } from "@/lib/gemini";
import {
  HttpError,
  parseJsonBody,
  withRouteHandler,
} from "@/lib/route-handler";
import {
  breakdownTaskRequestSchema,
  breakdownTaskResponseSchema,
} from "@/lib/validations/ai";

export const runtime = "nodejs";

export const POST = withRouteHandler("ai.breakdown_task", async (request) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new HttpError(401, "Unauthorized", "UNAUTHORIZED");
  }

  const { taskTitle, taskDescription, desiredSubtasks } = await parseJsonBody(
    request,
    breakdownTaskRequestSchema,
    "Provide a valid task.",
  );

  try {
    const result = await callGeminiJson({
      jsonSchema: breakdownTaskJsonSchema,
      responseSchema: breakdownTaskResponseSchema,
      prompt: [
        "Break this Kanban task into actionable subtasks for a sprint team.",
        `Return ${desiredSubtasks} subtasks.`,
        "Each subtask must include title, description, priority, and an optional dueDate.",
        `Task title: ${taskTitle}`,
        `Task description: ${taskDescription ?? "No description provided."}`,
      ].join("\n"),
    });

    return apiOk(result);
  } catch (error) {
    if (error instanceof GeminiConfigurationError) {
      throw new HttpError(503, error.message, "GEMINI_NOT_CONFIGURED");
    }

    throw new HttpError(
      502,
      "Unable to break down task right now.",
      "GEMINI_REQUEST_FAILED",
    );
  }
});
