# AI Pixel Co-Creation Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an English-language Next.js pixel-art editor where users draw, ask AI for coordinate-aware critique, generate a side-by-side AI revision, and optionally apply it.

**Architecture:** The app is a single Vercel-deployable Next.js project. Pixel art is stored as a typed matrix and rendered to canvas; serverless API routes keep the OpenAI key server-side and return validated JSON.

**Tech Stack:** Next.js App Router, TypeScript, React, Vitest, Zod, OpenAI Node SDK, HTML Canvas, CSS modules/global CSS.

---

## File Structure

- `package.json`: project scripts and dependencies.
- `next.config.mjs`: Next.js config.
- `tsconfig.json`: TypeScript config.
- `vitest.config.ts`: Vitest config.
- `src/app/layout.tsx`: root HTML shell and metadata.
- `src/app/page.tsx`: main studio page composition.
- `src/app/globals.css`: app styling.
- `src/app/api/critique/route.ts`: server-only critique endpoint.
- `src/app/api/demonstrate/route.ts`: server-only revision endpoint.
- `src/components/PixelCanvas.tsx`: canvas drawing surface.
- `src/components/StudioToolbar.tsx`: drawing tools and actions.
- `src/components/ColorPalette.tsx`: swatches and color picker.
- `src/components/AIPanel.tsx`: critique, suggestions, loading, errors.
- `src/components/RevisionHistory.tsx`: recent revision thumbnails.
- `src/lib/pixel/types.ts`: pixel and editor types.
- `src/lib/pixel/matrix.ts`: pure pixel matrix helpers.
- `src/lib/pixel/history.ts`: undo/redo helpers.
- `src/lib/pixel/render.ts`: canvas rendering/export helpers.
- `src/lib/ai/schemas.ts`: request/response schemas.
- `src/lib/ai/prompts.ts`: OpenAI prompt builders.
- `src/lib/ai/client.ts`: browser client for internal API routes.
- `src/lib/ai/openai.ts`: server-only OpenAI call helpers.
- `src/test/*.test.ts`: unit tests for pure logic and schemas.

## Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`
- Create: `next.config.mjs`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Create project config files**

Create `package.json`:

```json
{
  "name": "ai-pixel-co-creation-studio",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.3.0",
    "openai": "^4.104.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/node": "^22.15.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.8.0",
    "vitest": "^3.2.0"
  }
}
```

Create `next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/test/**/*.test.ts"],
  },
});
```

- [ ] **Step 2: Create minimal app shell**

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Pixel Co-Creation Studio",
  description: "A practical pixel-art editor with coordinate-aware AI critique and generated revisions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Create `src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="appShell">
      <h1>AI Pixel Co-Creation Studio</h1>
      <p>Draw pixel art, ask for critique, and compare an AI-generated revision.</p>
    </main>
  );
}
```

Create `src/app/globals.css`:

```css
:root {
  color-scheme: light;
  --bg: #f6f7f9;
  --panel: #ffffff;
  --ink: #171717;
  --muted: #667085;
  --line: #d7dde5;
  --accent: #2563eb;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button,
input {
  font: inherit;
}

.appShell {
  min-height: 100vh;
  padding: 24px;
}
```

- [ ] **Step 3: Install dependencies**

Run: `npm install`

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 4: Verify scaffold**

Run: `npm test`

Expected: Vitest exits successfully with no tests or a pass summary.

Run: `npm run build`

Expected: Next.js production build succeeds.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json next.config.mjs tsconfig.json vitest.config.ts src/app
git commit -m "chore: scaffold next app"
```

## Task 2: Define Pixel Matrix Helpers With Tests

**Files:**
- Create: `src/lib/pixel/types.ts`
- Create: `src/lib/pixel/matrix.ts`
- Create: `src/test/pixel-matrix.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/test/pixel-matrix.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  createPixelMatrix,
  floodFill,
  getPixel,
  serializeMatrix,
  setPixel,
  validatePixelCount,
} from "@/lib/pixel/matrix";

describe("pixel matrix helpers", () => {
  it("creates an empty canvas with transparent pixels", () => {
    const matrix = createPixelMatrix(3, 2);
    expect(matrix.width).toBe(3);
    expect(matrix.height).toBe(2);
    expect(matrix.pixels).toEqual(["transparent", "transparent", "transparent", "transparent", "transparent", "transparent"]);
  });

  it("updates one pixel without mutating the original matrix", () => {
    const matrix = createPixelMatrix(2, 2);
    const updated = setPixel(matrix, 1, 0, "#ff0000");
    expect(getPixel(updated, 1, 0)).toBe("#ff0000");
    expect(getPixel(matrix, 1, 0)).toBe("transparent");
  });

  it("flood fills a contiguous color region", () => {
    const matrix = {
      width: 3,
      height: 3,
      pixels: ["#111", "#111", "#222", "#111", "#222", "#222", "#111", "#111", "#222"],
    };
    const filled = floodFill(matrix, 0, 0, "#999");
    expect(filled.pixels).toEqual(["#999", "#999", "#222", "#999", "#222", "#222", "#999", "#999", "#222"]);
  });

  it("serializes and restores a matrix", () => {
    const matrix = setPixel(createPixelMatrix(2, 1), 0, 0, "#123456");
    expect(serializeMatrix(matrix)).toEqual({
      width: 2,
      height: 1,
      pixels: ["#123456", "transparent"],
    });
  });

  it("validates exact pixel count", () => {
    expect(validatePixelCount(2, 2, ["a", "b", "c", "d"])).toBe(true);
    expect(validatePixelCount(2, 2, ["a", "b", "c"])).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/test/pixel-matrix.test.ts`

Expected: FAIL because `@/lib/pixel/matrix` does not exist.

- [ ] **Step 3: Implement pixel helpers**

Create `src/lib/pixel/types.ts`:

```ts
export type PixelColor = string;

export type PixelMatrix = {
  width: number;
  height: number;
  pixels: PixelColor[];
};
```

Create `src/lib/pixel/matrix.ts`:

```ts
import type { PixelColor, PixelMatrix } from "./types";

export const TRANSPARENT: PixelColor = "transparent";

export function validatePixelCount(width: number, height: number, pixels: PixelColor[]) {
  return Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0 && pixels.length === width * height;
}

export function createPixelMatrix(width: number, height: number, fill: PixelColor = TRANSPARENT): PixelMatrix {
  return { width, height, pixels: Array.from({ length: width * height }, () => fill) };
}

export function toIndex(matrix: PixelMatrix, x: number, y: number) {
  if (x < 0 || y < 0 || x >= matrix.width || y >= matrix.height) {
    throw new RangeError(`Pixel coordinate out of bounds: ${x}, ${y}`);
  }
  return y * matrix.width + x;
}

export function getPixel(matrix: PixelMatrix, x: number, y: number) {
  return matrix.pixels[toIndex(matrix, x, y)];
}

export function setPixel(matrix: PixelMatrix, x: number, y: number, color: PixelColor): PixelMatrix {
  const pixels = [...matrix.pixels];
  pixels[toIndex(matrix, x, y)] = color;
  return { ...matrix, pixels };
}

export function floodFill(matrix: PixelMatrix, x: number, y: number, color: PixelColor): PixelMatrix {
  const target = getPixel(matrix, x, y);
  if (target === color) return matrix;

  const pixels = [...matrix.pixels];
  const stack: Array<[number, number]> = [[x, y]];
  const seen = new Set<number>();

  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!;
    if (cx < 0 || cy < 0 || cx >= matrix.width || cy >= matrix.height) continue;
    const index = cy * matrix.width + cx;
    if (seen.has(index) || pixels[index] !== target) continue;
    seen.add(index);
    pixels[index] = color;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }

  return { ...matrix, pixels };
}

export function serializeMatrix(matrix: PixelMatrix): PixelMatrix {
  return { width: matrix.width, height: matrix.height, pixels: [...matrix.pixels] };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/test/pixel-matrix.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pixel src/test/pixel-matrix.test.ts
git commit -m "feat: add pixel matrix helpers"
```

## Task 3: Define AI Schemas With Tests

**Files:**
- Create: `src/lib/ai/schemas.ts`
- Create: `src/test/ai-schemas.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/test/ai-schemas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CritiqueResponseSchema, DemonstrationResponseSchema, validateDemonstrationPixels } from "@/lib/ai/schemas";

describe("AI schemas", () => {
  it("accepts a valid critique response", () => {
    const parsed = CritiqueResponseSchema.parse({
      summary: "The silhouette reads clearly but needs stronger contrast.",
      suggestions: [
        {
          id: "s1",
          title: "Increase top-left contrast",
          reasoning: "A darker corner frames the subject.",
          target: { type: "region", x: 0, y: 0, width: 4, height: 4 },
          action: "darken",
        },
      ],
    });
    expect(parsed.suggestions[0].target.type).toBe("region");
  });

  it("rejects malformed critique responses", () => {
    expect(() => CritiqueResponseSchema.parse({ summary: "Missing suggestions" })).toThrow();
  });

  it("rejects demonstration responses with wrong pixel count", () => {
    const response = DemonstrationResponseSchema.parse({
      label: "Higher contrast",
      explanation: "Darkened the frame.",
      pixels: ["#000"],
    });
    expect(validateDemonstrationPixels(2, 2, response)).toBe(false);
  });

  it("accepts demonstration responses with exact dimensions", () => {
    const response = DemonstrationResponseSchema.parse({
      label: "Higher contrast",
      explanation: "Darkened the frame.",
      pixels: ["#000", "#111", "#222", "transparent"],
    });
    expect(validateDemonstrationPixels(2, 2, response)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/test/ai-schemas.test.ts`

Expected: FAIL because `@/lib/ai/schemas` does not exist.

- [ ] **Step 3: Implement schemas**

Create `src/lib/ai/schemas.ts`:

```ts
import { z } from "zod";

export const PixelColorSchema = z.string().min(1);

export const MatrixRequestSchema = z.object({
  width: z.number().int().positive().max(64),
  height: z.number().int().positive().max(64),
  pixels: z.array(PixelColorSchema),
  palette: z.array(z.string().min(1)).min(1).max(32),
  title: z.string().max(80).optional(),
  intent: z.string().max(240).optional(),
});

export const SuggestionActionSchema = z.enum([
  "darken",
  "lighten",
  "remove",
  "add_highlight",
  "increase_contrast",
  "simplify_shape",
  "shift_hue",
]);

export const SuggestionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(80),
  reasoning: z.string().min(1).max(360),
  target: z.object({
    type: z.enum(["pixel", "region", "global"]),
    x: z.number().int().nonnegative().optional(),
    y: z.number().int().nonnegative().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  }),
  action: SuggestionActionSchema,
});

export const CritiqueResponseSchema = z.object({
  summary: z.string().min(1).max(500),
  suggestions: z.array(SuggestionSchema).min(1).max(5),
});

export const DemonstrationResponseSchema = z.object({
  label: z.string().min(1).max(80),
  explanation: z.string().min(1).max(500),
  pixels: z.array(PixelColorSchema),
});

export type MatrixRequest = z.infer<typeof MatrixRequestSchema>;
export type CritiqueResponse = z.infer<typeof CritiqueResponseSchema>;
export type DemonstrationResponse = z.infer<typeof DemonstrationResponseSchema>;
export type Suggestion = z.infer<typeof SuggestionSchema>;

export function validateMatrixRequestPixels(input: MatrixRequest) {
  return input.pixels.length === input.width * input.height;
}

export function validateDemonstrationPixels(width: number, height: number, response: DemonstrationResponse) {
  return response.pixels.length === width * height;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/test/ai-schemas.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/schemas.ts src/test/ai-schemas.test.ts
git commit -m "feat: add ai response schemas"
```

## Task 4: Add Undo/Redo History Helpers

**Files:**
- Create: `src/lib/pixel/history.ts`
- Create: `src/test/history.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/test/history.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createPixelMatrix, setPixel } from "@/lib/pixel/matrix";
import { applyHistoryChange, createHistoryState, redoHistory, undoHistory } from "@/lib/pixel/history";

describe("history helpers", () => {
  it("pushes previous canvas when applying a change", () => {
    const original = createPixelMatrix(1, 1);
    const changed = setPixel(original, 0, 0, "#fff");
    const state = applyHistoryChange(createHistoryState(original), changed);
    expect(state.past).toHaveLength(1);
    expect(state.present.pixels).toEqual(["#fff"]);
    expect(state.future).toHaveLength(0);
  });

  it("undoes and redoes changes", () => {
    const original = createPixelMatrix(1, 1);
    const changed = setPixel(original, 0, 0, "#fff");
    const afterChange = applyHistoryChange(createHistoryState(original), changed);
    const undone = undoHistory(afterChange);
    expect(undone.present.pixels).toEqual(["transparent"]);
    const redone = redoHistory(undone);
    expect(redone.present.pixels).toEqual(["#fff"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/test/history.test.ts`

Expected: FAIL because `@/lib/pixel/history` does not exist.

- [ ] **Step 3: Implement history helpers**

Create `src/lib/pixel/history.ts`:

```ts
import type { PixelMatrix } from "./types";

export type HistoryState = {
  past: PixelMatrix[];
  present: PixelMatrix;
  future: PixelMatrix[];
};

export function createHistoryState(initial: PixelMatrix): HistoryState {
  return { past: [], present: initial, future: [] };
}

export function applyHistoryChange(state: HistoryState, next: PixelMatrix): HistoryState {
  return { past: [...state.past, state.present], present: next, future: [] };
}

export function undoHistory(state: HistoryState): HistoryState {
  const previous = state.past.at(-1);
  if (!previous) return state;
  return {
    past: state.past.slice(0, -1),
    present: previous,
    future: [state.present, ...state.future],
  };
}

export function redoHistory(state: HistoryState): HistoryState {
  const next = state.future[0];
  if (!next) return state;
  return {
    past: [...state.past, state.present],
    present: next,
    future: state.future.slice(1),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/test/history.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pixel/history.ts src/test/history.test.ts
git commit -m "feat: add pixel history helpers"
```

## Task 5: Add Canvas Rendering Helpers

**Files:**
- Create: `src/lib/pixel/render.ts`

- [ ] **Step 1: Create rendering helper**

Create `src/lib/pixel/render.ts`:

```ts
import type { PixelMatrix } from "./types";

export function drawPixelMatrix(
  canvas: HTMLCanvasElement,
  matrix: PixelMatrix,
  options: { showGrid?: boolean; background?: string } = {},
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const pixelSize = Math.floor(Math.min(canvas.width / matrix.width, canvas.height / matrix.height));
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
  const pixelSize = Math.floor(Math.min(canvas.width / matrix.width, canvas.height / matrix.height));
  const offsetX = Math.floor((canvas.width - pixelSize * matrix.width) / 2);
  const offsetY = Math.floor((canvas.height - pixelSize * matrix.height) / 2);
  const x = Math.floor((xOnCanvas - offsetX) / pixelSize);
  const y = Math.floor((yOnCanvas - offsetY) / pixelSize);
  if (x < 0 || y < 0 || x >= matrix.width || y >= matrix.height) return null;
  return { x, y };
}
```

- [ ] **Step 2: Typecheck via build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pixel/render.ts
git commit -m "feat: add canvas render helpers"
```

## Task 6: Build Editor Components

**Files:**
- Create: `src/components/PixelCanvas.tsx`
- Create: `src/components/StudioToolbar.tsx`
- Create: `src/components/ColorPalette.tsx`

- [ ] **Step 1: Create pixel canvas component**

Create `src/components/PixelCanvas.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { canvasPointToPixel, drawPixelMatrix } from "@/lib/pixel/render";
import type { PixelMatrix } from "@/lib/pixel/types";

type PixelCanvasProps = {
  label: string;
  matrix: PixelMatrix;
  editable?: boolean;
  onPaint?: (x: number, y: number) => void;
  onPick?: (x: number, y: number) => void;
};

export function PixelCanvas({ label, matrix, editable = false, onPaint, onPick }: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawPixelMatrix(canvas, matrix, { showGrid: true });
  }, [matrix]);

  function handlePointer(event: React.PointerEvent<HTMLCanvasElement>) {
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
        onPointerDown={(event) => {
          setIsDrawing(true);
          handlePointer(event);
        }}
        onPointerMove={(event) => {
          if (isDrawing) handlePointer(event);
        }}
        onPointerUp={() => setIsDrawing(false)}
        onPointerLeave={() => setIsDrawing(false)}
      />
    </section>
  );
}
```

- [ ] **Step 2: Create toolbar and palette components**

Create `src/components/StudioToolbar.tsx`:

```tsx
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
      <button type="button" onClick={props.onUndo} disabled={!props.canUndo}>Undo</button>
      <button type="button" onClick={props.onRedo} disabled={!props.canRedo}>Redo</button>
      <button type="button" onClick={props.onClear}>Clear</button>
      <button type="button" onClick={props.onExport}>Export PNG</button>
    </div>
  );
}
```

Create `src/components/ColorPalette.tsx`:

```tsx
"use client";

type ColorPaletteProps = {
  palette: string[];
  selectedColor: string;
  onSelect: (color: string) => void;
  onReplace: (index: number, color: string) => void;
};

export function ColorPalette({ palette, selectedColor, onSelect, onReplace }: ColorPaletteProps) {
  return (
    <div className="palette" aria-label="Color palette">
      {palette.map((color, index) => (
        <label key={`${color}-${index}`} className={selectedColor === color ? "swatch activeSwatch" : "swatch"}>
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
```

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/PixelCanvas.tsx src/components/StudioToolbar.tsx src/components/ColorPalette.tsx
git commit -m "feat: add pixel editor components"
```

## Task 7: Add AI Routes and Prompt Builders

**Files:**
- Create: `src/lib/ai/prompts.ts`
- Create: `src/lib/ai/openai.ts`
- Create: `src/app/api/critique/route.ts`
- Create: `src/app/api/demonstrate/route.ts`

- [ ] **Step 1: Create prompt builders and OpenAI helper**

Create `src/lib/ai/prompts.ts`:

```ts
import type { MatrixRequest, Suggestion } from "./schemas";

export function buildCritiquePrompt(input: MatrixRequest) {
  return [
    "You are a practical pixel-art director.",
    "Return strict JSON only.",
    "Give 3 to 5 concise, coordinate-aware suggestions.",
    "Focus on silhouette, contrast, readability, palette discipline, and focal point.",
    `Canvas: ${input.width}x${input.height}`,
    `Palette: ${input.palette.join(", ")}`,
    `Pixels row-major: ${JSON.stringify(input.pixels)}`,
    input.title ? `Title: ${input.title}` : "",
    input.intent ? `Artist intent: ${input.intent}` : "",
  ].filter(Boolean).join("\n");
}

export function buildDemonstrationPrompt(input: MatrixRequest, suggestion: Suggestion) {
  return [
    "You are revising a pixel-art matrix.",
    "Return strict JSON only with label, explanation, and pixels.",
    "Preserve the exact canvas dimensions and return exactly width * height pixels.",
    "Make a focused revision based on the selected suggestion.",
    "Use the supplied palette when practical. Use transparent only where the original uses empty space.",
    `Canvas: ${input.width}x${input.height}`,
    `Palette: ${input.palette.join(", ")}`,
    `Original pixels row-major: ${JSON.stringify(input.pixels)}`,
    `Selected suggestion: ${JSON.stringify(suggestion)}`,
  ].join("\n");
}
```

Create `src/lib/ai/openai.ts`:

```ts
import OpenAI from "openai";

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("AI is not configured yet. Add OPENAI_API_KEY on the server.");
  }
  return new OpenAI({ apiKey });
}

export async function requestJsonFromOpenAI(prompt: string) {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("AI returned an empty response.");
  return JSON.parse(content) as unknown;
}
```

- [ ] **Step 2: Create API routes**

Create `src/app/api/critique/route.ts`:

```ts
import { NextResponse } from "next/server";
import { buildCritiquePrompt } from "@/lib/ai/prompts";
import { CritiqueResponseSchema, MatrixRequestSchema, validateMatrixRequestPixels } from "@/lib/ai/schemas";
import { requestJsonFromOpenAI } from "@/lib/ai/openai";

export async function POST(request: Request) {
  try {
    const input = MatrixRequestSchema.parse(await request.json());
    if (!validateMatrixRequestPixels(input)) {
      return NextResponse.json({ error: "Pixel count does not match canvas dimensions." }, { status: 400 });
    }

    const raw = await requestJsonFromOpenAI(buildCritiquePrompt(input));
    const critique = CritiqueResponseSchema.parse(raw);
    return NextResponse.json(critique);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate critique.";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
```

Create `src/app/api/demonstrate/route.ts`:

```ts
import { NextResponse } from "next/server";
import { buildDemonstrationPrompt } from "@/lib/ai/prompts";
import {
  DemonstrationResponseSchema,
  MatrixRequestSchema,
  SuggestionSchema,
  validateDemonstrationPixels,
  validateMatrixRequestPixels,
} from "@/lib/ai/schemas";
import { requestJsonFromOpenAI } from "@/lib/ai/openai";

const DemonstrateRequestSchema = MatrixRequestSchema.extend({
  suggestion: SuggestionSchema,
});

export async function POST(request: Request) {
  try {
    const input = DemonstrateRequestSchema.parse(await request.json());
    if (!validateMatrixRequestPixels(input)) {
      return NextResponse.json({ error: "Pixel count does not match canvas dimensions." }, { status: 400 });
    }

    const raw = await requestJsonFromOpenAI(buildDemonstrationPrompt(input, input.suggestion));
    const demonstration = DemonstrationResponseSchema.parse(raw);
    if (!validateDemonstrationPixels(input.width, input.height, demonstration)) {
      return NextResponse.json({ error: "AI revision returned the wrong number of pixels." }, { status: 502 });
    }

    return NextResponse.json(demonstration);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate revision.";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
```

- [ ] **Step 3: Run tests and build**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ai/prompts.ts src/lib/ai/openai.ts src/app/api
git commit -m "feat: add ai api routes"
```

## Task 8: Add Browser AI Client and AI Panel

**Files:**
- Create: `src/lib/ai/client.ts`
- Create: `src/components/AIPanel.tsx`
- Create: `src/components/RevisionHistory.tsx`

- [ ] **Step 1: Create browser API client**

Create `src/lib/ai/client.ts`:

```ts
import type { CritiqueResponse, DemonstrationResponse, MatrixRequest, Suggestion } from "./schemas";

async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "AI request failed.");
  }
  return data as TResponse;
}

export function requestCritique(input: MatrixRequest) {
  return postJson<CritiqueResponse>("/api/critique", input);
}

export function requestDemonstration(input: MatrixRequest, suggestion: Suggestion) {
  return postJson<DemonstrationResponse>("/api/demonstrate", { ...input, suggestion });
}
```

- [ ] **Step 2: Create AI panel and history components**

Create `src/components/AIPanel.tsx`:

```tsx
"use client";

import type { CritiqueResponse, Suggestion } from "@/lib/ai/schemas";

type AIPanelProps = {
  critique: CritiqueResponse | null;
  selectedSuggestionId: string | null;
  loadingCritique: boolean;
  loadingRevision: boolean;
  error: string | null;
  hasRevision: boolean;
  onCritique: () => void;
  onSelectSuggestion: (suggestion: Suggestion) => void;
  onDemonstrate: () => void;
  onApplyRevision: () => void;
};

export function AIPanel(props: AIPanelProps) {
  const selected = props.critique?.suggestions.find((suggestion) => suggestion.id === props.selectedSuggestionId) ?? null;

  return (
    <section className="aiPanel" aria-label="AI critique">
      <div className="panelHeader">
        <h2>AI Art Director</h2>
        <button type="button" onClick={props.onCritique} disabled={props.loadingCritique}>
          {props.loadingCritique ? "Thinking..." : "Get Critique"}
        </button>
      </div>

      {props.error ? <p className="errorText">{props.error}</p> : null}
      {props.critique ? <p className="summaryText">{props.critique.summary}</p> : <p className="mutedText">Ask for critique when you want a second set of eyes.</p>}

      <div className="suggestionList">
        {props.critique?.suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            className={props.selectedSuggestionId === suggestion.id ? "suggestion activeSuggestion" : "suggestion"}
            onClick={() => props.onSelectSuggestion(suggestion)}
          >
            <strong>{suggestion.title}</strong>
            <span>{suggestion.reasoning}</span>
          </button>
        ))}
      </div>

      <div className="aiActions">
        <button type="button" onClick={props.onDemonstrate} disabled={!selected || props.loadingRevision}>
          {props.loadingRevision ? "Generating revision..." : "Show Me"}
        </button>
        <button type="button" onClick={props.onApplyRevision} disabled={!props.hasRevision}>
          Apply Revision
        </button>
      </div>
    </section>
  );
}
```

Create `src/components/RevisionHistory.tsx`:

```tsx
"use client";

import type { PixelMatrix } from "@/lib/pixel/types";

export type RevisionItem = {
  id: string;
  label: string;
  explanation: string;
  matrix: PixelMatrix;
};

type RevisionHistoryProps = {
  revisions: RevisionItem[];
  onSelect: (revision: RevisionItem) => void;
};

export function RevisionHistory({ revisions, onSelect }: RevisionHistoryProps) {
  return (
    <section className="historyPanel" aria-label="Revision history">
      <h2>Revision History</h2>
      {revisions.length === 0 ? <p className="mutedText">Generated revisions will appear here.</p> : null}
      <div className="historyList">
        {revisions.map((revision) => (
          <button key={revision.id} type="button" onClick={() => onSelect(revision)}>
            <strong>{revision.label}</strong>
            <span>{revision.explanation}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ai/client.ts src/components/AIPanel.tsx src/components/RevisionHistory.tsx
git commit -m "feat: add ai panel components"
```

## Task 9: Compose Studio Page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace page with full editor**

Replace `src/app/page.tsx` with:

```tsx
"use client";

import { useMemo, useRef, useState } from "react";
import { AIPanel } from "@/components/AIPanel";
import { ColorPalette } from "@/components/ColorPalette";
import { PixelCanvas } from "@/components/PixelCanvas";
import { RevisionHistory, type RevisionItem } from "@/components/RevisionHistory";
import { StudioToolbar, type Tool } from "@/components/StudioToolbar";
import type { CritiqueResponse, Suggestion } from "@/lib/ai/schemas";
import { requestCritique, requestDemonstration } from "@/lib/ai/client";
import { createHistoryState, applyHistoryChange, redoHistory, undoHistory } from "@/lib/pixel/history";
import { createPixelMatrix, floodFill, getPixel, setPixel, TRANSPARENT } from "@/lib/pixel/matrix";
import type { PixelMatrix } from "@/lib/pixel/types";

const initialPalette = ["#111827", "#f9fafb", "#ef4444", "#f97316", "#facc15", "#22c55e", "#3b82f6", "#a855f7"];

export default function Home() {
  const [history, setHistory] = useState(() => createHistoryState(createPixelMatrix(24, 24)));
  const [tool, setTool] = useState<Tool>("pencil");
  const [palette, setPalette] = useState(initialPalette);
  const [selectedColor, setSelectedColor] = useState(initialPalette[0]);
  const [critique, setCritique] = useState<CritiqueResponse | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [revision, setRevision] = useState<PixelMatrix | null>(null);
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [loadingCritique, setLoadingCritique] = useState(false);
  const [loadingRevision, setLoadingRevision] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const aiInput = useMemo(() => ({
    width: history.present.width,
    height: history.present.height,
    pixels: history.present.pixels,
    palette,
  }), [history.present, palette]);

  function commitMatrix(matrix: PixelMatrix) {
    setHistory((current) => applyHistoryChange(current, matrix));
  }

  function handlePaint(x: number, y: number) {
    if (tool === "eyedropper") {
      setSelectedColor(getPixel(history.present, x, y));
      return;
    }
    const color = tool === "eraser" ? TRANSPARENT : selectedColor;
    const next = tool === "fill" ? floodFill(history.present, x, y, color) : setPixel(history.present, x, y, color);
    commitMatrix(next);
  }

  async function handleCritique() {
    setLoadingCritique(true);
    setError(null);
    try {
      const nextCritique = await requestCritique(aiInput);
      setCritique(nextCritique);
      setSelectedSuggestion(nextCritique.suggestions[0] ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to generate critique.");
    } finally {
      setLoadingCritique(false);
    }
  }

  async function handleDemonstrate() {
    if (!selectedSuggestion) return;
    setLoadingRevision(true);
    setError(null);
    try {
      const demonstration = await requestDemonstration(aiInput, selectedSuggestion);
      const matrix = { width: history.present.width, height: history.present.height, pixels: demonstration.pixels };
      setRevision(matrix);
      setRevisions((current) => [{ id: crypto.randomUUID(), label: demonstration.label, explanation: demonstration.explanation, matrix }, ...current].slice(0, 6));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to generate revision.");
    } finally {
      setLoadingRevision(false);
    }
  }

  function handleExport() {
    const link = document.createElement("a");
    const canvas = exportCanvasRef.current ?? document.querySelector<HTMLCanvasElement>(".canvasPanel canvas");
    if (!canvas) return;
    link.href = canvas.toDataURL("image/png");
    link.download = "ai-pixel-art.png";
    link.click();
  }

  return (
    <main className="studioShell">
      <header className="studioHeader">
        <div>
          <h1>AI Pixel Co-Creation Studio</h1>
          <p>Draw first. Ask for critique. Compare what the AI would change.</p>
        </div>
      </header>

      <StudioToolbar
        tool={tool}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onToolChange={setTool}
        onUndo={() => setHistory(undoHistory)}
        onRedo={() => setHistory(redoHistory)}
        onClear={() => commitMatrix(createPixelMatrix(24, 24))}
        onExport={handleExport}
      />

      <ColorPalette
        palette={palette}
        selectedColor={selectedColor}
        onSelect={setSelectedColor}
        onReplace={(index, color) => {
          setPalette((current) => current.map((swatch, swatchIndex) => swatchIndex === index ? color : swatch));
          setSelectedColor(color);
        }}
      />

      <div className="workspaceGrid">
        <PixelCanvas label="Original Canvas" matrix={history.present} editable onPaint={handlePaint} onPick={(x, y) => setSelectedColor(getPixel(history.present, x, y))} />
        <PixelCanvas label="AI Revision" matrix={revision ?? createPixelMatrix(24, 24)} />
      </div>

      <div className="lowerGrid">
        <AIPanel
          critique={critique}
          selectedSuggestionId={selectedSuggestion?.id ?? null}
          loadingCritique={loadingCritique}
          loadingRevision={loadingRevision}
          error={error}
          hasRevision={Boolean(revision)}
          onCritique={handleCritique}
          onSelectSuggestion={setSelectedSuggestion}
          onDemonstrate={handleDemonstrate}
          onApplyRevision={() => revision && commitMatrix(revision)}
        />
        <RevisionHistory revisions={revisions} onSelect={(item) => setRevision(item.matrix)} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Replace CSS with complete studio styling**

Replace `src/app/globals.css` with:

```css
:root {
  color-scheme: light;
  --bg: #f4f6f8;
  --panel: #ffffff;
  --ink: #15171a;
  --muted: #667085;
  --line: #d8dee8;
  --accent: #2563eb;
  --accent-strong: #1d4ed8;
  --danger: #b42318;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button,
input {
  font: inherit;
}

button {
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink);
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.studioShell {
  width: min(1440px, 100%);
  margin: 0 auto;
  padding: 20px;
}

.studioHeader {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
  margin-bottom: 16px;
}

.studioHeader h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.1;
}

.studioHeader p,
.mutedText,
.summaryText {
  color: var(--muted);
}

.toolbar,
.palette,
.aiActions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.activeButton,
.aiActions button:first-child {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.palette {
  align-items: center;
}

.swatch {
  display: grid;
  grid-template-columns: 32px;
  gap: 4px;
}

.swatch button {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  padding: 0;
}

.swatch input {
  width: 32px;
  height: 22px;
  padding: 0;
  border: 0;
}

.activeSwatch button {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

.workspaceGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.canvasPanel,
.aiPanel,
.historyPanel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
}

.panelHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.panelHeader h2,
.historyPanel h2 {
  margin: 0;
  font-size: 16px;
}

.pixelCanvas {
  width: 100%;
  aspect-ratio: 1;
  display: block;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 6px;
  touch-action: none;
}

.lowerGrid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.suggestionList,
.historyList {
  display: grid;
  gap: 8px;
}

.suggestion,
.historyList button {
  display: grid;
  gap: 4px;
  text-align: left;
}

.suggestion span,
.historyList span {
  color: var(--muted);
  font-size: 14px;
}

.activeSuggestion {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.18);
}

.errorText {
  color: var(--danger);
  font-weight: 600;
}

@media (max-width: 900px) {
  .workspaceGrid,
  .lowerGrid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/app/globals.css
git commit -m "feat: compose ai pixel studio"
```

## Task 10: Final Verification and Documentation

**Files:**
- Create: `.env.example`
- Create: `README.md`

- [ ] **Step 1: Add environment and README**

Create `.env.example`:

```bash
OPENAI_API_KEY=sk-your-key-here
```

Create `README.md`:

```md
# AI Pixel Co-Creation Studio

AI Pixel Co-Creation Studio is a practical pixel-art editor for the theme "Create art that couldn't exist without technology."

Artists draw on a pixel canvas, ask an AI art director for coordinate-aware critique, and generate a side-by-side revision that can be compared or applied.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add a server-side OpenAI key to `.env.local`:

```bash
OPENAI_API_KEY=sk-your-key-here
```

## Scripts

- `npm run dev`: start the local app.
- `npm test`: run unit tests.
- `npm run build`: verify production build.

## Deployment

Deploy to Vercel and add `OPENAI_API_KEY` as a Vercel environment variable. The browser never receives the key; it only calls internal API routes.
```

- [ ] **Step 2: Run automated verification**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 3: Run local app**

Run: `npm run dev`

Expected: local URL starts, usually `http://localhost:3000`.

- [ ] **Step 4: Manual browser verification**

Open the local URL and verify:

- Draw pixels with pencil.
- Erase pixels.
- Use fill bucket.
- Use eyedropper by selecting the eyedropper tool or Alt-clicking.
- Undo and redo work.
- Clear canvas works.
- Export PNG downloads an image.
- With `OPENAI_API_KEY` configured, **Get Critique** returns suggestions.
- **Show Me** creates an AI Revision canvas.
- **Apply Revision** replaces the original canvas.
- With no `OPENAI_API_KEY`, the app shows the configured error and keeps the canvas unchanged.

- [ ] **Step 5: Commit**

```bash
git add .env.example README.md
git commit -m "docs: add setup and deployment notes"
```

## Self-Review

Spec coverage:

- English UI: covered by all visible copy in Tasks 1, 8, 9, and 10.
- Practical pixel editor: covered by Tasks 2, 4, 5, 6, and 9.
- Side-by-side AI revision: covered by Tasks 8 and 9.
- Secure server-side OpenAI integration: covered by Task 7 and `.env.example` in Task 10.
- Lightweight revision history: covered by Tasks 8 and 9.
- Vercel compatibility: covered by Next.js architecture and README deployment notes.
- Error handling: covered by Task 7 API route responses and Task 8 UI display.
- Tests: covered by Tasks 2, 3, and 4, plus final verification.

Placeholder scan:

- No placeholder markers, deferred implementation notes, or undefined task references remain.

Type consistency:

- Pixel matrix types are defined in `src/lib/pixel/types.ts`.
- AI schema types are defined in `src/lib/ai/schemas.ts`.
- Component props use the same `PixelMatrix`, `Suggestion`, `CritiqueResponse`, and `Tool` names defined earlier.
