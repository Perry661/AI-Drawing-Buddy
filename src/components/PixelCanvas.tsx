"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { canvasPointToPixel, drawPixelMatrix } from "@/lib/pixel/render";
import type { PixelMatrix } from "@/lib/pixel/types";

type PixelCanvasProps = {
  label: string;
  matrix: PixelMatrix;
  editable?: boolean;
  onPaint?: (x: number, y: number) => void;
  onPick?: (x: number, y: number) => void;
};

export function PixelCanvas({
  label,
  matrix,
  editable = false,
  onPaint,
  onPick,
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawPixelMatrix(canvas, matrix, { showGrid: true });
  }, [matrix]);

  function handlePointer(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || !editable) return;
    const point = canvasPointToPixel(canvas, matrix, event.clientX, event.clientY);
    if (!point) return;
    if (event.altKey) onPick?.(point.x, point.y);
    else onPaint?.(point.x, point.y);
  }

  return (
    <section className="canvasPanel" aria-label={label}>
      <div className="panelHeader">
        <h2>{label}</h2>
      </div>
      <canvas
        ref={canvasRef}
        className="pixelCanvas"
        width={720}
        height={720}
        style={{ touchAction: "none" }}
        onPointerDown={(event) => {
          if (!editable) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setIsDrawing(true);
          handlePointer(event);
        }}
        onPointerMove={(event) => {
          if (!isDrawing) return;
          if ((event.buttons & 1) !== 1) {
            setIsDrawing(false);
            return;
          }
          handlePointer(event);
        }}
        onPointerUp={() => setIsDrawing(false)}
        onPointerCancel={() => setIsDrawing(false)}
        onPointerLeave={() => setIsDrawing(false)}
        onLostPointerCapture={() => setIsDrawing(false)}
        aria-label={label}
      />
    </section>
  );
}
