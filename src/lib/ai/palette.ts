import type { MatrixRequest } from "./schemas";

function canonicalizeColor(color: string) {
  return color.startsWith("#") ? color.toLowerCase() : color;
}

export function getAllowedDemonstrationColors(input: MatrixRequest) {
  const colors = new Set(input.palette.map(canonicalizeColor));
  // Keep route validation aligned with the prompt: transparent is allowed for preserving empty space
  // only when the submitted artwork already contains empty pixels, or when it is explicitly in palette.
  if (input.pixels.includes("transparent")) {
    colors.add("transparent");
  }
  return Array.from(colors);
}

export function validateDemonstrationPalette(input: MatrixRequest, pixels: string[]) {
  const allowedColors = new Set(getAllowedDemonstrationColors(input));
  return pixels.every((pixel) => allowedColors.has(canonicalizeColor(pixel)));
}
