"use client";

import { useMemo, useState } from "react";
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
  setPixel,
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

function getPaintColor(tool: Tool, selectedColor: PixelColor) {
  return tool === "eraser" ? TRANSPARENT : selectedColor;
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
  const [palette, setPalette] = useState(INITIAL_PALETTE);
  const [selectedColor, setSelectedColor] = useState(INITIAL_PALETTE[0]);
  const [critique, setCritique] = useState<CritiqueResponse | null>(null);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [revisionMatrix, setRevisionMatrix] = useState<PixelMatrix | null>(null);
  const [revisionLabel, setRevisionLabel] = useState("AI Revision");
  const [revisionExplanation, setRevisionExplanation] = useState(
    "Select a suggestion and generate a revision to compare it here.",
  );
  const [revisionHistory, setRevisionHistory] = useState<RevisionItem[]>([]);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);
  const [loadingCritique, setLoadingCritique] = useState(false);
  const [loadingRevision, setLoadingRevision] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matrix = history.present;
  const selectedSuggestion = useMemo(
    () => critique?.suggestions.find((suggestion) => suggestion.id === selectedSuggestionId) ?? null,
    [critique, selectedSuggestionId],
  );
  const comparisonMatrix = revisionMatrix ?? createPixelMatrix(CANVAS_SIZE, CANVAS_SIZE);

  function commitMatrix(next: PixelMatrix) {
    setHistory((current) => {
      if (current.present === next) return current;
      if (current.present.pixels.every((color, index) => color === next.pixels[index])) {
        return current;
      }
      return applyHistoryChange(current, next);
    });
  }

  function handlePaint(x: number, y: number) {
    if (tool === "eyedropper") {
      setSelectedColor(getPixel(matrix, x, y));
      return;
    }

    const color = getPaintColor(tool, selectedColor);
    const next = tool === "fill" ? floodFill(matrix, x, y, color) : setPixel(matrix, x, y, color);
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
    setLoadingCritique(true);
    setError(null);
    setCritique(null);
    setSelectedSuggestionId(null);
    setRevisionMatrix(null);
    setSelectedRevisionId(null);
    setRevisionLabel("AI Revision");
    setRevisionExplanation("Select a suggestion and generate a revision to compare it here.");

    try {
      const response = await requestCritique(createMatrixRequest(matrix, palette));
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

    setLoadingRevision(true);
    setError(null);

    try {
      const response = await requestDemonstration(createMatrixRequest(matrix, palette), selectedSuggestion);
      const nextMatrix = createRevisionMatrix(matrix, response.pixels);
      const revision: RevisionItem = {
        id: `${Date.now()}-${selectedSuggestion.id}`,
        label: response.label,
        explanation: response.explanation,
        matrix: nextMatrix,
      };
      setRevisionMatrix(nextMatrix);
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
    commitMatrix(revisionMatrix);
    setSelectedRevisionId(null);
  }

  function handleSelectRevision(revision: RevisionItem) {
    setRevisionMatrix(revision.matrix);
    setRevisionLabel(revision.label);
    setRevisionExplanation(revision.explanation);
    setSelectedRevisionId(revision.id);
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
            canUndo={history.past.length > 0}
            canRedo={history.future.length > 0}
            onToolChange={setTool}
            onUndo={() => setHistory(undoHistory)}
            onRedo={() => setHistory(redoHistory)}
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
