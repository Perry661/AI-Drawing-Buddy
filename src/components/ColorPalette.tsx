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

function getColorInputLabel(index: number, color: string): string {
  if (color === "transparent") {
    return `Edit swatch ${index + 1} (transparent uses #000000 color picker fallback)`;
  }
  return `Edit swatch ${index + 1}`;
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
          key={index}
          className={selectedColor === color ? "swatch activeSwatch" : "swatch"}
        >
          <button
            type="button"
            style={{ background: color }}
            aria-label={`Select ${color}`}
            aria-pressed={selectedColor === color}
            onClick={() => onSelect(color)}
          />
          <input
            type="color"
            value={normalizeColorInputValue(color)}
            aria-label={getColorInputLabel(index, color)}
            onChange={(event) => onReplace(index, event.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
