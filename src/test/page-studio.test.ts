import React, { createElement, isValidElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AIPanel } from "@/components/AIPanel";
import type { PixelCanvas } from "@/components/PixelCanvas";
import type { RevisionHistory } from "@/components/RevisionHistory";
import type { StudioToolbar } from "@/components/StudioToolbar";
import type { CritiqueResponse, DemonstrationResponse } from "@/lib/ai/schemas";
import type { PixelMatrix } from "@/lib/pixel/types";

type Setter<T> = (value: T | ((current: T) => T)) => void;
type HookHarness = {
  cursor: number;
  states: unknown[];
  refs: Array<{ current: unknown }>;
  begin: () => void;
  reset: () => void;
  useState: <T>(initial: T | (() => T)) => [T, Setter<T>];
  useRef: <T>(initial: T) => { current: T };
};

type PixelCanvasProps = Parameters<typeof PixelCanvas>[0];
type AIPanelProps = Parameters<typeof AIPanel>[0];
type RevisionHistoryProps = Parameters<typeof RevisionHistory>[0];
type StudioToolbarProps = Parameters<typeof StudioToolbar>[0];

type Captures = {
  aiPanel: AIPanelProps | null;
  canvases: PixelCanvasProps[];
  revisionHistory: RevisionHistoryProps | null;
  toolbar: StudioToolbarProps | null;
};

const testState = vi.hoisted(() => {
  const harness: HookHarness = {
    cursor: 0,
    states: [],
    refs: [],
    begin() {
      this.cursor = 0;
    },
    reset() {
      this.cursor = 0;
      this.states = [];
      this.refs = [];
    },
    useState<T>(initial: T | (() => T)) {
      const index = this.cursor;
      this.cursor += 1;
      if (this.states.length <= index) {
        this.states[index] = typeof initial === "function" ? (initial as () => T)() : initial;
      }

      const setState: Setter<T> = (value) => {
        const current = this.states[index] as T;
        this.states[index] = typeof value === "function" ? (value as (current: T) => T)(current) : value;
      };

      return [this.states[index] as T, setState];
    },
    useRef<T>(initial: T) {
      const index = this.cursor;
      this.cursor += 1;
      if (this.refs.length <= index) {
        this.refs[index] = { current: initial };
      }
      return this.refs[index] as { current: T };
    },
  };

  const captures: Captures = {
    aiPanel: null,
    canvases: [],
    revisionHistory: null,
    toolbar: null,
  };

  return { captures, harness };
});

vi.mock("react", async (importActual) => {
  const actual = await importActual<typeof import("react")>();
  return {
    ...actual,
    useMemo: <T>(factory: () => T) => factory(),
    useRef: testState.harness.useRef.bind(testState.harness),
    useState: testState.harness.useState.bind(testState.harness),
  };
});

vi.mock("@/components/AIPanel", () => ({
  AIPanel: (props: AIPanelProps) => {
    testState.captures.aiPanel = props;
    return createElement("mock-ai-panel");
  },
}));

vi.mock("@/components/ColorPalette", () => ({
  ColorPalette: () => createElement("mock-color-palette"),
}));

vi.mock("@/components/PixelCanvas", () => ({
  PixelCanvas: (props: PixelCanvasProps) => {
    testState.captures.canvases.push(props);
    return createElement("mock-pixel-canvas");
  },
}));

vi.mock("@/components/RevisionHistory", () => ({
  RevisionHistory: (props: RevisionHistoryProps) => {
    testState.captures.revisionHistory = props;
    return createElement("mock-revision-history");
  },
}));

vi.mock("@/components/StudioToolbar", () => ({
  StudioToolbar: (props: StudioToolbarProps) => {
    testState.captures.toolbar = props;
    return createElement("mock-studio-toolbar");
  },
}));

vi.mock("@/lib/ai/client", () => ({
  requestCritique: vi.fn(),
  requestDemonstration: vi.fn(),
}));

import Home from "@/app/page";
import { requestCritique, requestDemonstration } from "@/lib/ai/client";

const requestCritiqueMock = vi.mocked(requestCritique);
const requestDemonstrationMock = vi.mocked(requestDemonstration);

const critique: CritiqueResponse = {
  summary: "The silhouette reads clearly.",
  suggestions: [
    {
      id: "contrast",
      title: "Raise contrast",
      reasoning: "A brighter edge will separate the form.",
      action: "increase_contrast",
      target: { type: "global" },
    },
    {
      id: "highlight",
      title: "Add highlight",
      reasoning: "One highlight can define the focal point.",
      action: "add_highlight",
      target: { type: "pixel", x: 1, y: 0 },
    },
    {
      id: "clean",
      title: "Clean contour",
      reasoning: "Removing a corner pixel improves readability.",
      action: "simplify_shape",
      target: { type: "region", x: 0, y: 0, width: 2, height: 2 },
    },
  ],
};

const demonstration: DemonstrationResponse = {
  label: "Contrast pass",
  explanation: "Added a light pixel to improve separation.",
  pixels: Array.from({ length: 16 * 16 }, (_, index) => (index === 1 ? "#f9fafb" : "transparent")),
};

function renderPage() {
  testState.harness.begin();
  testState.captures.aiPanel = null;
  testState.captures.canvases = [];
  testState.captures.revisionHistory = null;
  testState.captures.toolbar = null;
  renderNode(createElement(Home));
  return testState.captures;
}

function renderNode(node: ReactNode): void {
  if (node === null || node === undefined || typeof node === "boolean") return;
  if (Array.isArray(node)) {
    node.forEach(renderNode);
    return;
  }
  if (!isValidElement(node)) return;

  if (typeof node.type === "function") {
    renderNode(node.type(node.props));
    return;
  }

  renderNode((node.props as { children?: ReactNode }).children);
}

function getOriginalCanvas() {
  const canvas = testState.captures.canvases.find((item) => item.label === "Original");
  if (!canvas) throw new Error("Original canvas was not rendered.");
  return canvas;
}

function getRevisionCanvas(label: string) {
  const canvas = testState.captures.canvases.find((item) => item.label === label);
  if (!canvas) throw new Error(`${label} canvas was not rendered.`);
  return canvas;
}

function getAIPanel() {
  if (!testState.captures.aiPanel) throw new Error("AI panel was not rendered.");
  return testState.captures.aiPanel;
}

function getRevisionHistory() {
  if (!testState.captures.revisionHistory) throw new Error("Revision history was not rendered.");
  return testState.captures.revisionHistory;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });
  return { promise, resolve };
}

async function requestAndRenderCritique() {
  requestCritiqueMock.mockResolvedValueOnce(critique);
  await getAIPanel().onCritique();
  return renderPage();
}

beforeEach(() => {
  vi.stubGlobal("React", React);
  testState.harness.reset();
  requestCritiqueMock.mockReset();
  requestDemonstrationMock.mockReset();
});

describe("studio page composition", () => {
  it("requests critique for the current matrix and selected palette", async () => {
    renderPage();
    getOriginalCanvas().onPaint?.(0, 0);
    renderPage();

    await requestAndRenderCritique();

    expect(requestCritiqueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 16,
        height: 16,
        palette: expect.arrayContaining(["#111827", "#f9fafb"]),
        pixels: expect.arrayContaining(["#111827"]),
      }),
    );
    expect(getAIPanel().critique?.summary).toBe("The silhouette reads clearly.");
    expect(getAIPanel().selectedSuggestionId).toBe("contrast");
  });

  it("demonstrates a selected suggestion and applies the revision into original history", async () => {
    renderPage();
    await requestAndRenderCritique();
    requestDemonstrationMock.mockResolvedValueOnce(demonstration);

    await getAIPanel().onDemonstrate();
    renderPage();

    expect(requestDemonstrationMock).toHaveBeenCalledWith(expect.any(Object), critique.suggestions[0]);
    expect(getRevisionCanvas("Contrast pass").matrix.pixels[1]).toBe("#f9fafb");
    expect(getRevisionHistory().revisions).toHaveLength(1);

    getAIPanel().onApplyRevision();
    renderPage();

    expect((getOriginalCanvas().matrix as PixelMatrix).pixels[1]).toBe("#f9fafb");
    expect(testState.captures.toolbar?.canUndo).toBe(true);
  });

  it("restores a generated revision into the comparison panel from revision history", async () => {
    renderPage();
    await requestAndRenderCritique();
    requestDemonstrationMock.mockResolvedValueOnce(demonstration);
    await getAIPanel().onDemonstrate();
    renderPage();

    const [revision] = getRevisionHistory().revisions;
    getOriginalCanvas().onPaint?.(2, 0);
    renderPage();
    getRevisionHistory().onSelect(revision);
    renderPage();

    expect(getRevisionCanvas("Contrast pass").matrix.pixels[1]).toBe("#f9fafb");
    expect(getRevisionHistory().selectedRevisionId).toBe(revision.id);
  });

  it("ignores a critique response when the original canvas changed after the request started", async () => {
    const deferred = createDeferred<CritiqueResponse>();
    requestCritiqueMock.mockReturnValueOnce(deferred.promise);
    renderPage();

    const request = getAIPanel().onCritique();
    renderPage();
    getOriginalCanvas().onPaint?.(0, 0);
    renderPage();
    deferred.resolve(critique);
    await request;
    renderPage();

    expect(getAIPanel().critique).toBeNull();
    expect(getAIPanel().selectedSuggestionId).toBeNull();
  });

  it("ignores a demonstration response when the original canvas changed after the request started", async () => {
    renderPage();
    await requestAndRenderCritique();
    const deferred = createDeferred<DemonstrationResponse>();
    requestDemonstrationMock.mockReturnValueOnce(deferred.promise);

    const request = getAIPanel().onDemonstrate();
    renderPage();
    getOriginalCanvas().onPaint?.(0, 0);
    renderPage();
    deferred.resolve(demonstration);
    await request;
    renderPage();

    expect(getRevisionHistory().revisions).toHaveLength(0);
    expect(getAIPanel().hasRevision).toBe(false);
    expect(getAIPanel().error).toContain("canvas changed");
  });

  it("rejects applying a stored AI revision when the original canvas no longer matches its base", async () => {
    renderPage();
    await requestAndRenderCritique();
    requestDemonstrationMock.mockResolvedValueOnce(demonstration);
    await getAIPanel().onDemonstrate();
    renderPage();

    const [revision] = getRevisionHistory().revisions;
    getOriginalCanvas().onPaint?.(3, 0);
    renderPage();
    getRevisionHistory().onSelect(revision);
    renderPage();
    getAIPanel().onApplyRevision();
    renderPage();

    expect(getOriginalCanvas().matrix.pixels[1]).toBe("transparent");
    expect(getAIPanel().error).toContain("canvas changed");
  });
});
