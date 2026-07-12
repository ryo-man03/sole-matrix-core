import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import type { SessionStorage } from "../auth-session/types";
import { preferenceDiagnosisQuestions } from "../../_data/preferenceDiagnosisQuestions";
import {
  clearDiagnosisDraft,
  DIAGNOSIS_DRAFT_STORAGE_KEY,
  DIAGNOSIS_DRAFT_VERSION,
  readDiagnosisDraft,
  restartDiagnosisDraft,
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
  it("restores partial answers and the current question index", () => {
    const storage = createStorage();
    writeDiagnosisDraft(storage, { answers: { style: "amekaji", pantsFit: "denim" }, currentQuestionIndex: 2, completed: false });
    expect(readDiagnosisDraft(storage)).toEqual({ version: 1, answers: { style: "amekaji", pantsFit: "denim" }, currentQuestionIndex: 2, completed: false });
    expect(JSON.parse(storage.values.get(DIAGNOSIS_DRAFT_STORAGE_KEY)!)).toMatchObject({ version: DIAGNOSIS_DRAFT_VERSION });
  });

  it("restores a completed diagnosis only when every answer is valid", () => {
    const storage = createStorage();
    const answers = Object.fromEntries(preferenceDiagnosisQuestions.map((question) => [question.id, question.options[0]!.id]));
    writeDiagnosisDraft(storage, { answers, currentQuestionIndex: 10, completed: true });
    expect(readDiagnosisDraft(storage)).toEqual({ version: 1, answers, currentQuestionIndex: 10, completed: true });
  });

  it("ignores corrupt JSON", () => {
    const storage = createStorage();
    storage.setItem(DIAGNOSIS_DRAFT_STORAGE_KEY, "{not-json");
    expect(readDiagnosisDraft(storage)).toBeNull();
  });

  it("drops unknown answer IDs and does not accept a false completed state", () => {
    const storage = createStorage();
    storage.setItem(DIAGNOSIS_DRAFT_STORAGE_KEY, JSON.stringify({ version: 1, answers: { style: "invalid", pantsFit: "denim" }, currentQuestionIndex: 2, completed: true }));
    expect(readDiagnosisDraft(storage)).toEqual({ version: 1, answers: { pantsFit: "denim" }, currentQuestionIndex: 2, completed: false });
  });

  it("clamps out-of-range question indexes", () => {
    const storage = createStorage();
    storage.setItem(DIAGNOSIS_DRAFT_STORAGE_KEY, JSON.stringify({ version: 1, answers: {}, currentQuestionIndex: 999, completed: false }));
    expect(readDiagnosisDraft(storage)?.currentQuestionIndex).toBe(10);
    storage.setItem(DIAGNOSIS_DRAFT_STORAGE_KEY, JSON.stringify({ version: 1, answers: {}, currentQuestionIndex: -4, completed: false }));
    expect(readDiagnosisDraft(storage)?.currentQuestionIndex).toBe(0);
  });

  it("invalidates data when the body version does not match current question definitions", () => {
    const storage = createStorage();
    storage.setItem(DIAGNOSIS_DRAFT_STORAGE_KEY, JSON.stringify({ version: 0, answers: { style: "amekaji" }, currentQuestionIndex: 1, completed: false }));
    expect(readDiagnosisDraft(storage)).toBeNull();
  });

  it("clears a saved draft", () => {
    const storage = createStorage();
    storage.setItem(DIAGNOSIS_DRAFT_STORAGE_KEY, "{}");
    clearDiagnosisDraft(storage);
    expect(storage.values.size).toBe(0);
  });

  it("restart clears the draft and parent diagnosis context", () => {
    const storage = createStorage();
    const parentResets: string[] = [];
    storage.setItem(DIAGNOSIS_DRAFT_STORAGE_KEY, "saved");
    restartDiagnosisDraft(storage, () => parentResets.push("reset"));
    expect(storage.values.size).toBe(0);
    expect(parentResets).toEqual(["reset"]);
  });

  it("completed restore does not automatically request another recommendation", () => {
    const flowSource = readFileSync(new URL("../../_components/PreferenceDiagnosisFlow.tsx", import.meta.url), "utf8");
    const boundarySource = readFileSync(new URL("../../_components/ProductSessionBoundary.tsx", import.meta.url), "utf8");
    const panelSource = readFileSync(new URL("../../_components/CoreV1RecommendationPanel.tsx", import.meta.url), "utf8");
    expect(flowSource).toContain("if (draft.completed)");
    expect(boundarySource).toContain('setExperienceMode("diagnosis")');
    expect(flowSource).not.toMatch(/if \(draft\.completed\)[\s\S]{0,500}handleRecommend\(/);
    expect(panelSource).toContain("onClick={handleRecommend}");
    expect(panelSource).not.toMatch(/useEffect\(\(\) => \{[^}]*handleRecommend\(/s);
  });
});
