import { getServerSession } from "next-auth";
import { prioritizeTasksJsonSchema } from "@/lib/ai-json-schemas";
import { authOptions } from "@/lib/auth";
import { GeminiConfigurationError, callGeminiJson } from "@/lib/gemini";
import {
  prioritizeTasksRequestSchema,
  prioritizeTasksResponseSchema,
} from "@/lib/validations/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = prioritizeTasksRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json(
      { error: "Provide at least one task to prioritize." },
      { status: 400 },
    );
  }

  try {
    const result = await callGeminiJson({
      jsonSchema: prioritizeTasksJsonSchema,
      responseSchema: prioritizeTasksResponseSchema,
      prompt: [
        "Prioritize these Kanban tasks for a delivery team.",
        "Return a matching task list with priority, rationale, and suggestedDueDate when useful.",
        `Project goal: ${parsedBody.data.projectGoal ?? "Not provided."}`,
        `Tasks: ${JSON.stringify(parsedBody.data.tasks)}`,
      ].join("\n"),
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof GeminiConfigurationError) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    return Response.json(
      { error: "Unable to prioritize tasks right now." },
      { status: 502 },
    );
  }
}
