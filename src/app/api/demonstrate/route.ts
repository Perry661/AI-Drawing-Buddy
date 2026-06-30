import { NextResponse } from "next/server";
import { buildDemonstrationPrompt } from "@/lib/ai/prompts";
import { getAIErrorResponse, requestJsonFromOpenAI } from "@/lib/ai/openai";
import { validateDemonstrationPalette } from "@/lib/ai/palette";
import { aiRateLimiter, getClientIp } from "@/lib/ai/rateLimit";
import {
  parseDemonstrationResponse,
  parseMatrixRequest,
  SuggestionSchema,
  validateSuggestionTargetBounds,
} from "@/lib/ai/schemas";
import type { MatrixRequest, Suggestion } from "@/lib/ai/schemas";

function readMatrixFields(body: Record<string, unknown>) {
  return {
    width: body.width,
    height: body.height,
    pixels: body.pixels,
    palette: body.palette,
    title: body.title,
    intent: body.intent,
  };
}

export async function POST(request: Request) {
  const rateLimit = aiRateLimiter.check(getClientIp(request.headers));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many AI requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) },
      },
    );
  }

  let input: MatrixRequest;
  let suggestion: Suggestion;
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Invalid demonstration request.");
    }

    input = parseMatrixRequest(readMatrixFields(body as Record<string, unknown>));
    suggestion = SuggestionSchema.parse((body as Record<string, unknown>).suggestion);
    validateSuggestionTargetBounds(input.width, input.height, suggestion);
  } catch (error) {
    console.error("Invalid demonstration payload.", error);
    return NextResponse.json({ error: "Invalid revision request." }, { status: 400 });
  }

  let raw;
  try {
    raw = await requestJsonFromOpenAI(buildDemonstrationPrompt(input, suggestion));
  } catch (error) {
    console.error("Unable to generate AI demonstration.", error);
    const response = getAIErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.status });
  }

  try {
    const demonstration = parseDemonstrationResponse(input.width, input.height, raw);
    if (!validateDemonstrationPalette(input, demonstration.pixels)) {
      throw new Error("AI demonstration response used colors outside the allowed palette.");
    }
    return NextResponse.json(demonstration);
  } catch (error) {
    console.error("AI demonstration response failed validation.", error);
    return NextResponse.json({ error: "AI returned an invalid response." }, { status: 502 });
  }
}
