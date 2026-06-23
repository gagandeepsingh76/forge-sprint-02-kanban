import "server-only";

import { z } from "zod";

const GEMINI_INTERACTIONS_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

interface GeminiJsonRequest<TSchema extends z.ZodType> {
  prompt: string;
  jsonSchema: Record<string, unknown>;
  responseSchema: TSchema;
}

interface GeminiInteractionResponse {
  output_text?: string;
}

export class GeminiConfigurationError extends Error {
  constructor() {
    super("GEMINI_API_KEY is not configured.");
  }
}

export async function callGeminiJson<TSchema extends z.ZodType>({
  prompt,
  jsonSchema,
  responseSchema,
}: GeminiJsonRequest<TSchema>): Promise<z.infer<TSchema>> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new GeminiConfigurationError();
  }

  const response = await fetch(GEMINI_INTERACTIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash",
      input: prompt,
      store: false,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: jsonSchema,
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Gemini request failed: ${message}`);
  }

  const payload = (await response.json()) as GeminiInteractionResponse;

  if (!payload.output_text) {
    throw new Error("Gemini returned an empty response.");
  }

  const parsedJson: unknown = JSON.parse(payload.output_text);
  return responseSchema.parse(parsedJson);
}
