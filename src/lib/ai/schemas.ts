import { z } from "zod";

export const PixelColorSchema = z.string().min(1);

export const MatrixRequestSchema = z.object({
  width: z.number().int().positive().max(64),
  height: z.number().int().positive().max(64),
  pixels: z.array(PixelColorSchema).max(64 * 64),
  palette: z.array(z.string().min(1)).min(1).max(32),
  title: z.string().max(80).optional(),
  intent: z.string().max(240).optional(),
});

export const SuggestionActionSchema = z.enum([
  "darken",
  "lighten",
  "remove",
  "add_highlight",
  "increase_contrast",
  "simplify_shape",
  "shift_hue",
]);

export const SuggestionTargetSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("pixel"),
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
  }).strict(),
  z.object({
    type: z.literal("region"),
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }).strict(),
  z.object({
    type: z.literal("global"),
  }).strict(),
]);

export const SuggestionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(80),
  reasoning: z.string().min(1).max(360),
  target: SuggestionTargetSchema,
  action: SuggestionActionSchema,
});

export const CritiqueResponseSchema = z.object({
  summary: z.string().min(1).max(500),
  suggestions: z.array(SuggestionSchema).min(1).max(5),
});

export const DemonstrationResponseSchema = z.object({
  label: z.string().min(1).max(80),
  explanation: z.string().min(1).max(500),
  pixels: z.array(PixelColorSchema).max(64 * 64),
});

export type MatrixRequest = z.infer<typeof MatrixRequestSchema>;
export type CritiqueResponse = z.infer<typeof CritiqueResponseSchema>;
export type DemonstrationResponse = z.infer<typeof DemonstrationResponseSchema>;
export type Suggestion = z.infer<typeof SuggestionSchema>;

export function validateMatrixRequestPixels(input: MatrixRequest) {
  return input.pixels.length === input.width * input.height;
}

export function parseMatrixRequest(input: unknown) {
  const parsed = MatrixRequestSchema.parse(input);
  if (!validateMatrixRequestPixels(parsed)) {
    throw new Error("Matrix request pixel count must match width * height.");
  }
  return parsed;
}

export function parseCritiqueResponse(width: number, height: number, input: unknown) {
  z.number().int().positive().max(64).parse(width);
  z.number().int().positive().max(64).parse(height);

  const parsed = CritiqueResponseSchema.parse(input);
  const hasOutOfBoundsTarget = parsed.suggestions.some(({ target }) => {
    if (target.type === "global") {
      return false;
    }

    if (target.type === "pixel") {
      return target.x >= width || target.y >= height;
    }

    return target.x + target.width > width || target.y + target.height > height;
  });

  if (hasOutOfBoundsTarget) {
    throw new Error("Critique target must fit within the canvas.");
  }

  return parsed;
}

export function validateDemonstrationPixels(width: number, height: number, response: DemonstrationResponse) {
  return response.pixels.length === width * height;
}

export function parseDemonstrationResponse(width: number, height: number, input: unknown) {
  const parsed = DemonstrationResponseSchema.parse(input);
  if (!validateDemonstrationPixels(width, height, parsed)) {
    throw new Error("Demonstration response pixel count must match width * height.");
  }
  return parsed;
}
