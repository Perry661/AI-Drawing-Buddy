import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AIPanel } from "@/components/AIPanel";
import { RevisionHistory } from "@/components/RevisionHistory";
import { requestCritique } from "@/lib/ai/client";
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

  it("uses a stable message for invalid JSON success responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not json", { status: 200 })));

    await expect(requestCritique(matrixRequest)).rejects.toThrow("AI request failed.");
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
