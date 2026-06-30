import { describe, expect, it } from "vitest";
import {
  createPixelMatrix,
  floodFill,
  getPixel,
  serializeMatrix,
  setPixel,
  validatePixelCount,
} from "@/lib/pixel/matrix";

describe("pixel matrix helpers", () => {
  it("creates an empty canvas with transparent pixels", () => {
    const matrix = createPixelMatrix(3, 2);
    expect(matrix.width).toBe(3);
    expect(matrix.height).toBe(2);
    expect(matrix.pixels).toEqual([
      "transparent",
      "transparent",
      "transparent",
      "transparent",
      "transparent",
      "transparent",
    ]);
  });

  it("updates one pixel without mutating the original matrix", () => {
    const matrix = createPixelMatrix(2, 2);
    const updated = setPixel(matrix, 1, 0, "#ff0000");
    expect(getPixel(updated, 1, 0)).toBe("#ff0000");
    expect(getPixel(matrix, 1, 0)).toBe("transparent");
  });

  it("flood fills a contiguous color region", () => {
    const matrix = {
      width: 3,
      height: 3,
      pixels: [
        "#111",
        "#111",
        "#222",
        "#111",
        "#222",
        "#222",
        "#111",
        "#111",
        "#222",
      ],
    };
    const filled = floodFill(matrix, 0, 0, "#999");
    expect(filled.pixels).toEqual([
      "#999",
      "#999",
      "#222",
      "#999",
      "#222",
      "#222",
      "#999",
      "#999",
      "#222",
    ]);
  });

  it("serializes and restores a matrix", () => {
    const matrix = setPixel(createPixelMatrix(2, 1), 0, 0, "#123456");
    expect(serializeMatrix(matrix)).toEqual({
      width: 2,
      height: 1,
      pixels: ["#123456", "transparent"],
    });
  });

  it("validates exact pixel count", () => {
    expect(validatePixelCount(2, 2, ["a", "b", "c", "d"])).toBe(true);
    expect(validatePixelCount(2, 2, ["a", "b", "c"])).toBe(false);
  });
});
