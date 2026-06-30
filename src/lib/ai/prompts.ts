import type { MatrixRequest, Suggestion } from "./schemas";

const suggestionActions = [
  "darken",
  "lighten",
  "remove",
  "add_highlight",
  "increase_contrast",
  "simplify_shape",
  "shift_hue",
];

function allowedPixelColors(input: MatrixRequest) {
  const colors = new Set(input.palette);
  if (input.pixels.includes("transparent")) {
    colors.add("transparent");
  }
  return Array.from(colors);
}

export function buildCritiquePrompt(input: MatrixRequest) {
  const maxX = input.width - 1;
  const maxY = input.height - 1;

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
    'Valid example: {"summary":"The silhouette is clear, but contrast can improve.","suggestions":[{"id":"s1","title":"Darken upper-left edge","reasoning":"A darker edge separates the focal shape from the background.","target":{"type":"pixel","x":0,"y":0},"action":"darken"}]}',
    `Canvas: ${input.width}x${input.height}`,
    `Palette: ${input.palette.join(", ")}`,
    `Pixels row-major: ${JSON.stringify(input.pixels)}`,
    input.title ? `Title: ${input.title}` : "",
    input.intent ? `Artist intent: ${input.intent}` : "",
  ].filter(Boolean).join("\n");
}

export function buildDemonstrationPrompt(input: MatrixRequest, suggestion: Suggestion) {
  const pixelCount = input.width * input.height;
  const colors = allowedPixelColors(input);

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
    `Only use colors from this allowed color set: ${colors.join(", ")}.`,
    "Use transparent only where the original uses empty space or where it is needed to preserve empty space.",
    `Valid example: {"label":"Focused revision","explanation":"Adjusted only the selected area for readability.","pixels":${JSON.stringify(input.pixels)}}`,
    `Canvas: ${input.width}x${input.height}`,
    `Palette: ${input.palette.join(", ")}`,
    `Original pixels row-major: ${JSON.stringify(input.pixels)}`,
    `Selected suggestion: ${JSON.stringify(suggestion)}`,
  ].join("\n");
}
