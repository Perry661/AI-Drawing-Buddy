import { NextResponse } from "next/server";
import { buildDemonstrationPrompt } from "@/lib/ai/prompts";
import { requestJsonFromOpenAI } from "@/lib/ai/openai";
import {
  parseCritiqueResponse,
  parseDemonstrationResponse,
  parseMatrixRequest,
  SuggestionSchema,
} from "@/lib/ai/schemas";
import type { MatrixRequest, Suggestion } from "@/lib/ai/schemas";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function aiFailureStatus(message: string) {
  return message.includes("OPENAI_API_KEY") ? 503 : 500;
}

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
  let input: MatrixRequest;
  let suggestion: Suggestion;
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Invalid demonstration request.");
    }

    input = parseMatrixRequest(readMatrixFields(body as Record<string, unknown>));
    suggestion = SuggestionSchema.parse((body as Record<string, unknown>).suggestion);
    parseCritiqueResponse(input.width, input.height, {
      summary: "Selected suggestion.",
      suggestions: [suggestion],
    });
  } catch (error) {
    return NextResponse.json(
      { error: errorMessage(error, "Invalid demonstration request.") },
      { status: 400 },
    );
  }

  let raw;
  try {
    raw = await requestJsonFromOpenAI(buildDemonstrationPrompt(input, suggestion));
  } catch (error) {
    const message = errorMessage(error, "Unable to generate revision.");
    return NextResponse.json({ error: message }, { status: aiFailureStatus(message) });
  }

  try {
    return NextResponse.json(parseDemonstrationResponse(input.width, input.height, raw));
  } catch (error) {
    return NextResponse.json(
      { error: errorMessage(error, "AI revision response was invalid.") },
      { status: 502 },
    );
  }
}
