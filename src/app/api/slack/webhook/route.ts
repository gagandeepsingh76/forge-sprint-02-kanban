import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendSlackNotification } from "@/lib/slack";
import { slackNotificationSchema } from "@/lib/validations/slack";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = slackNotificationSchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json(
      { error: "Provide a valid Slack notification payload." },
      { status: 400 },
    );
  }

  try {
    const result = await sendSlackNotification(parsedBody.data);
    return Response.json(result, { status: result.skipped ? 202 : 200 });
  } catch {
    return Response.json(
      { error: "Unable to deliver Slack notification." },
      { status: 502 },
    );
  }
}
