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
    }
  });
});
