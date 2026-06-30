import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ColorPalette } from "@/components/ColorPalette";
import { StudioToolbar } from "@/components/StudioToolbar";

const noop = vi.fn();

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
    expect(markup).toContain('value="#aabbcc"');
    expect(markup).toContain('value="#000000"');
    expect(markup).toContain('value="#123456"');
  });
});
