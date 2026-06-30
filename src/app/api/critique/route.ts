import { NextResponse } from "next/server";
import { buildCritiquePrompt } from "@/lib/ai/prompts";
import { requestJsonFromOpenAI } from "@/lib/ai/openai";
import { parseCritiqueResponse, parseMatrixRequest } from "@/lib/ai/schemas";
import type { MatrixRequest } from "@/lib/ai/schemas";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function aiFailureStatus(message: string) {
  return message.includes("OPENAI_API_KEY") ? 503 : 500;
}

export async function POST(request: Request) {
  let input: MatrixRequest;
  try {
    input = parseMatrixRequest(await request.json());
  } catch (error) {
    return NextResponse.json(
      { error: errorMessage(error, "Invalid pixel matrix request.") },
      { status: 400 },
    );
  }

  let raw;
  try {
    raw = await requestJsonFromOpenAI(buildCritiquePrompt(input));
  } catch (error) {
    const message = errorMessage(error, "Unable to generate critique.");
    return NextResponse.json({ error: message }, { status: aiFailureStatus(message) });
  }

  try {
    return NextResponse.json(parseCritiqueResponse(input.width, input.height, raw));
  } catch (error) {
    return NextResponse.json(
      { error: errorMessage(error, "AI critique response was invalid.") },
      { status: 502 },
    );
  }
}
