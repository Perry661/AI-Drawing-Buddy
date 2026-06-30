# AI-Drawing-Buddy

AI Drawing-Buddy is an AI-assisted pixel-art studio for the theme:

> Create art that couldn't exist without technology.

The project is designed as a practical creative tool. Artists draw pixel art first, then ask an AI art director for coordinate-aware critique and a side-by-side generated revision. The artwork evolves through a human-machine loop: draw, critique, compare, apply, and continue.

## Core Idea

Traditional drawing tools can help you place marks on a canvas. AI Drawing-Buddy treats the artwork as a computational pixel matrix that an AI can inspect, discuss, and transform.

The AI should be able to say things like:

- "Darken the region around x:2-6, y:3-5 to frame the subject."
- "Remove the isolated pixel at x:14, y:8 because it weakens the silhouette."
- "Add a highlight near x:17, y:10 to improve the focal point."

Then the app can generate a revised version next to the original, letting the artist compare the AI's interpretation without losing their own work.

## Planned Experience

- English-language interface.
- Pixel editor with pencil, eraser, fill bucket, eyedropper, undo, redo, clear, and PNG export.
- Side-by-side workspace: original canvas on the left, AI revision on the right.
- AI critique panel with structured suggestions and specific coordinates or regions.
- "Show Me" action that generates a revised pixel matrix.
- "Apply Revision" action that updates the original only when the artist chooses.
- Lightweight revision history for recent AI-generated versions.

## Tech Plan

- Next.js + TypeScript.
- React client components for the editor.
- HTML canvas rendering backed by a typed pixel matrix.
- Next.js API routes for AI critique and demonstration.
- OpenAI API key stored only on the server through `OPENAI_API_KEY`.
- Vercel deployment.
- Vitest for pixel matrix and schema tests.

## Local Development

The implementation plan is documented in:

- `docs/superpowers/specs/2026-06-30-ai-pixel-co-creation-studio-design.md`
- `docs/superpowers/plans/2026-06-30-ai-pixel-co-creation-studio.md`

After the app is scaffolded:

```bash
npm install
npm run dev
```

For AI features, create `.env.local`:

```bash
OPENAI_API_KEY=sk-your-key-here
```

The browser must never receive this key. It should only call internal API routes such as `/api/critique` and `/api/demonstrate`.
