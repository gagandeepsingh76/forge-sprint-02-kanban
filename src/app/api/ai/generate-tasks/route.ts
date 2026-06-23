import { getServerSession } from "next-auth";
import { GeminiConfigurationError, callGeminiJson } from "@/lib/gemini";
import { authOptions } from "@/lib/auth";
import { apiOk } from "@/lib/api-response";
import { generatedTasksJsonSchema } from "@/lib/ai-json-schemas";
import {
  HttpError,
  parseJsonBody,
  withRouteHandler,
} from "@/lib/route-handler";
import {
  generateTasksRequestSchema,
  generateTasksResponseSchema,
} from "@/lib/validations/ai";

export const runtime = "nodejs";

export const POST = withRouteHandler("ai.generate_tasks", async (request) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new HttpError(401, "Unauthorized", "UNAUTHORIZED");
  }

  const { projectDescription, boardTitle, count } = await parseJsonBody(
    request,
    generateTasksRequestSchema,
    "Provide a project description with at least 20 characters.",
  );

  try {
    const result = await callGeminiJson({
      jsonSchema: generatedTasksJsonSchema,
      responseSchema: generateTasksResponseSchema,
      prompt: [
        "Generate production-ready Kanban tasks for a software project.",
        `Board: ${boardTitle ?? "Untitled board"}.`,
        `Return exactly ${count} tasks.`,
        "Each task must include a practical title, description, priority, optional assignee, optional dueDate, and subtasks.",
        "Due dates should be realistic ISO dates in YYYY-MM-DD format when enough information is available.",
        `Project description: ${projectDescription}`,
      ].join("\n"),
    });

    return apiOk(result);
  } catch (error) {
    if (error instanceof GeminiConfigurationError) {
      throw new HttpError(503, error.message, "GEMINI_NOT_CONFIGURED");
    }

    throw new HttpError(
      502,
      "Unable to generate tasks right now.",
      "GEMINI_REQUEST_FAILED",
    );
  }
});
