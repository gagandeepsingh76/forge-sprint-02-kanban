import { getServerSession } from "next-auth";
import { breakdownTaskJsonSchema } from "@/lib/ai-json-schemas";
import { authOptions } from "@/lib/auth";
import { GeminiConfigurationError, callGeminiJson } from "@/lib/gemini";
import {
  breakdownTaskRequestSchema,
  breakdownTaskResponseSchema,
} from "@/lib/validations/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = breakdownTaskRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json({ error: "Provide a valid task." }, { status: 400 });
  }

  const { taskTitle, taskDescription, desiredSubtasks } = parsedBody.data;

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

    return Response.json(result);
  } catch (error) {
    if (error instanceof GeminiConfigurationError) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    return Response.json(
      { error: "Unable to break down task right now." },
      { status: 502 },
    );
  }
}
