import { describe, expect, it } from "vitest";
import {
  CritiqueResponseSchema,
  DemonstrationResponseSchema,
  MatrixRequestSchema,
  parseCritiqueResponse,
  parseDemonstrationResponse,
  parseMatrixRequest,
  validateDemonstrationPixels,
} from "@/lib/ai/schemas";

describe("AI schemas", () => {
  it("accepts a valid critique response", () => {
    const parsed = CritiqueResponseSchema.parse({
      summary: "The silhouette reads clearly but needs stronger contrast.",
      suggestions: [
        {
          id: "s1",
          title: "Increase top-left contrast",
          reasoning: "A darker corner frames the subject.",
          target: { type: "region", x: 0, y: 0, width: 4, height: 4 },
          action: "darken",
        },
      ],
    });
    expect(parsed.suggestions[0].target.type).toBe("region");
  });

  it("rejects malformed critique responses", () => {
    expect(() => CritiqueResponseSchema.parse({ summary: "Missing suggestions" })).toThrow();
  });

  it("rejects pixel targets without x/y", () => {
    expect(() =>
      CritiqueResponseSchema.parse({
        summary: "Missing coordinates.",
        suggestions: [
          {
            id: "s1",
            title: "Fix one pixel",
            reasoning: "The target pixel needs to be explicit.",
            target: { type: "pixel" },
            action: "darken",
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects region targets without width/height", () => {
    expect(() =>
      CritiqueResponseSchema.parse({
        summary: "Missing region dimensions.",
        suggestions: [
          {
            id: "s1",
            title: "Fix a region",
            reasoning: "The target region needs explicit dimensions.",
            target: { type: "region", x: 0, y: 0 },
            action: "darken",
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects global targets with coordinates", () => {
    expect(() =>
      CritiqueResponseSchema.parse({
        summary: "Global targets should not include coordinates.",
        suggestions: [
          {
            id: "s1",
            title: "Adjust the whole image",
            reasoning: "Global changes should not point at a pixel.",
            target: { type: "global", x: 0, y: 0 },
            action: "increase_contrast",
          },
        ],
      }),
    ).toThrow();
  });

  it("accepts in-bounds parsed critique responses", () => {
    const parsed = parseCritiqueResponse(8, 8, {
      summary: "The silhouette reads clearly but needs stronger contrast.",
      suggestions: [
        {
          id: "s1",
          title: "Increase top-left contrast",
          reasoning: "A darker corner frames the subject.",
          target: { type: "pixel", x: 7, y: 7 },
          action: "darken",
        },
      ],
    });
    expect(parsed).toMatchObject({ summary: "The silhouette reads clearly but needs stronger contrast." });
  });

  it("rejects out-of-bounds parsed critique pixel targets", () => {
    expect(() =>
      parseCritiqueResponse(8, 8, {
        summary: "The target pixel is outside the canvas.",
        suggestions: [
          {
            id: "s1",
            title: "Fix one pixel",
            reasoning: "The target pixel must fit the canvas.",
            target: { type: "pixel", x: 8, y: 7 },
            action: "darken",
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects overflowing parsed critique region targets", () => {
    expect(() =>
      parseCritiqueResponse(8, 8, {
        summary: "The target region overflows the canvas.",
        suggestions: [
          {
            id: "s1",
            title: "Fix a region",
            reasoning: "The target region must fit the canvas.",
            target: { type: "region", x: 6, y: 6, width: 3, height: 2 },
            action: "darken",
          },
        ],
      }),
    ).toThrow();
  });

  it("accepts parsed critique global targets", () => {
    const parsed = parseCritiqueResponse(8, 8, {
      summary: "The whole image needs stronger contrast.",
      suggestions: [
        {
          id: "s1",
          title: "Increase contrast",
          reasoning: "The whole image reads too flat.",
          target: { type: "global" },
          action: "increase_contrast",
        },
      ],
    });
    expect(parsed).toMatchObject({ suggestions: [{ target: { type: "global" } }] });
  });

  it("rejects parsed critique responses with invalid canvas dimensions", () => {
    expect(() =>
      parseCritiqueResponse(0, 8, {
        summary: "Invalid canvas dimensions.",
        suggestions: [
          {
            id: "s1",
            title: "Increase contrast",
            reasoning: "The whole image reads too flat.",
            target: { type: "global" },
            action: "increase_contrast",
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects matrix requests with more than 64 by 64 pixels", () => {
    expect(() =>
      MatrixRequestSchema.parse({
        width: 64,
        height: 64,
        pixels: Array.from({ length: 64 * 64 + 1 }, () => "#000"),
        palette: ["#000"],
      }),
    ).toThrow();
  });

  it("rejects matrix requests with wrong pixel count", () => {
    expect(() =>
      parseMatrixRequest({
        width: 2,
        height: 2,
        pixels: ["#000"],
        palette: ["#000", "#fff"],
      }),
    ).toThrow();
  });

  it("accepts matrix requests with exact pixel count", () => {
    const parsed = parseMatrixRequest({
      width: 2,
      height: 2,
      pixels: ["#000", "#111", "#222", "transparent"],
      palette: ["#000", "#111", "#222", "transparent"],
    });
    expect(parsed).toMatchObject({ width: 2, height: 2 });
  });

  it("rejects demonstration responses with wrong pixel count", () => {
    const response = DemonstrationResponseSchema.parse({
      label: "Higher contrast",
      explanation: "Darkened the frame.",
      pixels: ["#000"],
    });
    expect(validateDemonstrationPixels(2, 2, response)).toBe(false);
  });

  it("accepts demonstration responses with exact dimensions", () => {
    const response = DemonstrationResponseSchema.parse({
      label: "Higher contrast",
      explanation: "Darkened the frame.",
      pixels: ["#000", "#111", "#222", "transparent"],
    });
    expect(validateDemonstrationPixels(2, 2, response)).toBe(true);
  });

  it("rejects demonstration responses with more than 64 by 64 pixels", () => {
    expect(() =>
      DemonstrationResponseSchema.parse({
        label: "Too many pixels",
        explanation: "The response exceeds the maximum canvas size.",
        pixels: Array.from({ length: 64 * 64 + 1 }, () => "#000"),
      }),
    ).toThrow();
  });

  it("rejects parsed demonstration responses with wrong pixel count", () => {
    expect(() =>
      parseDemonstrationResponse(2, 2, {
        label: "Higher contrast",
        explanation: "Darkened the frame.",
        pixels: ["#000"],
      }),
    ).toThrow();
  });

  it("accepts parsed demonstration responses with exact pixel count", () => {
    const parsed = parseDemonstrationResponse(2, 2, {
      label: "Higher contrast",
      explanation: "Darkened the frame.",
      pixels: ["#000", "#111", "#222", "transparent"],
    });
    expect(parsed).toMatchObject({ label: "Higher contrast" });
  });
});
