import { RYO_MODE_V4_QUESTIONS } from "./questions";

describe("Ryo Mode v4 question definitions", () => {
  it("defines 11 independent questions including pants fit and Ryo strength", () => {
    expect(RYO_MODE_V4_QUESTIONS).toHaveLength(11);
    expect(RYO_MODE_V4_QUESTIONS.some((question) => question.id === "pantsFit")).toBe(true);
    expect(RYO_MODE_V4_QUESTIONS.some((question) => question.id === "ryoStrength")).toBe(true);
  });

  it("keeps question and option identifiers unique and every question answerable", () => {
    const questionIds = RYO_MODE_V4_QUESTIONS.map((question) => question.id);
    expect(new Set(questionIds).size).toBe(questionIds.length);
    for (const question of RYO_MODE_V4_QUESTIONS) {
      expect(question.options.length).toBeGreaterThan(0);
      const optionIds = question.options.map((option) => option.id);
      expect(new Set(optionIds).size).toBe(optionIds.length);
      expect(question.options.every((option) => option.description.trim().length > 0)).toBe(true);
      expect(question.options.every((option) => String(option.description) !== "この方向を診断に反映する")).toBe(true);
    }
  });

  it("provides a specific explanation for all 58 choices", () => {
    const descriptions = RYO_MODE_V4_QUESTIONS.flatMap((question) =>
      question.options.map((option) => `${question.id}:${option.id}:${option.description}`),
    );
    expect(descriptions).toHaveLength(58);
    expect(new Set(descriptions).size).toBe(58);
  });
});
