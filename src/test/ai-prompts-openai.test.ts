import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCritiquePrompt, buildDemonstrationPrompt } from "@/lib/ai/prompts";
import { getAllowedDemonstrationColors, validateDemonstrationPalette } from "@/lib/ai/palette";
import { createInMemoryRateLimiter, getClientIp } from "@/lib/ai/rateLimit";
import {
  InvalidAIJsonError,
  MissingOpenAIKeyError,
  OpenAIRequestError,
  getAIErrorResponse,
  parseOpenAIJson,
} from "@/lib/ai/openai";
import { POST as postCritique } from "@/app/api/critique/route";
import { POST as postDemonstrate } from "@/app/api/demonstrate/route";
import type { MatrixRequest, Suggestion } from "@/lib/ai/schemas";

const matrix: MatrixRequest = {
  width: 2,
  height: 2,
  pixels: ["#000", "#fff", "transparent", "#000"],
  palette: ["#000", "#fff"],
  title: "Tiny icon",
  intent: "A readable two-tone mark.",
};

const suggestion: Suggestion = {
  id: "s1",
  title: "Increase contrast",
  reasoning: "The focal pixel needs stronger separation.",
  target: { type: "pixel", x: 1, y: 0 },
  action: "increase_contrast",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AI prompt builders", () => {
  it("includes critique response schema, allowed actions, target variants, bounds, and an example", () => {
    const prompt = buildCritiquePrompt(matrix);

    expect(prompt).toContain("summary");
    expect(prompt).toContain("suggestions");
    expect(prompt).toContain("id");
    expect(prompt).toContain("title");
    expect(prompt).toContain("reasoning");
    expect(prompt).toContain("target");
    expect(prompt).toContain("action");
    expect(prompt).toContain("pixel");
    expect(prompt).toContain("region");
    expect(prompt).toContain("global");
    expect(prompt).toContain("x must be 0 through 1");
    expect(prompt).toContain("y must be 0 through 1");
    expect(prompt).toContain("darken");
    expect(prompt).toContain("lighten");
    expect(prompt).toContain("remove");
    expect(prompt).toContain("add_highlight");
    expect(prompt).toContain("increase_contrast");
    expect(prompt).toContain("simplify_shape");
    expect(prompt).toContain("shift_hue");
    expect(prompt).toContain("A-Z, a-z, 0-9, underscore, or hyphen");
    expect(prompt).toContain("Valid example");
  });

  it("includes demonstration response schema, exact pixel count, and palette-only constraints", () => {
    const prompt = buildDemonstrationPrompt(matrix, suggestion);

    expect(prompt).toContain("label");
    expect(prompt).toContain("explanation");
    expect(prompt).toContain("pixels");
    expect(prompt).toContain("exactly 4 pixels");
    expect(prompt).toContain("Only use colors from this allowed color set");
    expect(prompt).toContain("#000");
    expect(prompt).toContain("#fff");
    expect(prompt).toContain("transparent");
    expect(prompt).toContain("Avoid a complete replacement unless the selected suggestion target is global.");
    expect(prompt).toContain("Valid example");
  });
});

describe("OpenAI helper errors", () => {
  it("wraps malformed model JSON in a typed invalid response error", () => {
    expect(() => parseOpenAIJson("{not json")).toThrow(InvalidAIJsonError);
  });

  it("maps typed AI errors to stable client responses", () => {
    expect(getAIErrorResponse(new MissingOpenAIKeyError()).message).toBe(
      "AI is not configured yet. Add OPENAI_API_KEY on the server.",
    );
    expect(getAIErrorResponse(new MissingOpenAIKeyError()).status).toBe(503);

    expect(getAIErrorResponse(new InvalidAIJsonError())).toEqual({
      message: "AI returned an invalid response.",
      status: 502,
    });

    expect(getAIErrorResponse(new OpenAIRequestError("provider-specific details"))).toEqual({
      message: "AI service unavailable.",
      status: 502,
    });
  });
});

describe("AI demonstration palette validation", () => {
  it("allows request palette colors and transparent when the original artwork has transparent pixels", () => {
    expect(getAllowedDemonstrationColors(matrix)).toEqual(["#000", "#fff", "transparent"]);
    expect(validateDemonstrationPalette(matrix, ["#000", "#fff", "transparent", "#000"])).toBe(true);
  });

  it("rejects transparent when the request has no transparent source pixel", () => {
    const opaqueMatrix = {
      ...matrix,
      pixels: ["#000", "#fff", "#000", "#fff"],
    };

    expect(getAllowedDemonstrationColors(opaqueMatrix)).toEqual(["#000", "#fff"]);
    expect(validateDemonstrationPalette(opaqueMatrix, ["#000", "#fff", "transparent", "#000"])).toBe(false);
  });

  it("rejects colors outside the request palette", () => {
    expect(validateDemonstrationPalette(matrix, ["#000", "#fff", "#f00", "#000"])).toBe(false);
  });

  it("matches hex colors case-insensitively", () => {
    const mixedCaseMatrix = {
      ...matrix,
      pixels: ["#ABCDEF", "#fff", "#000", "#fff"],
      palette: ["#ABCDEF", "#fff"],
    };

    expect(validateDemonstrationPalette(mixedCaseMatrix, ["#abcdef", "#FFF", "#ABCDEF", "#fff"])).toBe(true);
  });
});

describe("AI rate limiting", () => {
  it("allows requests up to the limit and rejects later requests in the same window", () => {
    const limiter = createInMemoryRateLimiter({ limit: 2, windowMs: 1000, now: () => 100 });

    expect(limiter.check("client-a")).toEqual({ allowed: true });
    expect(limiter.check("client-a")).toEqual({ allowed: true });
    expect(limiter.check("client-a")).toEqual({ allowed: false, retryAfterMs: 1000 });
  });

  it("resets after the rate limit window", () => {
    let now = 100;
    const limiter = createInMemoryRateLimiter({ limit: 1, windowMs: 1000, now: () => now });

    expect(limiter.check("client-a").allowed).toBe(true);
    expect(limiter.check("client-a").allowed).toBe(false);

    now = 1200;
    expect(limiter.check("client-a").allowed).toBe(true);
  });

  it("uses the first forwarded IP or falls back to unknown", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "203.0.113.1, 198.51.100.2" }))).toBe("203.0.113.1");
    expect(getClientIp(new Headers({ "x-forwarded-for": "not an ip" }))).toBe("unknown");
    expect(getClientIp(new Headers())).toBe("unknown");
  });

  it("prunes expired buckets during later checks", () => {
    let now = 100;
    const limiter = createInMemoryRateLimiter({ limit: 1, windowMs: 1000, now: () => now });

    limiter.check("client-a");
    limiter.check("client-b");
    expect(limiter.getBucketCount()).toBe(2);

    now = 1200;
    limiter.check("client-c");
    expect(limiter.getBucketCount()).toBe(1);
  });
});

describe("AI route validation responses", () => {
  it("returns a stable critique 400 message for invalid artwork payloads", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await postCritique(
      new Request("http://localhost/api/critique", {
        method: "POST",
        body: JSON.stringify({ width: 2, height: 2, pixels: ["#000"], palette: ["#000"] }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid artwork payload." });
  });

  it("returns a stable demonstrate 400 message for invalid revision requests", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await postDemonstrate(
      new Request("http://localhost/api/demonstrate", {
        method: "POST",
        body: JSON.stringify({ width: 2, height: 2, pixels: ["#000"], palette: ["#000"] }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid revision request." });
  });
});
