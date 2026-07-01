# AI-Drawing-Buddy

AI Drawing-Buddy is an AI-assisted pixel-art studio for the theme:

> Create art that couldn't exist without technology.

Artists draw on a 16x16 pixel canvas, then ask an AI art director for coordinate-aware critique and a side-by-side generated revision. The artwork evolves through a human-machine loop: draw, critique, compare, apply, and continue.

The project fits the theme by treating pixel art as structured data as well as an image. The canvas is a pixel matrix that software can inspect, discuss, revise, and return to the artist without replacing the artist's control.

## Features

- 16x16 pixel editor with pencil, eraser, fill bucket, and eyedropper tools.
- Editable color palette with selectable swatches.
- Undo, redo, clear canvas, and export PNG controls.
- AI critique that reads the current artwork matrix and returns structured suggestions.
- Show Me revision generation for a selected critique suggestion.
- Apply Revision control that replaces the editable canvas only when the artist chooses.
- Revision history for previously generated AI revisions.

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Add your server-side OpenRouter key in `.env.local`:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_TEXT_MODEL=deepseek/deepseek-v4-pro
```

`OPENROUTER_SITE_URL` and `OPENROUTER_APP_NAME` are optional OpenRouter attribution values. The included `.env.example` sets local defaults.

Start the development server:

```bash
npm run dev
```

## Scripts

```bash
npm test
npm run lint
npm run build
```

## Deployment

For Vercel, set `OPENROUTER_API_KEY` as a server-side environment variable. Keep `OPENROUTER_TEXT_MODEL` set to `deepseek/deepseek-v4-pro` unless you want to test another OpenRouter chat model. The browser never receives the key; client code only calls internal API routes.

## Privacy and Security

Artwork is sent as a pixel matrix only to internal API routes and then to the configured AI provider for critique and revision. Do not commit `.env.local` or any real API key.
