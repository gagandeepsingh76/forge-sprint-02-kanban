import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiAccepted, apiOk } from "@/lib/api-response";
import {
  HttpError,
  parseJsonBody,
  withRouteHandler,
} from "@/lib/route-handler";
import { sendSlackNotification } from "@/lib/slack";
import { slackNotificationSchema } from "@/lib/validations/slack";

export const runtime = "nodejs";

export const POST = withRouteHandler("slack.webhook", async (request) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new HttpError(401, "Unauthorized", "UNAUTHORIZED");
  }

  const body = await parseJsonBody(
    request,
    slackNotificationSchema,
    "Provide a valid Slack notification payload.",
  );

  try {
    const result = await sendSlackNotification(body);
    return result.skipped ? apiAccepted(result) : apiOk(result);
  } catch {
    throw new HttpError(
      502,
      "Unable to deliver Slack notification.",
      "SLACK_DELIVERY_FAILED",
    );
  }
});
