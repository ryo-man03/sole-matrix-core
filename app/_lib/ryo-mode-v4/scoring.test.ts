import type { RyoSneakerFeatures } from "./types";
import { buildRyoPreferenceVector, createEmptyRyoPreferenceVector } from "./vector";
import { clampRyoScore, scoreRyoModeCandidate } from "./scoring";

const baseFeatures: RyoSneakerFeatures = {
  displayNameOfficial: "Example Brand Heritage One",
  brandOfficial: "Example Brand",
  modelOfficial: "Heritage One",
  verified: true,
  isAbstractName: false,
  hasLocalizedMainName: false,
  estimatedPriceYen: 19_800,
  traits: {},
};

describe("Ryo Score v4", () => {
  it("scores Air Force 1 White/White for history, leather aging, and pants compatibility", () => {
    const result = scoreRyoModeCandidate(
      buildRyoPreferenceVector({ pantsFit: "wide_pants", materialAging: "leather_sinking", budget: "under_20000" }),
      {
        ...baseFeatures,
        displayNameOfficial: "Nike Air Force 1 Low White/White",
        brandOfficial: "Nike",
        modelOfficial: "Air Force 1 Low White/White",
        traits: { airForce1WhiteWhite: true, tooCommon: false },
      },
    );
    expect(result.breakdown.historyOrigin).toBeGreaterThan(0);
    expect(result.breakdown.materialAging).toBeGreaterThan(0);
    expect(result.breakdown.pantsCompatibility).toBeGreaterThan(0);
    expect(result.bonuses).toContain("Nike Air Force 1 Low White/White historical staple");
    expect(result.matchedSignals.join(" ")).toContain("1982 basketball origin");
    expect(result.matchedSignals.join(" ")).not.toContain("popular");
  });

  it("penalizes Air Force 1 when popularity is the only stated reason", () => {
    const result = scoreRyoModeCandidate(createEmptyRyoPreferenceVector(), {
      ...baseFeatures,
      displayNameOfficial: "Nike Air Force 1 Low White/White",
      brandOfficial: "Nike",
      modelOfficial: "Air Force 1 Low White/White",
      traits: { airForce1WhiteWhite: true, popularityOnlyReason: true },
    });
    expect(result.penalties.join(" ")).toContain("only because it is popular");
  });

  it("raises the matching component for wide pants and aging materials", () => {
    const vector = buildRyoPreferenceVector({ pantsFit: "wide_pants", materialAging: "suede_fading_nap" });
    const matching = scoreRyoModeCandidate(vector, {
      ...baseFeatures,
      traits: { suede: true, widePantsGood: true },
    });
    const plain = scoreRyoModeCandidate(vector, baseFeatures);
    expect(matching.breakdown.pantsCompatibility).toBeGreaterThan(plain.breakdown.pantsCompatibility);
    expect(matching.breakdown.materialAging).toBeGreaterThan(plain.breakdown.materialAging);
  });

  it("keeps product merit separate when budget lowers recommendation fit", () => {
    const budgetVector = buildRyoPreferenceVector({ budget: "under_20000", ryoStrength: "beginner_ryo" });
    const expensive = scoreRyoModeCandidate(budgetVector, {
      ...baseFeatures,
      estimatedPriceYen: 80_000,
      traits: { oldShape: true, vintage: true, leather: true, tiedSilhouetteGood: true, widePantsGood: true, resaleTooExpensiveForBeginner: true },
    });
    expect(expensive.productScore).toBeGreaterThan(expensive.recommendationScore);
    expect(expensive.penalties.join(" ")).toContain("resale too expensive for beginner");
  });

  it.each([
    "ASICS GEL-KAYANO 14",
    "Nike Shox R4",
    "HOKA Clifton",
    "PUMA Speedcat OG",
  ])("applies a Ryo-only model penalty to %s", (displayNameOfficial) => {
    const result = scoreRyoModeCandidate(
      buildRyoPreferenceVector({ ryoStrength: "ryo_strong", techTolerance: "avoid_tech" }),
      { ...baseFeatures, displayNameOfficial, brandOfficial: displayNameOfficial.split(" ")[0]!, modelOfficial: displayNameOfficial.split(" ").slice(1).join(" ") },
    );
    expect(result.penalties.join(" ")).toContain("outside the classic Ryo axis");
  });

  it.each(["Nike Air Max 95", "New Balance 2002R", "New Balance 2010"])(
    "keeps explicitly tolerated technical model %s",
    (displayNameOfficial) => {
      const result = scoreRyoModeCandidate(
        buildRyoPreferenceVector({ ryoStrength: "ryo_strong", techTolerance: "airmax_nb_ok" }),
        { ...baseFeatures, displayNameOfficial, brandOfficial: displayNameOfficial.startsWith("Nike") ? "Nike" : "New Balance", modelOfficial: displayNameOfficial.replace(/^(Nike|New Balance)\s+/, ""), traits: { tooTechnical: true } },
      );
      expect(result.penalties.join(" ")).not.toContain("too technical");
    },
  );

  it("penalizes localized and abstract names and clamps all public scores", () => {
    const localized = scoreRyoModeCandidate(createEmptyRyoPreferenceVector(), {
      ...baseFeatures,
      displayNameOfficial: "レトロなスニーカー",
      brandOfficial: "Example",
      modelOfficial: "Retro",
    });
    expect(localized.penalties.join(" ")).toContain("localized Japanese display name");
    expect(localized.penalties.join(" ")).toContain("abstract recommendation name");
    expect(clampRyoScore(-1)).toBe(0);
    expect(clampRyoScore(120)).toBe(100);
    for (const score of [localized.productScore, localized.recommendationScore, localized.totalRyoScore]) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it("does not turn supplied seed model identity into a fixed ranking", () => {
    const vector = buildRyoPreferenceVector({ taste: "classic", ryoStrength: "ryo_mode" });
    const seedNamed = scoreRyoModeCandidate(vector, { ...baseFeatures, displayNameOfficial: "Nike Air Jordan 1 High 85 Bred", brandOfficial: "Nike", modelOfficial: "Air Jordan 1 High 85 Bred" });
    const nonSeedNamed = scoreRyoModeCandidate(vector, { ...baseFeatures, displayNameOfficial: "Nike Air Jordan 1 High 85 Unlisted Colorway", brandOfficial: "Nike", modelOfficial: "Air Jordan 1 High 85 Unlisted Colorway" });
    expect(seedNamed.productScore).toBe(nonSeedNamed.productScore);
    expect(seedNamed.recommendationScore).toBe(nonSeedNamed.recommendationScore);
  });
});
