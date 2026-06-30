import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ColorPalette } from "@/components/ColorPalette";
import { PixelCanvas } from "@/components/PixelCanvas";
import { StudioToolbar } from "@/components/StudioToolbar";
import type { PixelMatrix } from "@/lib/pixel/types";

const noop = vi.fn();
const matrix: PixelMatrix = {
  width: 2,
  height: 2,
  pixels: ["transparent", "transparent", "transparent", "transparent"],
};

vi.stubGlobal("React", React);

describe("editor components", () => {
  it("marks the selected toolbar tool as pressed with polished labels", () => {
    const markup = renderToStaticMarkup(
      createElement(StudioToolbar, {
        tool: "fill",
        canUndo: false,
        canRedo: true,
        onToolChange: noop,
        onUndo: noop,
        onRedo: noop,
        onClear: noop,
        onExport: noop,
      }),
    );

    expect(markup).toContain('role="toolbar"');
    expect(markup).toContain('aria-label="Drawing tools"');
    expect(markup).toContain('aria-pressed="true">Fill</button>');
    expect(markup).toContain('aria-pressed="false">Pencil</button>');
    expect(markup).toContain('aria-pressed="false">Eraser</button>');
    expect(markup).toContain('aria-pressed="false">Eyedropper</button>');
  });

  it("renders palette swatches without nested controls and normalizes color input values", () => {
    const markup = renderToStaticMarkup(
      createElement(ColorPalette, {
        palette: ["#abc", "transparent", "#123456"],
        selectedColor: "#abc",
        onSelect: noop,
        onReplace: noop,
      }),
    );

    expect(markup).not.toContain("<label");
    expect(markup).toContain('aria-label="Color palette"');
    expect(markup).toContain('aria-label="Select #abc" aria-pressed="true"');
    expect(markup).toContain('aria-label="Select transparent" aria-pressed="false"');
    expect(markup).toContain('aria-label="Select #123456" aria-pressed="false"');
    expect(markup).toContain('value="#aabbcc"');
    expect(markup).toContain('value="#000000"');
    expect(markup).toContain('value="#123456"');
  });

  it("renders the pixel canvas with touch gestures disabled", () => {
    const markup = renderToStaticMarkup(
      createElement(PixelCanvas, {
        label: "Draft canvas",
        matrix,
        editable: true,
        onPaint: noop,
        onPick: noop,
      }),
    );

    expect(markup).toContain('aria-label="Draft canvas"');
    expect(markup).toContain('style="touch-action:none"');
  });
});
