import type { MatrixRequest, Suggestion } from "./schemas";

export function buildCritiquePrompt(input: MatrixRequest) {
  return [
    "You are a practical pixel-art director.",
    "Return strict JSON only.",
    "Give 3 to 5 concise, coordinate-aware suggestions.",
    "Focus on silhouette, contrast, readability, palette discipline, and focal point.",
    `Canvas: ${input.width}x${input.height}`,
    `Palette: ${input.palette.join(", ")}`,
    `Pixels row-major: ${JSON.stringify(input.pixels)}`,
    input.title ? `Title: ${input.title}` : "",
    input.intent ? `Artist intent: ${input.intent}` : "",
  ].filter(Boolean).join("\n");
}

export function buildDemonstrationPrompt(input: MatrixRequest, suggestion: Suggestion) {
  return [
    "You are revising a pixel-art matrix.",
    "Return strict JSON only with label, explanation, and pixels.",
    "Preserve the exact canvas dimensions and return exactly width * height pixels.",
    "Make a focused revision based on the selected suggestion.",
    "Use the supplied palette when practical. Use transparent only where the original uses empty space.",
    `Canvas: ${input.width}x${input.height}`,
    `Palette: ${input.palette.join(", ")}`,
    `Original pixels row-major: ${JSON.stringify(input.pixels)}`,
    `Selected suggestion: ${JSON.stringify(suggestion)}`,
  ].join("\n");
}
