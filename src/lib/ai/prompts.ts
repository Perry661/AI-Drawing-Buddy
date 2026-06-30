import type { MatrixRequest, Suggestion } from "./schemas";
import { getAllowedDemonstrationColors } from "./palette";

const suggestionActions = [
  "darken",
  "lighten",
  "remove",
  "add_highlight",
  "increase_contrast",
  "simplify_shape",
  "shift_hue",
];

export function buildCritiquePrompt(input: MatrixRequest) {
  const maxX = input.width - 1;
  const maxY = input.height - 1;
  const validCritiqueExample = {
    summary: "The silhouette is clear, but contrast and focus can improve.",
    suggestions: [
      {
        id: "s1",
        title: "Darken upper-left edge",
        reasoning: "A darker edge separates the focal shape from the background.",
        target: { type: "pixel", x: 0, y: 0 },
        action: "darken",
      },
      {
        id: "s2",
        title: "Simplify noisy corner",
        reasoning: "Reducing detail in the corner keeps attention on the main shape.",
        target: { type: "region", x: 0, y: 0, width: 1, height: 1 },
        action: "simplify_shape",
      },
      {
        id: "s3",
        title: "Increase global contrast",
        reasoning: "A broader contrast pass improves readability at small sizes.",
        target: { type: "global" },
        action: "increase_contrast",
      },
    ],
  };

  return [
    "You are a practical pixel-art director.",
    "Return strict JSON only.",
    "Give 3 to 5 concise, coordinate-aware suggestions.",
    "Focus on silhouette, contrast, readability, palette discipline, and focal point.",
    "Required JSON shape:",
    "{",
    '  "summary": "1 to 500 characters",',
    '  "suggestions": [',
    "    {",
    '      "id": "1 to 40 characters; only A-Z, a-z, 0-9, underscore, or hyphen",',
    '      "title": "1 to 80 characters",',
    '      "reasoning": "1 to 360 characters",',
    '      "target": { "type": "pixel", "x": 0, "y": 0 },',
    `      "action": "${suggestionActions[0]}"`,
    "    }",
    "  ]",
    "}",
    `Allowed actions: ${suggestionActions.join(", ")}.`,
    `Allowed target variants: pixel { type, x, y }, region { type, x, y, width, height }, or global { type }.`,
    `Coordinate bounds: x must be 0 through ${maxX}; y must be 0 through ${maxY}.`,
    "Region bounds: x + width must be no more than canvas width; y + height must be no more than canvas height.",
    "Global targets must not include coordinates.",
    `Valid example: ${JSON.stringify(validCritiqueExample)}`,
    `Canvas: ${input.width}x${input.height}`,
    `Palette: ${input.palette.join(", ")}`,
    `Pixels row-major: ${JSON.stringify(input.pixels)}`,
    input.title ? `Title: ${JSON.stringify(input.title)}` : "",
    input.intent ? `Artist intent: ${JSON.stringify(input.intent)}` : "",
  ].filter(Boolean).join("\n");
}

export function buildDemonstrationPrompt(input: MatrixRequest, suggestion: Suggestion) {
  const pixelCount = input.width * input.height;
  const colors = getAllowedDemonstrationColors(input);

  return [
    "You are revising a pixel-art matrix.",
    "Return strict JSON only.",
    "Required JSON shape:",
    "{",
    '  "label": "1 to 80 characters",',
    '  "explanation": "1 to 500 characters",',
    '  "pixels": ["row-major pixel colors"]',
    "}",
    `Preserve the exact canvas dimensions and return exactly ${pixelCount} pixels.`,
    "Make a focused revision based on the selected suggestion.",
    "Avoid a complete replacement unless the selected suggestion target is global.",
    `Only use colors from this allowed color set: ${colors.join(", ")}.`,
    "Use transparent only where the original uses empty space or where it is needed to preserve empty space.",
    `Valid example: {"label":"Focused revision","explanation":"Adjusted only the selected area for readability.","pixels":${JSON.stringify(input.pixels)}}`,
    `Canvas: ${input.width}x${input.height}`,
    `Palette: ${input.palette.join(", ")}`,
    `Original pixels row-major: ${JSON.stringify(input.pixels)}`,
    `Selected suggestion: ${JSON.stringify(suggestion)}`,
  ].join("\n");
}
