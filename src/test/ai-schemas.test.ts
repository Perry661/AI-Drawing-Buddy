import { describe, expect, it } from "vitest";
import { CritiqueResponseSchema, DemonstrationResponseSchema, validateDemonstrationPixels } from "@/lib/ai/schemas";

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
});
