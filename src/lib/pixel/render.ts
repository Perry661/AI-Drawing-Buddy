import type { PixelMatrix } from "./types";

export function drawPixelMatrix(
  canvas: HTMLCanvasElement,
  matrix: PixelMatrix,
  options: { showGrid?: boolean; background?: string } = {},
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const pixelSize = Math.floor(
    Math.min(canvas.width / matrix.width, canvas.height / matrix.height),
  );
  const offsetX = Math.floor((canvas.width - pixelSize * matrix.width) / 2);
  const offsetY = Math.floor((canvas.height - pixelSize * matrix.height) / 2);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = options.background ?? "#ffffff";
  context.fillRect(offsetX, offsetY, pixelSize * matrix.width, pixelSize * matrix.height);

  matrix.pixels.forEach((color, index) => {
    if (color === "transparent") return;
    const x = index % matrix.width;
    const y = Math.floor(index / matrix.width);
    context.fillStyle = color;
    context.fillRect(offsetX + x * pixelSize, offsetY + y * pixelSize, pixelSize, pixelSize);
  });

  if (options.showGrid) {
    context.strokeStyle = "rgba(23, 23, 23, 0.12)";
    context.lineWidth = 1;
    for (let x = 0; x <= matrix.width; x += 1) {
      const px = offsetX + x * pixelSize;
      context.beginPath();
      context.moveTo(px, offsetY);
      context.lineTo(px, offsetY + matrix.height * pixelSize);
      context.stroke();
    }
    for (let y = 0; y <= matrix.height; y += 1) {
      const py = offsetY + y * pixelSize;
      context.beginPath();
      context.moveTo(offsetX, py);
      context.lineTo(offsetX + matrix.width * pixelSize, py);
      context.stroke();
    }
  }
}

export function canvasPointToPixel(
  canvas: HTMLCanvasElement,
  matrix: PixelMatrix,
  clientX: number,
  clientY: number,
) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const xOnCanvas = (clientX - rect.left) * scaleX;
  const yOnCanvas = (clientY - rect.top) * scaleY;
  const pixelSize = Math.floor(
    Math.min(canvas.width / matrix.width, canvas.height / matrix.height),
  );
  const offsetX = Math.floor((canvas.width - pixelSize * matrix.width) / 2);
  const offsetY = Math.floor((canvas.height - pixelSize * matrix.height) / 2);
  const x = Math.floor((xOnCanvas - offsetX) / pixelSize);
  const y = Math.floor((yOnCanvas - offsetY) / pixelSize);
  if (x < 0 || y < 0 || x >= matrix.width || y >= matrix.height) return null;
  return { x, y };
}
