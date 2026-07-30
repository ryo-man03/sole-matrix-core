import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { preferenceDiagnosisQuestions } from "../../_data/preferenceDiagnosisQuestions";
import { DiagnosisProgress } from "../../_components/DiagnosisProgress";
import { PreferenceDiagnosisSummary } from "../../_components/PreferenceDiagnosisSummary";
import { DEFAULT_USER_SNEAKER_CONTEXT } from "./sneakerContext";
import { buildRyoPreferenceVector } from "../ryo-mode-v4/vector";

const answers = Object.fromEntries(
  preferenceDiagnosisQuestions.map((question) => [question.id, question.options[0]!.id]),
);

describe("diagnosis UI", () => {
  it("announces the current question, category, and accessible progress value", () => {
    const html = renderToStaticMarkup(createElement(DiagnosisProgress, {
      answeredCount: 3,
      category: "カルチャー・スポーツ背景",
      currentIndex: 3,
      totalCount: 11,
    }));

    expect(html).toContain("質問 4 / 11");
    expect(html).toContain("カルチャー・スポーツ背景");
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuemin="1"');
    expect(html).toContain('aria-valuemax="11"');
    expect(html).toContain('aria-valuenow="4"');
  });

  it("shows every answer with a question-specific edit action", () => {
    const html = renderToStaticMarkup(createElement(PreferenceDiagnosisSummary, {
      context: DEFAULT_USER_SNEAKER_CONTEXT,
      onEditAnswer: () => undefined,
      onEditContext: () => undefined,
      questions: preferenceDiagnosisQuestions,
      selectedAnswerByQuestionId: answers,
      vector: buildRyoPreferenceVector(answers),
    }));

    for (const question of preferenceDiagnosisQuestions) {
      expect(html).toContain(question.category);
      expect(html).toContain(`${question.category}の回答を編集`);
    }
  });

  it("uses a mobile sticky action area without hiding overflow globally", () => {
    const css = readFileSync(new URL("../../globals.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.diagnosis-actions--sticky\s*\{[\s\S]*?position:\s*sticky/);
    expect(css).toContain("env(safe-area-inset-bottom)");
    expect(css).not.toMatch(/html\s*\{[^}]*overflow-x:\s*hidden/s);
  });
});
