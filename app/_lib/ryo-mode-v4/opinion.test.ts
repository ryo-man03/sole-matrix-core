import type { RyoSneakerFeatures } from "./types";
import { buildRyoPreferenceVector } from "./vector";
import { scoreRyoModeCandidate } from "./scoring";
import { buildRyoOpinion } from "./opinion";

describe("RyoOpinion", () => {
  it("explains product/recommendation separation and budget caution without AI", () => {
    const vector = buildRyoPreferenceVector({ pantsFit: "denim", materialAging: "leather_sinking", budget: "under_20000" });
    const features: RyoSneakerFeatures = {
      displayNameOfficial: "Example Heritage Leather Low",
      brandOfficial: "Example",
      modelOfficial: "Heritage Leather Low",
      verified: true,
      isAbstractName: false,
      hasLocalizedMainName: false,
      estimatedPriceYen: 35_000,
      traits: { leather: true, lowCut: true, denimGood: true },
    };
    const score = scoreRyoModeCandidate(vector, features);
    const opinion = buildRyoOpinion(vector, score, features);
    expect(opinion.strongestSignals.length).toBeGreaterThan(0);
    expect(opinion.summary).toContain("productScore");
    expect(opinion.summary).toContain("recommendationScore");
    expect(opinion.caution).toContain("予算上限");
    expect(opinion.nextStep).toContain("denim");
  });
});
