import {
  RECOMMENDATION_FEEDBACK_STORAGE_KEY,
  loadRecommendationFeedback,
  saveRecommendationFeedback,
  type FeedbackStorage,
  type RecommendationFeedback,
} from "./localStorage";

describe("recommendation feedback localStorage", () => {
  it("saves usefulness, comment, Ryo metadata, and createdAt", () => {
    const storage = memoryStorage();
    const feedback: RecommendationFeedback = {
      id: "feedback:1",
      createdAt: "2026-07-07T00:00:00.000Z",
      resultModelName: "Converse One Star J",
      decision: "consider",
      usefulness: "helpful",
      comment: "素材の説明が役立った",
      ryoMode: { parentModels: ["converse_one_star"], productScore: 82, recommendationScore: 91 },
    };
    saveRecommendationFeedback(storage, feedback);
    expect(loadRecommendationFeedback(storage)).toEqual([feedback]);
    expect(storage.getItem(RECOMMENDATION_FEEDBACK_STORAGE_KEY)).toContain("素材の説明が役立った");
  });

  it("recovers from malformed local data and keeps the latest 100 entries", () => {
    const storage = memoryStorage();
    storage.setItem(RECOMMENDATION_FEEDBACK_STORAGE_KEY, "not-json");
    expect(loadRecommendationFeedback(storage)).toEqual([]);
    for (let index = 0; index < 105; index += 1) {
      saveRecommendationFeedback(storage, { id: `f:${index}`, createdAt: new Date(index).toISOString(), resultModelName: "Model", decision: "consider", usefulness: "unsure", comment: "" });
    }
    const saved = loadRecommendationFeedback(storage);
    expect(saved).toHaveLength(100);
    expect(saved[0]?.id).toBe("f:5");
  });
});

function memoryStorage(): FeedbackStorage {
  const values = new Map<string, string>();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); } };
}
