"use client";

import { useMemo, useRef, useState } from "react";
import { AIPanel } from "@/components/AIPanel";
import { ColorPalette } from "@/components/ColorPalette";
import { PixelCanvas } from "@/components/PixelCanvas";
import { RevisionHistory, type RevisionItem } from "@/components/RevisionHistory";
import { StudioToolbar, type Tool } from "@/components/StudioToolbar";
import { requestCritique, requestDemonstration } from "@/lib/ai/client";
import type { CritiqueResponse, MatrixRequest, Suggestion } from "@/lib/ai/schemas";
import {
  TRANSPARENT,
  createPixelMatrix,
  floodFill,
  getPixel,
  serializeMatrix,
} from "@/lib/pixel/matrix";
import { drawPixelMatrix } from "@/lib/pixel/render";
import {
  applyHistoryChange,
  createHistoryState,
  redoHistory,
  undoHistory,
  type HistoryState,
} from "@/lib/pixel/history";
import type { PixelColor, PixelMatrix } from "@/lib/pixel/types";

const CANVAS_SIZE = 16;

const INITIAL_PALETTE = [
  "#111827",
  "#f9fafb",
  "#ef4444",
  "#f97316",
  "#facc15",
  "#22c55e",
  "#38bdf8",
  "#6366f1",
];

const EMPTY_REVISION_LABEL = "AI Revision";
const EMPTY_REVISION_EXPLANATION = "Select a suggestion and generate a revision to compare it here.";

type AIRevisionItem = RevisionItem & {
  baseSignature: string;
};

function getPaintColor(tool: Tool, selectedColor: PixelColor) {
  return tool === "eraser" ? TRANSPARENT : selectedColor;
}

function clampBrushSize(size: number, maxSize: number) {
  return Math.max(1, Math.min(maxSize, Math.round(size)));
}

function paintBrush(matrix: PixelMatrix, x: number, y: number, size: number, color: PixelColor): PixelMatrix {
  const nextPixels = [...matrix.pixels];
  const startX = x - Math.floor(size / 2);
  const startY = y - Math.floor(size / 2);

  for (let brushY = 0; brushY < size; brushY += 1) {
    for (let brushX = 0; brushX < size; brushX += 1) {
      const targetX = startX + brushX;
      const targetY = startY + brushY;
      if (targetX < 0 || targetY < 0 || targetX >= matrix.width || targetY >= matrix.height) continue;
      nextPixels[targetY * matrix.width + targetX] = color;
    }
  }

  return { ...matrix, pixels: nextPixels };
}

function createMatrixRequest(matrix: PixelMatrix, palette: string[]): MatrixRequest {
  return {
    ...serializeMatrix(matrix),
    palette,
    title: "Untitled pixel study",
    intent: "Improve this pixel art while preserving the artist's original idea.",
  };
}

function createRevisionMatrix(base: PixelMatrix, pixels: PixelColor[]): PixelMatrix {
  return { ...base, pixels: [...pixels] };
}

function getCanvasSignature(matrix: PixelMatrix) {
  return `${matrix.width}x${matrix.height}:${matrix.pixels.join("|")}`;
}

function exportMatrixAsPng(matrix: PixelMatrix) {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 720;
  drawPixelMatrix(canvas, matrix, { showGrid: false });

  const link = document.createElement("a");
  link.download = "ai-pixel-studio.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export default function Home() {
  const [history, setHistory] = useState<HistoryState>(() =>
    createHistoryState(createPixelMatrix(CANVAS_SIZE, CANVAS_SIZE)),
  );
  const [tool, setTool] = useState<Tool>("pencil");
  const [brushSize, setBrushSize] = useState(1);
  const [palette, setPalette] = useState(INITIAL_PALETTE);
  const [selectedColor, setSelectedColor] = useState(INITIAL_PALETTE[0]);
  const [critique, setCritique] = useState<CritiqueResponse | null>(null);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [revisionMatrix, setRevisionMatrix] = useState<PixelMatrix | null>(null);
  const [revisionBaseSignature, setRevisionBaseSignature] = useState<string | null>(null);
  const [revisionLabel, setRevisionLabel] = useState(EMPTY_REVISION_LABEL);
  const [revisionExplanation, setRevisionExplanation] = useState(EMPTY_REVISION_EXPLANATION);
  const [revisionHistory, setRevisionHistory] = useState<AIRevisionItem[]>([]);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);
  const [loadingCritique, setLoadingCritique] = useState(false);
  const [loadingRevision, setLoadingRevision] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matrix = history.present;
  const matrixSignature = getCanvasSignature(matrix);
  const currentMatrixSignatureRef = useRef(matrixSignature);
  currentMatrixSignatureRef.current = matrixSignature;
  const selectedSuggestion = useMemo(
    () => critique?.suggestions.find((suggestion) => suggestion.id === selectedSuggestionId) ?? null,
    [critique, selectedSuggestionId],
  );
  const comparisonMatrix = revisionMatrix ?? createPixelMatrix(CANVAS_SIZE, CANVAS_SIZE);

  function clearCanvasDerivedAIState() {
    setCritique(null);
    setSelectedSuggestionId(null);
    setRevisionMatrix(null);
    setRevisionBaseSignature(null);
    setSelectedRevisionId(null);
    setRevisionLabel(EMPTY_REVISION_LABEL);
    setRevisionExplanation(EMPTY_REVISION_EXPLANATION);
    setError(null);
  }

  function commitMatrix(next: PixelMatrix) {
    if (history.present === next) return;
    if (history.present.pixels.every((color, index) => color === next.pixels[index])) return;

    currentMatrixSignatureRef.current = getCanvasSignature(next);
    setHistory(applyHistoryChange(history, next));
    clearCanvasDerivedAIState();
  }

  function replaceHistory(next: HistoryState) {
    if (next === history || next.present === history.present) return;
    currentMatrixSignatureRef.current = getCanvasSignature(next.present);
    setHistory(next);
    clearCanvasDerivedAIState();
  }

  function handlePaint(x: number, y: number) {
    if (tool === "eyedropper") {
      setSelectedColor(getPixel(matrix, x, y));
      return;
    }

    const color = getPaintColor(tool, selectedColor);
    const next = tool === "fill" ? floodFill(matrix, x, y, color) : paintBrush(matrix, x, y, brushSize, color);
    commitMatrix(next);
  }

  function handlePick(x: number, y: number) {
    setSelectedColor(getPixel(matrix, x, y));
  }

  function handleReplaceColor(index: number, color: string) {
    setPalette((current) => current.map((swatch, swatchIndex) => (swatchIndex === index ? color : swatch)));
    if (palette[index] === selectedColor) setSelectedColor(color);
  }

  async function handleCritique() {
    const requestMatrix = serializeMatrix(matrix);
    const requestSignature = getCanvasSignature(requestMatrix);

    setLoadingCritique(true);
    setError(null);
    setCritique(null);
    setSelectedSuggestionId(null);
    setRevisionMatrix(null);
    setRevisionBaseSignature(null);
    setSelectedRevisionId(null);
    setRevisionLabel(EMPTY_REVISION_LABEL);
    setRevisionExplanation(EMPTY_REVISION_EXPLANATION);

    try {
      const response = await requestCritique(createMatrixRequest(requestMatrix, palette));
      if (currentMatrixSignatureRef.current !== requestSignature) {
        setError("The canvas changed before the critique finished. Get a new critique.");
        return;
      }
      setCritique(response);
      setSelectedSuggestionId(response.suggestions[0]?.id ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "AI request failed.");
    } finally {
      setLoadingCritique(false);
    }
  }

  async function handleDemonstrate() {
    if (!selectedSuggestion) return;

    const requestMatrix = serializeMatrix(matrix);
    const requestSignature = getCanvasSignature(requestMatrix);

    setLoadingRevision(true);
    setError(null);

    try {
      const response = await requestDemonstration(createMatrixRequest(requestMatrix, palette), selectedSuggestion);
      if (currentMatrixSignatureRef.current !== requestSignature) {
        setError("The canvas changed before the revision finished. Request a new revision.");
        return;
      }

      const nextMatrix = createRevisionMatrix(requestMatrix, response.pixels);
      const revision: AIRevisionItem = {
        id: `${Date.now()}-${selectedSuggestion.id}`,
        label: response.label,
        explanation: response.explanation,
        matrix: nextMatrix,
        baseSignature: requestSignature,
      };
      setRevisionMatrix(nextMatrix);
      setRevisionBaseSignature(requestSignature);
      setRevisionLabel(response.label);
      setRevisionExplanation(response.explanation);
      setSelectedRevisionId(revision.id);
      setRevisionHistory((current) => [revision, ...current].slice(0, 8));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "AI request failed.");
    } finally {
      setLoadingRevision(false);
    }
  }

  function handleApplyRevision() {
    if (!revisionMatrix) return;
    if (revisionBaseSignature !== currentMatrixSignatureRef.current) {
      setError("This AI revision cannot be applied because the canvas changed since it was generated.");
      return;
    }

    commitMatrix(revisionMatrix);
    setSelectedRevisionId(null);
  }

  function handleSelectRevision(revision: RevisionItem) {
    const storedRevision = revisionHistory.find((item) => item.id === revision.id);
    if (!storedRevision) return;

    setRevisionMatrix(storedRevision.matrix);
    setRevisionBaseSignature(storedRevision.baseSignature);
    setRevisionLabel(storedRevision.label);
    setRevisionExplanation(storedRevision.explanation);
    setSelectedRevisionId(storedRevision.id);
    setError(null);
  }

  return (
    <main className="appShell">
      <header className="studioHeader">
        <div>
          <p className="eyebrow">Pixel editor</p>
          <h1>AI Pixel Co-Creation Studio</h1>
          <p>Sketch, ask for critique, and compare a focused AI revision before applying it.</p>
        </div>
      </header>

      <section className="workspace" aria-label="Pixel studio workspace">
        <aside className="leftRail" aria-label="Drawing controls">
          <StudioToolbar
            tool={tool}
            brushSize={brushSize}
            maxBrushSize={Math.min(matrix.width, matrix.height)}
            canUndo={history.past.length > 0}
            canRedo={history.future.length > 0}
            onToolChange={setTool}
            onBrushSizeChange={(size) => setBrushSize(clampBrushSize(size, Math.min(matrix.width, matrix.height)))}
            onUndo={() => replaceHistory(undoHistory(history))}
            onRedo={() => replaceHistory(redoHistory(history))}
            onClear={() => commitMatrix(createPixelMatrix(CANVAS_SIZE, CANVAS_SIZE))}
            onExport={() => exportMatrixAsPng(matrix)}
          />
          <section className="controlPanel" aria-label="Palette">
            <div className="panelHeader">
              <h2>Palette</h2>
              <span className="selectedColor" style={{ background: selectedColor }} aria-label={selectedColor} />
            </div>
            <ColorPalette
              palette={palette}
              selectedColor={selectedColor}
              onSelect={setSelectedColor}
              onReplace={handleReplaceColor}
            />
          </section>
        </aside>

        <section className="canvasGrid" aria-label="Canvas comparison">
          <PixelCanvas
            label="Original"
            matrix={matrix}
            editable
            onPaint={handlePaint}
            onPick={handlePick}
          />
          <PixelCanvas label={revisionLabel} matrix={comparisonMatrix} />
          <p className="revisionNote">{revisionExplanation}</p>
        </section>

        <aside className="rightRail" aria-label="AI controls">
          <AIPanel
            critique={critique}
            selectedSuggestionId={selectedSuggestionId}
            loadingCritique={loadingCritique}
            loadingRevision={loadingRevision}
            error={error}
            hasRevision={revisionMatrix !== null}
            onCritique={handleCritique}
            onSelectSuggestion={(suggestion: Suggestion) => setSelectedSuggestionId(suggestion.id)}
            onDemonstrate={handleDemonstrate}
            onApplyRevision={handleApplyRevision}
          />
          <RevisionHistory
            revisions={revisionHistory}
            selectedRevisionId={selectedRevisionId}
            onSelect={handleSelectRevision}
          />
        </aside>
      </section>
    </main>
  );
}
