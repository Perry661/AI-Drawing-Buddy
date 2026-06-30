"use client";

type ColorPaletteProps = {
  palette: string[];
  selectedColor: string;
  onSelect: (color: string) => void;
  onReplace: (index: number, color: string) => void;
};

export function ColorPalette({
  palette,
  selectedColor,
  onSelect,
  onReplace,
}: ColorPaletteProps) {
  return (
    <div className="palette" aria-label="Color palette">
      {palette.map((color, index) => (
        <label
          key={`${color}-${index}`}
          className={selectedColor === color ? "swatch activeSwatch" : "swatch"}
        >
          <button
            type="button"
            style={{ background: color }}
            aria-label={`Select ${color}`}
            onClick={() => onSelect(color)}
          />
          <input
            type="color"
            value={color}
            aria-label={`Edit swatch ${index + 1}`}
            onChange={(event) => onReplace(index, event.target.value)}
          />
        </label>
      ))}
    </div>
  );
}
