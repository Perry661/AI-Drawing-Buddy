import type { PixelColor, PixelMatrix } from "./types";

export const TRANSPARENT: PixelColor = "transparent";

export function validatePixelCount(
  width: number,
  height: number,
  pixels: PixelColor[],
) {
  return (
    Number.isInteger(width) &&
    Number.isInteger(height) &&
    width > 0 &&
    height > 0 &&
    pixels.length === width * height
  );
}

export function createPixelMatrix(
  width: number,
  height: number,
  fill: PixelColor = TRANSPARENT,
): PixelMatrix {
  return {
    width,
    height,
    pixels: Array.from({ length: width * height }, () => fill),
  };
}

export function toIndex(matrix: PixelMatrix, x: number, y: number) {
  if (x < 0 || y < 0 || x >= matrix.width || y >= matrix.height) {
    throw new RangeError(`Pixel coordinate out of bounds: ${x}, ${y}`);
  }
  return y * matrix.width + x;
}

export function getPixel(matrix: PixelMatrix, x: number, y: number) {
  return matrix.pixels[toIndex(matrix, x, y)];
}

export function setPixel(
  matrix: PixelMatrix,
  x: number,
  y: number,
  color: PixelColor,
): PixelMatrix {
  const pixels = [...matrix.pixels];
  pixels[toIndex(matrix, x, y)] = color;
  return { ...matrix, pixels };
}

export function floodFill(
  matrix: PixelMatrix,
  x: number,
  y: number,
  color: PixelColor,
): PixelMatrix {
  const target = getPixel(matrix, x, y);
  if (target === color) return matrix;

  const pixels = [...matrix.pixels];
  const stack: Array<[number, number]> = [[x, y]];
  const seen = new Set<number>();

  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!;
    if (cx < 0 || cy < 0 || cx >= matrix.width || cy >= matrix.height) {
      continue;
    }
    const index = cy * matrix.width + cx;
    if (seen.has(index) || pixels[index] !== target) continue;
    seen.add(index);
    pixels[index] = color;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }

  return { ...matrix, pixels };
}

export function serializeMatrix(matrix: PixelMatrix): PixelMatrix {
  return { width: matrix.width, height: matrix.height, pixels: [...matrix.pixels] };
}
