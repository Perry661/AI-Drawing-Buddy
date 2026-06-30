import { describe, expect, it } from "vitest";
import * as aiSchemas from "@/lib/ai/schemas";

const {
  CritiqueResponseSchema,
  DemonstrationResponseSchema,
  validateDemonstrationPixels,
} = aiSchemas;

const dimensionAwareSchemas = aiSchemas as typeof aiSchemas & {
  parseMatrixRequest: (input: unknown) => unknown;
  parseDemonstrationResponse: (width: number, height: number, input: unknown) => unknown;
};

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

  it("rejects matrix requests with wrong pixel count", () => {
    expect(dimensionAwareSchemas.parseMatrixRequest).toBeTypeOf("function");
    expect(() =>
      dimensionAwareSchemas.parseMatrixRequest({
        width: 2,
        height: 2,
        pixels: ["#000"],
        palette: ["#000", "#fff"],
      }),
    ).toThrow();
  });

  it("accepts matrix requests with exact pixel count", () => {
    const parsed = dimensionAwareSchemas.parseMatrixRequest({
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

  it("rejects parsed demonstration responses with wrong pixel count", () => {
    expect(dimensionAwareSchemas.parseDemonstrationResponse).toBeTypeOf("function");
    expect(() =>
      dimensionAwareSchemas.parseDemonstrationResponse(2, 2, {
        label: "Higher contrast",
        explanation: "Darkened the frame.",
        pixels: ["#000"],
      }),
    ).toThrow();
  });

  it("accepts parsed demonstration responses with exact pixel count", () => {
    const parsed = dimensionAwareSchemas.parseDemonstrationResponse(2, 2, {
      label: "Higher contrast",
      explanation: "Darkened the frame.",
      pixels: ["#000", "#111", "#222", "transparent"],
    });
    expect(parsed).toMatchObject({ label: "Higher contrast" });
  });
});
