import { buildRyoPreferenceVector, createEmptyRyoPreferenceVector, normalizeRyoPreferenceVector, summarizeRyoPreferenceVector } from "./vector";

describe("RyoPreferenceVector v4", () => {
  it("builds all axes from the 11 answers", () => {
    const vector = buildRyoPreferenceVector({
      style: "amekaji",
      pantsFit: "wide_pants",
      taste: "classic",
      sportOrigin: "basketball",
      cut: "high",
      wearingStyle: "tied_silhouette",
      materialAging: "leather_sinking",
      color: "black_white",
      budget: "under_20000",
      techTolerance: "heritage_tech_ok",
      ryoStrength: "ryo_strong",
    });

    expect(Object.keys(vector)).toHaveLength(11);
    expect(vector.pantsFit.widePants).toBe(100);
    expect(vector.wearingStyle.tiedSilhouette).toBe(100);
    expect(vector.materialAging.leatherSinking).toBe(100);
    expect(vector.materialAging.leatherCreasing).toBe(100);
    expect(vector.budget.under20000).toBe(100);
    expect(vector.ryoStrength.ryoStrong).toBe(100);
  });

  it.each([
    ["denim", "denim"],
    ["work_pants", "workPants"],
  ] as const)("maps %s to pantsFit.%s", (answer, key) => {
    const vector = buildRyoPreferenceVector({ pantsFit: answer });
    expect(vector.pantsFit[key]).toBe(100);
  });

  it("accepts array answers and ignores invalid or unknown option ids without throwing", () => {
    expect(() => buildRyoPreferenceVector([
      { questionId: "pantsFit", optionId: "not-an-option" },
      { questionId: "materialAging", optionId: "suede_fading_nap" },
    ])).not.toThrow();
    const vector = buildRyoPreferenceVector({ style: "invalid", pantsFit: "undecided" });
    expect(vector.style).toEqual(createEmptyRyoPreferenceVector().style);
    expect(vector.pantsFit.undecided).toBe(100);
  });

  it("clamps every value and creates a deterministic summary", () => {
    const vector = createEmptyRyoPreferenceVector();
    vector.pantsFit.denim = 150;
    vector.materialAging.canvasFading = Number.NaN;
    vector.ryoStrength.beginnerRyo = 80;
    const normalized = normalizeRyoPreferenceVector(vector);
    expect(normalized.pantsFit.denim).toBe(100);
    expect(normalized.materialAging.canvasFading).toBe(0);
    expect(summarizeRyoPreferenceVector(normalized)).toMatchObject({
      budgetCeilingYen: 20_000,
      ryoInfluence: "beginner",
      dominantSignals: expect.arrayContaining(["denim"]),
    });
  });
});
