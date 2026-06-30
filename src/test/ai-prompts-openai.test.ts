import { describe, expect, it } from "vitest";
import { buildCritiquePrompt, buildDemonstrationPrompt } from "@/lib/ai/prompts";
import {
  InvalidAIJsonError,
  MissingOpenAIKeyError,
  OpenAIRequestError,
  getAIErrorResponse,
  parseOpenAIJson,
} from "@/lib/ai/openai";
import type { MatrixRequest, Suggestion } from "@/lib/ai/schemas";

const matrix: MatrixRequest = {
  width: 2,
  height: 2,
  pixels: ["#000", "#fff", "transparent", "#000"],
  palette: ["#000", "#fff"],
  title: "Tiny icon",
  intent: "A readable two-tone mark.",
};

const suggestion: Suggestion = {
  id: "s1",
  title: "Increase contrast",
  reasoning: "The focal pixel needs stronger separation.",
  target: { type: "pixel", x: 1, y: 0 },
  action: "increase_contrast",
};

describe("AI prompt builders", () => {
  it("includes critique response schema, allowed actions, target variants, bounds, and an example", () => {
    const prompt = buildCritiquePrompt(matrix);

    expect(prompt).toContain("summary");
    expect(prompt).toContain("suggestions");
    expect(prompt).toContain("id");
    expect(prompt).toContain("title");
    expect(prompt).toContain("reasoning");
    expect(prompt).toContain("target");
    expect(prompt).toContain("action");
    expect(prompt).toContain("pixel");
    expect(prompt).toContain("region");
    expect(prompt).toContain("global");
    expect(prompt).toContain("x must be 0 through 1");
    expect(prompt).toContain("y must be 0 through 1");
    expect(prompt).toContain("darken");
    expect(prompt).toContain("lighten");
    expect(prompt).toContain("remove");
    expect(prompt).toContain("add_highlight");
    expect(prompt).toContain("increase_contrast");
    expect(prompt).toContain("simplify_shape");
    expect(prompt).toContain("shift_hue");
    expect(prompt).toContain("A-Z, a-z, 0-9, underscore, or hyphen");
    expect(prompt).toContain("Valid example");
  });

  it("includes demonstration response schema, exact pixel count, and palette-only constraints", () => {
    const prompt = buildDemonstrationPrompt(matrix, suggestion);

    expect(prompt).toContain("label");
    expect(prompt).toContain("explanation");
    expect(prompt).toContain("pixels");
    expect(prompt).toContain("exactly 4 pixels");
    expect(prompt).toContain("Only use colors from this allowed color set");
    expect(prompt).toContain("#000");
    expect(prompt).toContain("#fff");
    expect(prompt).toContain("transparent");
    expect(prompt).toContain("Valid example");
  });
});

describe("OpenAI helper errors", () => {
  it("wraps malformed model JSON in a typed invalid response error", () => {
    expect(() => parseOpenAIJson("{not json")).toThrow(InvalidAIJsonError);
  });

  it("maps typed AI errors to stable client responses", () => {
    expect(getAIErrorResponse(new MissingOpenAIKeyError()).message).toBe("AI service is not configured.");
    expect(getAIErrorResponse(new MissingOpenAIKeyError()).status).toBe(503);

    expect(getAIErrorResponse(new InvalidAIJsonError())).toEqual({
      message: "AI returned an invalid response.",
      status: 502,
    });

    expect(getAIErrorResponse(new OpenAIRequestError("provider-specific details"))).toEqual({
      message: "AI service unavailable.",
      status: 500,
    });
  });
});
