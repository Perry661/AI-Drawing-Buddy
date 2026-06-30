import { describe, expect, it, vi } from "vitest";
import { canvasPointToPixel, drawPixelMatrix } from "@/lib/pixel/render";
import type { PixelMatrix } from "@/lib/pixel/types";

type CanvasStubOptions = {
  width: number;
  height: number;
  rect?: Partial<DOMRect>;
};

function createCanvasStub({ width, height, rect = {} }: CanvasStubOptions) {
  const context = {
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    stroke: vi.fn(),
    fillStyle: "",
    lineWidth: 0,
    strokeStyle: "",
  };
  const canvas = {
    width,
    height,
    getContext: vi.fn(() => context),
    getBoundingClientRect: vi.fn(() => ({
      left: 0,
      top: 0,
      width,
      height,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
      ...rect,
    })),
  } as unknown as HTMLCanvasElement;

  return { canvas, context };
}

const matrix: PixelMatrix = {
  width: 4,
  height: 4,
  pixels: Array.from({ length: 16 }, () => "transparent"),
};

describe("canvas pixel rendering helpers", () => {
  it("maps the top-left and bottom-right canvas coordinates to matrix pixels", () => {
    const { canvas } = createCanvasStub({ width: 100, height: 80 });

    expect(canvasPointToPixel(canvas, matrix, 10, 0)).toEqual({ x: 0, y: 0 });
    expect(canvasPointToPixel(canvas, matrix, 89, 79)).toEqual({ x: 3, y: 3 });
  });

  it("returns null for coordinates in the padded canvas area", () => {
    const { canvas } = createCanvasStub({ width: 100, height: 80 });

    expect(canvasPointToPixel(canvas, matrix, 9, 40)).toBeNull();
    expect(canvasPointToPixel(canvas, matrix, 90, 40)).toBeNull();
  });

  it("returns null when the layout rect has no width or height", () => {
    const zeroWidth = createCanvasStub({ width: 100, height: 80, rect: { width: 0 } });
    const zeroHeight = createCanvasStub({ width: 100, height: 80, rect: { height: 0 } });

    expect(canvasPointToPixel(zeroWidth.canvas, matrix, 10, 10)).toBeNull();
    expect(canvasPointToPixel(zeroHeight.canvas, matrix, 10, 10)).toBeNull();
  });

  it("returns null when the canvas backing size is too small for the matrix", () => {
    const { canvas } = createCanvasStub({ width: 2, height: 2 });

    expect(canvasPointToPixel(canvas, matrix, 1, 1)).toBeNull();
  });

  it("returns null at the exact right and bottom matrix boundary", () => {
    const { canvas } = createCanvasStub({ width: 80, height: 80 });

    expect(canvasPointToPixel(canvas, matrix, 80, 40)).toBeNull();
    expect(canvasPointToPixel(canvas, matrix, 40, 80)).toBeNull();
  });

  it("clears and skips drawing when the canvas layout is invalid", () => {
    const { canvas, context } = createCanvasStub({ width: 2, height: 2 });

    drawPixelMatrix(canvas, matrix, { showGrid: true });

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 2, 2);
    expect(context.fillRect).not.toHaveBeenCalled();
    expect(context.stroke).not.toHaveBeenCalled();
  });
});
