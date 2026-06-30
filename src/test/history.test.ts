import { describe, expect, it } from "vitest";
import { createPixelMatrix, setPixel } from "@/lib/pixel/matrix";
import {
  applyHistoryChange,
  createHistoryState,
  redoHistory,
  undoHistory,
} from "@/lib/pixel/history";

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
