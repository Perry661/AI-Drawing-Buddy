import { afterEach, describe, expect, it, vi } from "vitest";
import type { Suggestion } from "@/lib/ai/schemas";

vi.mock("@/lib/ai/openai", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai/openai")>("@/lib/ai/openai");
  return {
    ...actual,
    requestJsonFromOpenAI: vi.fn(),
  };
});

const { InvalidAIJsonError, requestJsonFromOpenAI } = await import("@/lib/ai/openai");
const { POST: postCritique } = await import("@/app/api/critique/route");
const { POST: postDemonstrate } = await import("@/app/api/demonstrate/route");

const mockedRequestJsonFromOpenAI = vi.mocked(requestJsonFromOpenAI);

const matrix = {
  width: 2,
  height: 2,
  pixels: ["#000", "#fff", "transparent", "#000"],
  palette: ["#000", "#fff"],
};

const suggestion: Suggestion = {
  id: "s1",
  title: "Darken edge",
  reasoning: "The edge needs stronger separation.",
  target: { type: "pixel", x: 1, y: 0 },
  action: "darken",
};

function makeSuggestion(id: string): Suggestion {
  return {
    ...suggestion,
    id,
  };
}

function requestFor(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `203.0.113.${Math.floor(Math.random() * 200) + 1}`,
    },
    body: JSON.stringify(body),
  });
}

function rawRequestFor(path: string, body: string, ip: string) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-real-ip": ip,
    },
    body,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  mockedRequestJsonFromOpenAI.mockReset();
});

describe("AI routes", () => {
  it("returns a parsed critique response for a valid artwork payload", async () => {
    mockedRequestJsonFromOpenAI.mockResolvedValue({
      summary: "The silhouette is readable.",
      suggestions: [makeSuggestion("s1"), makeSuggestion("s2"), makeSuggestion("s3")],
    });

    const response = await postCritique(requestFor("/api/critique", matrix));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      summary: "The silhouette is readable.",
      suggestions: [{ id: "s1" }, { id: "s2" }, { id: "s3" }],
    });
  });

  it("returns a parsed demonstration response for a valid single selected suggestion", async () => {
    mockedRequestJsonFromOpenAI.mockResolvedValue({
      label: "Darkened edge",
      explanation: "Adjusted the requested pixel only.",
      pixels: ["#000", "#000", "transparent", "#000"],
    });

    const response = await postDemonstrate(requestFor("/api/demonstrate", { ...matrix, suggestion }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      label: "Darkened edge",
      explanation: "Adjusted the requested pixel only.",
      pixels: ["#000", "#000", "transparent", "#000"],
    });
  });

  it("maps out-of-palette demonstration output to a stable 502 response", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockedRequestJsonFromOpenAI.mockResolvedValue({
      label: "New color",
      explanation: "Introduced a color outside the palette.",
      pixels: ["#000", "#f00", "transparent", "#000"],
    });

    const response = await postDemonstrate(requestFor("/api/demonstrate", { ...matrix, suggestion }));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "AI returned an invalid response." });
  });

  it("maps invalid AI JSON errors to a stable 502 response", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockedRequestJsonFromOpenAI.mockRejectedValue(new InvalidAIJsonError());

    const response = await postCritique(requestFor("/api/critique", matrix));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "AI returned an invalid response." });
  });

  it("rate limits critique requests before parsing invalid JSON", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let response: Response | undefined;

    for (let i = 0; i < 21; i += 1) {
      response = await postCritique(rawRequestFor("/api/critique", "{", "198.51.100.201"));
    }

    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBe("60");
    expect(await response?.json()).toEqual({ error: "Too many AI requests. Please try again later." });
    expect(mockedRequestJsonFromOpenAI).not.toHaveBeenCalled();
  });

  it("rate limits demonstration requests before parsing invalid JSON", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let response: Response | undefined;

    for (let i = 0; i < 21; i += 1) {
      response = await postDemonstrate(rawRequestFor("/api/demonstrate", "{", "198.51.100.202"));
    }

    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBe("60");
    expect(await response?.json()).toEqual({ error: "Too many AI requests. Please try again later." });
    expect(mockedRequestJsonFromOpenAI).not.toHaveBeenCalled();
  });
});
