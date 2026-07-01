import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AIPanel } from "@/components/AIPanel";
import { RevisionHistory } from "@/components/RevisionHistory";
import { requestCritique, requestDemonstration } from "@/lib/ai/client";
import type { CritiqueResponse } from "@/lib/ai/schemas";
import type { PixelMatrix } from "@/lib/pixel/types";

vi.stubGlobal("React", React);

const critique: CritiqueResponse = {
  summary: "The silhouette reads clearly.",
  suggestions: [
    {
      id: "s1",
      title: "Brighten highlight",
      reasoning: "The focal edge needs a sharper value jump.",
      target: { type: "pixel", x: 1, y: 0 },
      action: "add_highlight",
    },
    {
      id: "s2",
      title: "Simplify shape",
      reasoning: "The lower corner is visually noisy.",
      target: { type: "region", x: 0, y: 1, width: 2, height: 1 },
      action: "simplify_shape",
    },
    {
      id: "s3",
      title: "Deepen shadow",
      reasoning: "The shadow side could use more contrast.",
      target: { type: "global" },
      action: "increase_contrast",
    },
  ],
};

const matrixRequest = {
  width: 2,
  height: 2,
  pixels: ["#000", "#fff", "transparent", "#000"],
  palette: ["#000", "#fff"],
};

const matrix: PixelMatrix = {
  width: 2,
  height: 2,
  pixels: ["#000", "#fff", "transparent", "#000"],
};

const noop = vi.fn();

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.stubGlobal("React", React);
});

describe("AI browser client", () => {
  it("uses a stable fallback message for non-JSON error responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Service unavailable", { status: 503 })),
    );

    await expect(requestCritique(matrixRequest)).rejects.toThrow("AI request failed.");
  });

  it("preserves JSON server error messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ error: "Too many AI requests." }, { status: 429 })),
    );

    await expect(requestCritique(matrixRequest)).rejects.toThrow("Too many AI requests.");
  });

  it("uses a stable message for invalid JSON success responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not json", { status: 200 })));

    await expect(requestCritique(matrixRequest)).rejects.toThrow("AI request failed.");
  });

  it("uses a stable message for network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(requestCritique(matrixRequest)).rejects.toThrow("AI request failed.");
  });

  it("rejects invalid successful critique responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          summary: "Too few suggestions.",
          suggestions: [critique.suggestions[0]],
        }),
      ),
    );

    await expect(requestCritique(matrixRequest)).rejects.toThrow("AI request failed.");
  });

  it("rejects invalid successful demonstration responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          label: "",
          explanation: "Missing a usable label.",
          pixels: matrixRequest.pixels,
        }),
      ),
    );

    await expect(requestDemonstration(matrixRequest, critique.suggestions[0])).rejects.toThrow("AI request failed.");
  });

  it("posts the selected suggestion with the demonstration request", async () => {
    const fetch = vi.fn().mockResolvedValue(
      Response.json({
        label: "Brightened highlight",
        explanation: "Raised the selected highlight pixel.",
        pixels: matrixRequest.pixels,
      }),
    );
    vi.stubGlobal("fetch", fetch);

    await expect(requestDemonstration(matrixRequest, critique.suggestions[0])).resolves.toEqual({
      label: "Brightened highlight",
      explanation: "Raised the selected highlight pixel.",
      pixels: matrixRequest.pixels,
    });

    expect(fetch).toHaveBeenCalledWith("/api/demonstrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...matrixRequest, suggestion: critique.suggestions[0] }),
    });
  });
});

describe("AI panel markup", () => {
  it("marks the selected suggestion as pressed", () => {
    const markup = renderToStaticMarkup(
      createElement(AIPanel, {
        critique,
        selectedSuggestionId: "s2",
        loadingCritique: false,
        loadingRevision: false,
        error: null,
        hasRevision: false,
        onCritique: noop,
        onSelectSuggestion: noop,
        onDemonstrate: noop,
        onApplyRevision: noop,
      }),
    );

    expect(markup).toContain('aria-pressed="false"><strong>Brighten highlight</strong>');
    expect(markup).toContain('aria-pressed="true"><strong>Simplify shape</strong>');
  });

  it("disables revision actions while critique is loading", () => {
    const markup = renderToStaticMarkup(
      createElement(AIPanel, {
        critique,
        selectedSuggestionId: "s1",
        loadingCritique: true,
        loadingRevision: false,
        error: null,
        hasRevision: true,
        onCritique: noop,
        onSelectSuggestion: noop,
        onDemonstrate: noop,
        onApplyRevision: noop,
      }),
    );

    expect(markup).toContain('disabled="">Show Me</button>');
    expect(markup).toContain('disabled="">Apply Revision</button>');
  });

  it("disables critique and suggestion controls while revision is loading", () => {
    const markup = renderToStaticMarkup(
      createElement(AIPanel, {
        critique,
        selectedSuggestionId: "s1",
        loadingCritique: false,
        loadingRevision: true,
        error: null,
        hasRevision: true,
        onCritique: noop,
        onSelectSuggestion: noop,
        onDemonstrate: noop,
        onApplyRevision: noop,
      }),
    );

    expect(markup).toContain('disabled="">Get Critique</button>');
    expect(markup).toContain('disabled="" class="suggestion activeSuggestion" aria-pressed="true"');
    expect(markup).toContain('disabled="">Generating revision...</button>');
    expect(markup).toContain('disabled="">Apply Revision</button>');
  });

  it("announces errors to assistive technology", () => {
    const markup = renderToStaticMarkup(
      createElement(AIPanel, {
        critique: null,
        selectedSuggestionId: null,
        loadingCritique: false,
        loadingRevision: false,
        error: "AI request failed.",
        hasRevision: false,
        onCritique: noop,
        onSelectSuggestion: noop,
        onDemonstrate: noop,
        onApplyRevision: noop,
      }),
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain(">AI request failed.</p>");
  });
});

describe("revision history markup", () => {
  it("marks the selected revision as pressed", () => {
    const markup = renderToStaticMarkup(
      createElement(RevisionHistory, {
        selectedRevisionId: "r2",
        revisions: [
          {
            id: "r1",
            label: "First pass",
            explanation: "Adjusted the edge.",
            matrix,
          },
          {
            id: "r2",
            label: "Second pass",
            explanation: "Brightened the highlight.",
            matrix,
          },
        ],
        onSelect: noop,
      }),
    );

    expect(markup).toContain('aria-pressed="false"><strong>First pass</strong>');
    expect(markup).toContain('class="activeRevision" aria-pressed="true"><strong>Second pass</strong>');
  });
});
