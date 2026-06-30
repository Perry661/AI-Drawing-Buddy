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

  it("rejects invalid canvas dimensions", () => {
    expect(() => createPixelMatrix(0, 2)).toThrow(
      "Pixel matrix dimensions must be positive integers",
    );
    expect(() => createPixelMatrix(2, 0)).toThrow(
      "Pixel matrix dimensions must be positive integers",
    );
    expect(() => createPixelMatrix(-1, 2)).toThrow(
      "Pixel matrix dimensions must be positive integers",
    );
    expect(() => createPixelMatrix(2, -1)).toThrow(
      "Pixel matrix dimensions must be positive integers",
    );
    expect(() => createPixelMatrix(1.5, 2)).toThrow(
      "Pixel matrix dimensions must be positive integers",
    );
    expect(() => createPixelMatrix(2, 1.5)).toThrow(
      "Pixel matrix dimensions must be positive integers",
    );
  });

  it("updates one pixel without mutating the original matrix", () => {
    const matrix = createPixelMatrix(2, 2);
    const updated = setPixel(matrix, 1, 0, "#ff0000");
    expect(getPixel(updated, 1, 0)).toBe("#ff0000");
    expect(getPixel(matrix, 1, 0)).toBe("transparent");
  });

  it("rejects invalid pixel coordinates", () => {
    const matrix = createPixelMatrix(2, 2);
    expect(() => getPixel(matrix, 0.5, 0)).toThrow(
      "Pixel coordinate out of bounds: 0.5, 0",
    );
    expect(() => getPixel(matrix, 0, 0.5)).toThrow(
      "Pixel coordinate out of bounds: 0, 0.5",
    );
    expect(() => getPixel(matrix, -1, 0)).toThrow(
      "Pixel coordinate out of bounds: -1, 0",
    );
    expect(() => getPixel(matrix, 0, -1)).toThrow(
      "Pixel coordinate out of bounds: 0, -1",
    );
    expect(() => getPixel(matrix, 2, 0)).toThrow(
      "Pixel coordinate out of bounds: 2, 0",
    );
    expect(() => getPixel(matrix, 0, 2)).toThrow(
      "Pixel coordinate out of bounds: 0, 2",
    );
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
    expect(matrix.pixels).toEqual([
      "#111",
      "#111",
      "#222",
      "#111",
      "#222",
      "#222",
      "#111",
      "#111",
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
    expect(validatePixelCount(2, 2, ["a", "b", "c", "d", "e"])).toBe(false);
    expect(validatePixelCount(0, 2, [])).toBe(false);
    expect(validatePixelCount(2, 0, [])).toBe(false);
    expect(validatePixelCount(-1, 2, ["a", "b"])).toBe(false);
    expect(validatePixelCount(2, -1, ["a", "b"])).toBe(false);
    expect(validatePixelCount(1.5, 2, ["a", "b", "c"])).toBe(false);
    expect(validatePixelCount(2, 1.5, ["a", "b", "c"])).toBe(false);
  });
});
