import { NextResponse } from "next/server";
import { buildCritiquePrompt } from "@/lib/ai/prompts";
import { getAIErrorResponse, requestJsonFromOpenAI } from "@/lib/ai/openai";
import { aiRateLimiter, getClientIp } from "@/lib/ai/rateLimit";
import { parseCritiqueResponse, parseMatrixRequest } from "@/lib/ai/schemas";
import type { MatrixRequest } from "@/lib/ai/schemas";

export async function POST(request: Request) {
  let input: MatrixRequest;
  try {
    input = parseMatrixRequest(await request.json());
  } catch (error) {
    console.error("Invalid critique payload.", error);
    return NextResponse.json({ error: "Invalid artwork payload." }, { status: 400 });
  }

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

  let raw;
  try {
    raw = await requestJsonFromOpenAI(buildCritiquePrompt(input));
  } catch (error) {
    console.error("Unable to generate AI critique.", error);
    const response = getAIErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.status });
  }

  try {
    return NextResponse.json(parseCritiqueResponse(input.width, input.height, raw));
  } catch (error) {
    console.error("AI critique response failed validation.", error);
    return NextResponse.json({ error: "AI returned an invalid response." }, { status: 502 });
  }
}
