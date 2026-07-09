import { createRyoModeCandidateAnchors } from "./candidates";
import { buildRyoModeCandidateEvaluation } from "./integration";
import { buildParentModelExplanation, findRyoParentModelProfile, getRyoParentModelProfiles, scoreRyoParentModelAffinity } from "./parent-models";
import { findRetroRunningProfile, scoreRyoRetroRunningAffinity } from "./retro-running";
import { buildRyoPreferenceVector } from "./vector";
import type { CandidateProfile } from "../core-v1/types";

describe("Ryo parent model culture rules", () => {
  it("provides all required parent profiles", () => {
    expect(getRyoParentModelProfiles()).toHaveLength(11);
    expect(getRyoParentModelProfiles().map((item) => item.id)).toEqual(expect.arrayContaining([
      "converse_one_star", "converse_all_star_j", "converse_jack_purcell", "adidas_archive", "adidas_superstar_vintage",
      "puma_suede_clyde", "nike_jordan_heritage", "nike_retro_running_archive", "vans_skate",
      "new_balance_premium_runner", "reebok_prokeds_lastresort",
    ]));
  });

  it("puts All Star J / VTG / Addict above a normal current All Star", () => {
    const vector = buildRyoPreferenceVector({ style: "amekaji", pantsFit: "denim", materialAging: "canvas_fading", cut: "high", ryoStrength: "ryo_strong" });
    const normal = scoreRyoParentModelAffinity("Converse All Star Hi", vector);
    for (const name of ["Converse All Star J Hi", "Converse All Star J VTG Hi", "Converse Addict Chuck Taylor Hi"]) {
      expect(scoreRyoParentModelAffinity(name, vector)).toBeGreaterThan(normal);
    }
    const profile = findRyoParentModelProfile("Converse All Star J VTG Hi");
    expect(profile && buildParentModelExplanation("Converse All Star J VTG Hi", profile)).toMatch(/日本製|VTG|Hi|キャンバス/);
  });

  it("distinguishes Jack Purcell CL, 1935, and Leather roles", () => {
    const profile = findRyoParentModelProfile("Converse Jack Purcell 1935");
    expect(profile?.id).toBe("converse_jack_purcell");
    expect(profile && buildParentModelExplanation("Converse Jack Purcell CL", profile)).toContain("CLは買いやすい現行本命");
    expect(profile && buildParentModelExplanation("Converse Jack Purcell 1935", profile)).toContain("1935は思想枠");
    expect(profile && buildParentModelExplanation("Converse Jack Purcell Leather Black", profile)).toContain("大人の育て枠");
  });

  it("prefers archive adidas and premium NB variants over downrank variants", () => {
    const archive = buildRyoPreferenceVector({ style: "clean_casual", pantsFit: "straight_pants", ryoStrength: "ryo_strong" });
    expect(scoreRyoParentModelAffinity("adidas Tobacco", archive)).toBeGreaterThan(scoreRyoParentModelAffinity("adidas Samba OG", archive));
    const premium = buildRyoPreferenceVector({ budget: "premium_ok", sportOrigin: "running", ryoStrength: "ryo_mode" });
    expect(scoreRyoParentModelAffinity("New Balance 991", premium)).toBeGreaterThan(scoreRyoParentModelAffinity("New Balance 9060", premium));
    expect(scoreRyoParentModelAffinity("New Balance 990v4", premium)).toBeGreaterThan(scoreRyoParentModelAffinity("New Balance 990v6", premium));
  });

  it("keeps Superstar Vintage out of terrace and Samba explanations", () => {
    const profile = findRyoParentModelProfile("adidas Superstar Vintage");
    expect(profile?.id).toBe("adidas_superstar_vintage");
    expect(profile?.cultureSignals).toEqual(expect.arrayContaining(["B-boy", "hip hop", "classic basketball"]));
    expect(profile?.cultureSignals).not.toContain("football terrace");
    expect(profile && buildParentModelExplanation("adidas Superstar Vintage", profile)).toContain("Superstar Vintageはテラス枠ではなく");
  });
});

describe("retro running taxonomy", () => {
  it.each([
    ["Nike Cortez", "seventies_thin_runner"],
    ["adidas SL 72", "seventies_nylon_suede_runner"],
    ["Reebok Classic Leather", "eighties_leather_runner"],
    ["New Balance 990v3", "premium_retro_runner"],
    ["New Balance 991", "premium_retro_runner"],
    ["New Balance 2002R", "modern_retro_budget_runner"],
    ["Nike Air Max 95", "high_tech_running"],
    ["New Balance 1906", "high_tech_running"],
  ])("classifies %s as %s", (name, expected) => {
    expect(findRetroRunningProfile(name)?.id).toBe(expected);
  });

  it("does not classify Club C as retro running and keeps high tech outside classic Ryo", () => {
    expect(findRetroRunningProfile("Reebok Club C")).toBeUndefined();
    const avoidTech = buildRyoPreferenceVector({ style: "amekaji", techTolerance: "avoid_tech", ryoStrength: "ryo_strong" });
    const highTech = buildRyoPreferenceVector({ style: "street", pantsFit: "wide_pants", techTolerance: "airmax_nb_ok" });
    expect(scoreRyoRetroRunningAffinity("Nike Cortez", avoidTech)).toBeGreaterThan(scoreRyoRetroRunningAffinity("Nike Air Max 95", avoidTech));
    expect(scoreRyoRetroRunningAffinity("Nike Air Max 95", highTech)).toBeGreaterThan(40);
    const evaluation = buildRyoModeCandidateEvaluation(highTech, candidate("Nike Air Max 95"));
    expect(evaluation.culture.cautions.join(" ")).toContain("Ryo classic tasteとは別枠");
  });
});

describe("required style behavior cases", () => {
  it.each([
    [{ style: "amekaji", pantsFit: "denim", materialAging: "canvas_fading" }, ["Converse All Star J Hi", "Converse One Star J", "Vans Authentic Black/White", "Vans Era 95"]],
    [{ style: "amekaji", pantsFit: "denim", materialAging: "leather_sinking" }, ["Converse Jack Purcell Leather Black", "Converse One Star Leather", "Reebok Classic Leather", "adidas Superstar Vintage", "Converse Pro Leather"]],
    [{ style: "amekaji", pantsFit: "work_pants", materialAging: "suede_fading_nap" }, ["PUMA Suede Black/White", "PUMA Clyde Black/White", "Converse One Star Suede", "Vans Half Cab Black"]],
    [{ style: "clean_casual", pantsFit: "slim_pants", materialAging: "leather_sinking" }, ["Nike Cortez", "adidas Japan", "adidas SL 72", "Reebok Classic Leather", "adidas Country OG", "Converse Jack Purcell CL", "Reebok Club C"]],
    [{ style: "normcore", pantsFit: "straight_pants", budget: "under_15000" }, ["Reebok Classic Leather", "Reebok Classic Nylon", "Nike Cortez", "adidas SL 72", "Vans Authentic Black/White", "Converse Jack Purcell CL", "Reebok Club C"]],
    [{ style: "street", pantsFit: "wide_pants", techTolerance: "airmax_nb_ok" }, ["Nike Air Max 95", "New Balance 2002R", "New Balance 2010", "New Balance 1906", "Nike Air Force 1 Low \"White/White\""]],
  ] as const)("creates the candidate family for case %#", (answers, expectedNames) => {
    const names = createRyoModeCandidateAnchors(buildRyoPreferenceVector(answers), 25_000).map((item) => item.name);
    expect(names).toEqual(expect.arrayContaining([...expectedNames]));
  });
});

function candidate(name: string): CandidateProfile {
  return { id: name, name, source: "local", description: "test", tags: ["running", "comfortable", "street"], vector: { culture: 80, styleFit: 80, simplicity: 50, street: 85, volume: 80, comfort: 90, durability: 80, priceLevel: 60 }, budgetFit: 80, risk: "low", informationCompleteness: 90, readiness: "ready_local", priceYen: 20_000, researchSource: "ryo_anchor" };
}
