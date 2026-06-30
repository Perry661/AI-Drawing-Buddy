"use client";

export type Tool = "pencil" | "eraser" | "fill" | "eyedropper";

type StudioToolbarProps = {
  tool: Tool;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
};

const tools: Tool[] = ["pencil", "eraser", "fill", "eyedropper"];

export function StudioToolbar(props: StudioToolbarProps) {
  return (
    <div className="toolbar" aria-label="Drawing tools">
      {tools.map((tool) => (
        <button
          key={tool}
          className={props.tool === tool ? "activeButton" : ""}
          type="button"
          onClick={() => props.onToolChange(tool)}
        >
          {tool}
        </button>
      ))}
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
