"use client";

export type Tool = "pencil" | "eraser" | "fill" | "eyedropper";

type StudioToolbarProps = {
  tool: Tool;
  brushSize: number;
  maxBrushSize: number;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: Tool) => void;
  onBrushSizeChange: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
};

const tools: Tool[] = ["pencil", "eraser", "fill", "eyedropper"];

const toolLabels: Record<Tool, string> = {
  pencil: "Pencil",
  eraser: "Eraser",
  fill: "Fill",
  eyedropper: "Eyedropper",
};

export function StudioToolbar(props: StudioToolbarProps) {
  const canShrinkBrush = props.brushSize > 1;
  const canGrowBrush = props.brushSize < props.maxBrushSize;

  return (
    <div className="toolbar" role="toolbar" aria-label="Drawing tools">
      {tools.map((tool) => (
        <button
          key={tool}
          className={props.tool === tool ? "activeButton" : ""}
          type="button"
          aria-pressed={props.tool === tool}
          onClick={() => props.onToolChange(tool)}
        >
          {toolLabels[tool]}
        </button>
      ))}
      <div className="brushStepper" aria-label="Brush size">
        <span>Brush Size</span>
        <div>
          <button
            type="button"
            aria-label="Decrease brush size"
            onClick={() => props.onBrushSizeChange(props.brushSize - 1)}
            disabled={!canShrinkBrush}
          >
            -
          </button>
          <output aria-live="polite" aria-label="Current brush size">
            {props.brushSize}x{props.brushSize}
          </output>
          <button
            type="button"
            aria-label="Increase brush size"
            onClick={() => props.onBrushSizeChange(props.brushSize + 1)}
            disabled={!canGrowBrush}
          >
            +
          </button>
        </div>
      </div>
      <button type="button" onClick={props.onUndo} disabled={!props.canUndo}>
        Undo
      </button>
      <button type="button" onClick={props.onRedo} disabled={!props.canRedo}>
        Redo
      </button>
      <button type="button" onClick={props.onClear}>
        Clear
      </button>
      <button type="button" onClick={props.onExport}>
        Export PNG
      </button>
    </div>
  );
}
