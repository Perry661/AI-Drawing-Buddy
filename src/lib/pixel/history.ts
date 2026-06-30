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
