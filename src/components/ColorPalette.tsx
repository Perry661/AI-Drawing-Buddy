"use client";

type ColorPaletteProps = {
  palette: string[];
  selectedColor: string;
  onSelect: (color: string) => void;
  onReplace: (index: number, color: string) => void;
};

function normalizeColorInputValue(color: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color.toLowerCase();
  const shortHex = color.match(/^#([0-9a-fA-F]{3})$/);
  if (shortHex) {
    return `#${shortHex[1]
      .split("")
      .map((digit) => digit + digit)
      .join("")
      .toLowerCase()}`;
  }
  return "#000000";
}

export function ColorPalette({
  palette,
  selectedColor,
  onSelect,
  onReplace,
}: ColorPaletteProps) {
  return (
    <div className="palette" role="group" aria-label="Color palette">
      {palette.map((color, index) => (
        <div
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
            value={normalizeColorInputValue(color)}
            aria-label={`Edit swatch ${index + 1}`}
            onChange={(event) => onReplace(index, event.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
