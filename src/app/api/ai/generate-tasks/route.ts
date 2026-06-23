import { getServerSession } from "next-auth";
import { GeminiConfigurationError, callGeminiJson } from "@/lib/gemini";
import { authOptions } from "@/lib/auth";
import { generatedTasksJsonSchema } from "@/lib/ai-json-schemas";
import {
  generateTasksRequestSchema,
  generateTasksResponseSchema,
} from "@/lib/validations/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = generateTasksRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json(
      { error: "Provide a project description with at least 20 characters." },
      { status: 400 },
    );
  }

  const { projectDescription, boardTitle, count } = parsedBody.data;

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

    return Response.json(result);
  } catch (error) {
    if (error instanceof GeminiConfigurationError) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    return Response.json(
      { error: "Unable to generate tasks right now." },
      { status: 502 },
    );
  }
}
