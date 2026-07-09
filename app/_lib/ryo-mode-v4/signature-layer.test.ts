import type { CandidateProfile } from "../core-v1/types";
import { rerankRyoModeCandidates } from "./candidates";
import type { RyoModeAnswers } from "./types";
import { buildRyoPreferenceVector } from "./vector";

const amekajiBasketballAnswers = {
  style: "amekaji",
  pantsFit: "denim",
  taste: "classic",
  sportOrigin: "basketball",
  cut: "low",
  wearingStyle: "tied_silhouette",
  materialAging: "leather_sinking",
  color: "black_white",
  budget: "under_25000",
  techTolerance: "heritage_tech_ok",
  ryoStrength: "ryo_strong",
} as const;

describe("Ryo Signature Layer", () => {
  it("keeps an obvious safe classic from automatically beating a richer adjacent candidate", () => {
    const ranked = rank(amekajiBasketballAnswers, [
      scored(candidate('Nike Air Force 1 Low "White/White"', ["basketball", "classic", "street", "durable"]), 96),
      scored(candidate("Nike Terminator Low Black/White", ["basketball", "classic", "street", "heritage"]), 84),
    ]);

    expect(ranked[0]?.candidate.name).toBe("Nike Terminator Low Black/White");
    expect(ranked.find((entry) => entry.candidate.name.includes("Air Force"))?.ryoSignature.obviousnessPenalty).toBeGreaterThan(0);
    expect(ranked[0]?.ryoSignature.bucket).toMatch(/ryo_signature|adjacent_discovery/);
  });

  it("lets adidas terrace and archive alternatives outrank plain Samba OG when story and suede are selected", () => {
    const ranked = rank({
      style: "amekaji",
      pantsFit: "straight_pants",
      taste: "classic",
      sportOrigin: "football",
      cut: "low",
      wearingStyle: "tied_silhouette",
      materialAging: "suede_fading_nap",
      color: "cream_gum",
      budget: "under_25000",
      techTolerance: "avoid_tech",
      ryoStrength: "ryo_mode",
    }, [
      scored(candidate("adidas Samba OG", ["classic", "low_tech", "heritage"]), 94),
      scored(candidate("adidas Handball Spezial", ["classic", "low_tech", "heritage"]), 84),
      scored(candidate("adidas Japan", ["classic", "low_tech", "heritage"]), 82),
    ]);

    expect(ranked[0]?.candidate.name).toMatch(/Spezial|Japan/);
    expect(ranked[0]?.candidate.name).not.toBe("adidas Samba OG");
    expect(ranked.find((entry) => entry.candidate.name === "adidas Samba OG")?.ryoSignature.obviousnessPenalty).toBeGreaterThan(0);
  });

  it("prefers Converse adjacent discoveries over a generic All Star answer", () => {
    const ranked = rank({
      style: "amekaji",
      pantsFit: "denim",
      taste: "classic",
      sportOrigin: "no_sport",
      cut: "high",
      wearingStyle: "volume_look",
      materialAging: "canvas_fading",
      color: "black_white",
      budget: "under_25000",
      techTolerance: "avoid_tech",
      ryoStrength: "ryo_mode",
    }, [
      scored(candidate("Converse All Star Hi Black", ["classic", "canvas", "low_tech", "heritage"]), 94),
      scored(candidate("Converse All Star J VTG Hi", ["classic", "canvas", "low_tech", "heritage", "premium"]), 83),
      scored(candidate("Converse Pro Leather", ["basketball", "classic", "low_tech", "heritage"]), 81),
    ]);

    expect(ranked[0]?.candidate.name).toBe("Converse All Star J VTG Hi");
    expect(ranked[0]?.ryoSignature.bucket).toBe("ryo_signature");
    expect(ranked.find((entry) => entry.candidate.name === "Converse All Star Hi Black")?.ryoSignature.obviousnessPenalty).toBeGreaterThan(0);
  });

  it("penalizes an owned duplicate and lifts a nearby discovery", () => {
    const ranked = rank({
      style: "amekaji",
      pantsFit: "denim",
      taste: "classic",
      sportOrigin: "basketball",
      cut: "ox",
      wearingStyle: "tied_silhouette",
      materialAging: "leather_sinking",
      color: "rare_color",
      budget: "under_35000",
      techTolerance: "avoid_tech",
      ryoStrength: "ryo_strong",
    }, [
      scored(candidate('Converse One Star J VTG "Orange"', ["classic", "low_tech", "street", "heritage", "premium"]), 95, 25_000),
      scored(candidate('Converse Pro Leather J VTG OX 50th Anniversary "Black/Grey"', ["basketball", "classic", "low_tech", "heritage", "premium"]), 84, 28_000),
    ]);

    expect(ranked[0]?.candidate.name).toContain("Pro Leather J VTG");
    const owned = ranked.find((entry) => entry.candidate.name.includes("One Star"));
    expect(owned?.ryoSignature.ownedDuplicatePenalty).toBeGreaterThan(0);
    expect(owned?.ryoSignature.ownedReferenceMatches.join(" ")).toMatch(/One Star J VTG/);
  });

  it("keeps a slightly unusual fitting candidate visible as a signature or wildcard slot", () => {
    const ranked = rank({
      style: "amekaji",
      pantsFit: "work_pants",
      taste: "rare_color",
      sportOrigin: "skate",
      cut: "low",
      wearingStyle: "loose_fit",
      materialAging: "suede_fading_nap",
      color: "warm_accent",
      budget: "under_35000",
      techTolerance: "avoid_tech",
      ryoStrength: "ryo_mode",
    }, [
      scored(candidate("PUMA Suede Black/White", ["classic", "low_tech", "street", "heritage"]), 90),
      scored(candidate('PUMA Suede Charles F. Stead IV "Orange Glo/Puma White"', ["classic", "low_tech", "street", "heritage", "premium"]), 80, 24_000),
    ]);

    const unusual = ranked.find((entry) => entry.candidate.name.includes("Charles F. Stead"));
    expect(unusual).toBeDefined();
    expect(unusual?.ryoSignature.bucket).toMatch(/ryo_signature|wildcard/);
    expect(unusual?.ryoSignature.totalAdjustment).toBeGreaterThan(0);
  });

  it("preserves safe classics for a simple beginner case", () => {
    const ranked = rank({
      style: "normcore",
      pantsFit: "straight_pants",
      taste: "simple",
      sportOrigin: "basketball",
      cut: "low",
      wearingStyle: "tied_silhouette",
      materialAging: "leather_sinking",
      color: "black_white",
      budget: "under_20000",
      techTolerance: "heritage_tech_ok",
      ryoStrength: "beginner_ryo",
    }, [
      scored(candidate('Nike Air Force 1 Low "White/White"', ["basketball", "classic", "street", "durable"]), 90),
      scored(candidate("Vans Authentic Black/White", ["classic", "canvas", "low_tech", "street"]), 86, 8_000),
      scored(candidate("adidas Handball Spezial", ["classic", "low_tech", "heritage"]), 80),
    ]);

    expect(ranked[0]?.candidate.name).toBe('Nike Air Force 1 Low "White/White"');
    expect(ranked[0]?.ryoSignature.obviousnessPenalty).toBe(0);
    expect(ranked[0]?.ryoSignature.bucket).toBe("practical_buy");
  });
});

function rank(answers: RyoModeAnswers, entries: ReturnType<typeof scored>[]) {
  return rerankRyoModeCandidates(entries, buildRyoPreferenceVector(answers), "ryo");
}

function candidate(name: string, tags: CandidateProfile["tags"], priceYen = 18_000): CandidateProfile {
  return {
    id: name,
    name,
    source: "local",
    description: "test candidate",
    tags,
    vector: { culture: 82, styleFit: 80, simplicity: 76, street: 80, volume: 60, comfort: 72, durability: 82, priceLevel: 50 },
    budgetFit: priceYen <= 20_000 ? 90 : priceYen <= 30_000 ? 72 : 58,
    risk: "low",
    informationCompleteness: 88,
    readiness: "ready_local",
    priceYen,
    researchSource: "fallback_catalog",
  };
}

function scored(value: CandidateProfile, coreScore: number, priceYen = value.priceYen ?? 18_000) {
  const candidateWithPrice = { ...value, priceYen };
  return {
    candidate: candidateWithPrice,
    balancedScore: { total: coreScore, featureFit: coreScore, tagMatch: coreScore, budgetFit: candidateWithPrice.budgetFit, versatility: coreScore, informationConfidence: 90 },
    ryoScore: { total: coreScore, preferenceFit: coreScore, culturalFit: coreScore, classicRetroFit: coreScore, streetFit: coreScore, calmStyleFit: coreScore, enthusiastValue: coreScore },
    decision: "consider" as const,
  };
}
