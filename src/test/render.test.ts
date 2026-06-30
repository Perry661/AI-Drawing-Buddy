import { describe, expect, it, vi } from "vitest";
import { canvasPointToPixel, drawPixelMatrix } from "@/lib/pixel/render";
import type { PixelMatrix } from "@/lib/pixel/types";

type CanvasStubOptions = {
  width: number;
  height: number;
  rect?: Partial<DOMRect>;
};

function createCanvasStub({ width, height, rect = {} }: CanvasStubOptions) {
  const fillStyles: string[] = [];
  const strokeStyles: string[] = [];
  const lineWidths: number[] = [];
  const context = {
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    stroke: vi.fn(),
    get fillStyle() {
      return fillStyles.at(-1) ?? "";
    },
    set fillStyle(value: string) {
      fillStyles.push(value);
    },
    get lineWidth() {
      return lineWidths.at(-1) ?? 0;
    },
    set lineWidth(value: number) {
      lineWidths.push(value);
    },
    get strokeStyle() {
      return strokeStyles.at(-1) ?? "";
    },
    set strokeStyle(value: string) {
      strokeStyles.push(value);
    },
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

  return { canvas, context, fillStyles, lineWidths, strokeStyles };
}

const matrix: PixelMatrix = {
  width: 4,
  height: 4,
  pixels: Array.from({ length: 16 }, () => "transparent"),
};

describe("canvas pixel rendering helpers", () => {
  it("draws the background, non-transparent pixels, and grid using centered offsets", () => {
    const { canvas, context, fillStyles, lineWidths, strokeStyles } = createCanvasStub({
      width: 100,
      height: 80,
    });
    const drawMatrix: PixelMatrix = {
      width: 2,
      height: 2,
      pixels: ["#ff0000", "transparent", "#0000ff", "transparent"],
    };

    drawPixelMatrix(canvas, drawMatrix, { background: "#eeeeee", showGrid: true });

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 100, 80);
    expect(context.fillRect).toHaveBeenNthCalledWith(1, 10, 0, 80, 80);
    expect(context.fillRect).toHaveBeenNthCalledWith(2, 10, 0, 40, 40);
    expect(context.fillRect).toHaveBeenNthCalledWith(3, 10, 40, 40, 40);
    expect(context.fillRect).toHaveBeenCalledTimes(3);
    expect(fillStyles).toEqual(["#eeeeee", "#ff0000", "#0000ff"]);
    expect(strokeStyles).toEqual(["rgba(23, 23, 23, 0.12)"]);
    expect(lineWidths).toEqual([1]);
    expect(context.moveTo).toHaveBeenNthCalledWith(1, 10, 0);
    expect(context.lineTo).toHaveBeenNthCalledWith(1, 10, 80);
    expect(context.moveTo).toHaveBeenNthCalledWith(4, 10, 0);
    expect(context.lineTo).toHaveBeenNthCalledWith(4, 90, 0);
    expect(context.stroke).toHaveBeenCalledTimes(6);
  });

  it("maps the top-left and bottom-right canvas coordinates to matrix pixels", () => {
    const { canvas } = createCanvasStub({ width: 100, height: 80 });

    expect(canvasPointToPixel(canvas, matrix, 10, 0)).toEqual({ x: 0, y: 0 });
    expect(canvasPointToPixel(canvas, matrix, 89, 79)).toEqual({ x: 3, y: 3 });
  });

  it("maps coordinates through a scaled DOM rect", () => {
    const { canvas } = createCanvasStub({
      width: 160,
      height: 160,
      rect: { width: 80, height: 80, right: 80, bottom: 80 },
    });

    expect(canvasPointToPixel(canvas, matrix, 20, 20)).toEqual({ x: 1, y: 1 });
    expect(canvasPointToPixel(canvas, matrix, 79, 79)).toEqual({ x: 3, y: 3 });
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

  it("returns null for non-finite client coordinates", () => {
    const { canvas } = createCanvasStub({ width: 80, height: 80 });

    expect(canvasPointToPixel(canvas, matrix, Number.NaN, 10)).toBeNull();
    expect(canvasPointToPixel(canvas, matrix, 10, Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("returns null when the canvas backing size is too small for the matrix", () => {
    const { canvas } = createCanvasStub({ width: 2, height: 2 });

    expect(canvasPointToPixel(canvas, matrix, 1, 1)).toBeNull();
  });

  it("returns null when the matrix has too few or too many pixels", () => {
    const { canvas } = createCanvasStub({ width: 80, height: 80 });
    const tooShort: PixelMatrix = { ...matrix, pixels: matrix.pixels.slice(0, -1) };
    const tooLong: PixelMatrix = { ...matrix, pixels: [...matrix.pixels, "#ff0000"] };

    expect(canvasPointToPixel(canvas, tooShort, 10, 10)).toBeNull();
    expect(canvasPointToPixel(canvas, tooLong, 10, 10)).toBeNull();
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

  it("draws with a zero DOM rect when backing canvas dimensions are valid", () => {
    const { canvas, context } = createCanvasStub({
      width: 80,
      height: 80,
      rect: { width: 0, height: 0, right: 0, bottom: 0 },
    });

    drawPixelMatrix(canvas, matrix);

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 80, 80);
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 80, 80);
  });

  it("clears and skips drawing when the matrix has too few or too many pixels", () => {
    const tooShort = createCanvasStub({ width: 80, height: 80 });
    const tooLong = createCanvasStub({ width: 80, height: 80 });

    drawPixelMatrix(tooShort.canvas, { ...matrix, pixels: matrix.pixels.slice(0, -1) });
    drawPixelMatrix(tooLong.canvas, { ...matrix, pixels: [...matrix.pixels, "#ff0000"] });

    expect(tooShort.context.clearRect).toHaveBeenCalledWith(0, 0, 80, 80);
    expect(tooShort.context.fillRect).not.toHaveBeenCalled();
    expect(tooShort.context.stroke).not.toHaveBeenCalled();
    expect(tooLong.context.clearRect).toHaveBeenCalledWith(0, 0, 80, 80);
    expect(tooLong.context.fillRect).not.toHaveBeenCalled();
    expect(tooLong.context.stroke).not.toHaveBeenCalled();
  });
});
