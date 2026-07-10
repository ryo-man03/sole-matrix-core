import { describe, expect, it } from "vitest";

import type { SessionStorage } from "../auth-session/types";
import {
  clearDiagnosisDraft,
  DIAGNOSIS_DRAFT_STORAGE_KEY,
  readDiagnosisDraft,
  writeDiagnosisDraft,
} from "./diagnosisDraft";

function createStorage(): SessionStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
}

describe("diagnosis draft", () => {
  it("restores valid answers and progress", () => {
    const storage = createStorage();
    writeDiagnosisDraft(storage, { answers: { style: "amekaji", pantsFit: "denim" }, currentQuestionIndex: 2, completed: false });
    expect(readDiagnosisDraft(storage)).toEqual({ answers: { style: "amekaji", pantsFit: "denim" }, currentQuestionIndex: 2, completed: false });
  });

  it("drops unknown answers and does not accept a false completed state", () => {
    const storage = createStorage();
    storage.setItem(DIAGNOSIS_DRAFT_STORAGE_KEY, JSON.stringify({ answers: { style: "invalid", pantsFit: "denim" }, currentQuestionIndex: 999, completed: true }));
    expect(readDiagnosisDraft(storage)).toEqual({ answers: { pantsFit: "denim" }, currentQuestionIndex: 10, completed: false });
  });

  it("clears a saved draft", () => {
    const storage = createStorage();
    storage.setItem(DIAGNOSIS_DRAFT_STORAGE_KEY, "{}");
    clearDiagnosisDraft(storage);
    expect(storage.values.size).toBe(0);
  });
});
