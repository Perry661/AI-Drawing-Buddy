# AI Pixel Co-Creation Studio Design

## Project Goal

Build a practical pixel-art creation tool that satisfies the theme: "Create art that couldn't exist without technology."

The project is an English-language web app where artists draw pixel art, ask AI for coordinate-aware critique, and generate a side-by-side AI revision. The core artistic medium is not only the final pixel image, but the iterative collaboration between a human artist and an AI art director that can inspect, critique, and transform a computational pixel matrix.

## Product Direction

The selected direction is a practical creative tool, not a static showcase or marketing site.

The first screen should be the working editor. Users should be able to draw immediately, then use AI when they want feedback. The AI should feel like a useful collaborator attached to a real pixel editor, not like a generic chatbot.

The primary layout is a before-and-after studio:

- Left: the user's original editable pixel canvas.
- Right: the AI-generated revision canvas.
- Between or below them: AI critique, selected suggestion, and actions.
- A lightweight revision history stores recent AI revisions.

## Core User Experience

The user opens the app and sees a pixel-art workspace.

The original canvas supports:

- A default `24x24` grid.
- Pencil, eraser, eyedropper, fill bucket, undo, redo, and clear.
- A compact editable color palette.
- PNG export.

The AI panel supports:

- **Get Critique**: sends the current artwork to the backend and returns specific English feedback.
- **Show Me**: asks AI to generate a modified pixel matrix based on the selected suggestion.
- **Apply Revision**: replaces the original canvas with the AI revision only when the user chooses.

The revision history supports:

- Recent AI revision thumbnails.
- Short labels such as "Higher contrast" or "Cleaner silhouette."
- Restoring a past AI revision into the comparison panel.

The MVP does not include complex branching, accounts, galleries, collaborative editing, or a database.

## Technology Stack

Use a single deployable Next.js app hosted on Vercel.

- Framework: Next.js with TypeScript.
- Frontend: React client components.
- Rendering: use an HTML canvas for the drawing surface and PNG export.
- State model: keep a typed pixel matrix as the source of truth.
- Backend: Next.js API routes.
- AI key storage: `OPENAI_API_KEY` stored server-side in Vercel environment variables.
- Validation: use schema validation for AI responses, preferably with `zod`.
- Tests: use Vitest for pure helper and schema tests.

The browser must never receive or store the OpenAI API key.

## Application Architecture

The app should be organized around clear boundaries:

- Pixel matrix helpers: create, update, fill, serialize, deserialize, and validate matrices.
- Editor state: selected tool, selected color, undo/redo stacks, active canvas.
- Rendering layer: draw the matrix to an HTML canvas and export PNG.
- AI client layer: frontend calls internal API routes.
- API routes: validate requests, call OpenAI, validate structured responses, and return safe JSON to the browser.
- Revision history: local browser state or localStorage for MVP.

The project should not require a separate database or separate server process for the first version.

## API Routes

### `POST /api/critique`

Request:

```ts
{
  width: number;
  height: number;
  pixels: string[];
  palette: string[];
  title?: string;
  intent?: string;
}
```

Response:

```ts
{
  summary: string;
  suggestions: Array<{
    id: string;
    title: string;
    reasoning: string;
    target: {
      type: "pixel" | "region" | "global";
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    };
    action:
      | "darken"
      | "lighten"
      | "remove"
      | "add_highlight"
      | "increase_contrast"
      | "simplify_shape"
      | "shift_hue";
  }>;
}
```

### `POST /api/demonstrate`

Request:

```ts
{
  width: number;
  height: number;
  pixels: string[];
  palette: string[];
  suggestion: {
    id: string;
    title: string;
    reasoning: string;
    target: {
      type: "pixel" | "region" | "global";
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    };
    action: string;
  };
}
```

Response:

```ts
{
  label: string;
  explanation: string;
  pixels: string[];
}
```

The returned `pixels` array must have exactly `width * height` entries. If not, the frontend and backend should reject it.

## AI Prompt Strategy

The model should be instructed to behave like a practical pixel-art director.

The critique prompt should require:

- Concise English feedback.
- Three to five suggestions.
- Specific coordinates or regions when possible.
- Clear reasoning tied to pixel-art concerns such as silhouette, contrast, readability, palette discipline, and focal point.
- Strict JSON output matching the schema.

The demonstration prompt should require:

- Preserving the original canvas dimensions.
- Returning only a valid pixel matrix using the supplied palette when practical.
- Making a focused change based on the selected suggestion.
- Avoiding a complete replacement unless the suggestion is global.
- Strict JSON output matching the schema.

## Error Handling

The app should fail safely.

- If `OPENAI_API_KEY` is missing, show: "AI is not configured yet. Add OPENAI_API_KEY on the server."
- If an AI request fails, keep the original canvas unchanged and allow retry.
- If AI returns invalid JSON, show a concise error and reject the response.
- If a demonstrated revision has the wrong pixel count, reject it.
- While requests are running, disable the related button and show loading states:
  - "Thinking..." for critique.
  - "Generating revision..." for demonstration.

No AI response should directly mutate the user's original artwork. Only **Apply Revision** can replace the editable canvas.

## Testing Plan

Unit tests should cover pixel matrix behavior:

- Create an empty canvas.
- Update a pixel.
- Erase a pixel.
- Flood fill contiguous regions.
- Serialize and deserialize a matrix.
- Validate matrix dimensions.

Unit tests should cover AI schema behavior:

- Valid critique response passes.
- Malformed critique response fails.
- Demonstration response with wrong pixel count fails.
- Demonstration response with valid dimensions passes.

Manual browser verification should cover:

- Draw pixels.
- Use pencil, eraser, eyedropper, and fill bucket.
- Undo and redo.
- Clear canvas.
- Get AI critique.
- Generate AI revision.
- Apply revision.
- Export PNG.

## Scope Decisions

The MVP includes:

- English UI.
- Practical pixel editor.
- Side-by-side AI revision.
- Secure server-side OpenAI integration.
- Lightweight revision history.
- Vercel deployment compatibility.

The MVP excludes:

- User accounts.
- Public gallery.
- Multiplayer collaboration.
- Database persistence.
- Complex revision branching.
- Mobile-first advanced drawing gestures.

These exclusions keep the first version focused enough to build during the competition period while still strongly matching the theme.

## Success Criteria

The project is successful if a judge can:

1. Draw a small pixel-art image.
2. Ask AI for useful coordinate-aware critique.
3. Generate an AI-modified side-by-side revision.
4. Compare the human and AI versions.
5. Apply or ignore the AI revision.
6. Understand why the artwork process could not exist without technology.

The app should feel like a usable creative tool that the maker would personally return to, not a one-off AI demo.
