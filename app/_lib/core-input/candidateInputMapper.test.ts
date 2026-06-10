import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { mapCandidateUiInputToSafeDraft } from "./candidateInputMapper";
import type { CandidateUiInput } from "./types";

const supportedCandidateTagIds = [
  "classic",
  "low_tech",
  "street",
  "minimal",
  "chunky",
  "running",
  "basketball",
  "comfortable",
  "durable",
  "retro",
  "heritage",
  "premium",
] as const;

function makeInput(overrides: Partial<CandidateUiInput> = {}): CandidateUiInput {
  return {
    sneakerName: "Nike Air Max 90",
    selectedTagIds: [],
    ...overrides,
  };
}

describe("mapCandidateUiInputToSafeDraft", () => {
  it("trims sneakerName into safeCandidateDraft.name", () => {
    const result = mapCandidateUiInputToSafeDraft(
      makeInput({ sneakerName: "  New Balance 990v6  " }),
      { supportedCandidateTagIds }
    );

    expect(result.isValid).toBe(true);
    expect(result.safeCandidateDraft).toEqual({
      name: "New Balance 990v6",
      candidateTagIds: [],
    });
    expect(result.missingFields).toEqual([]);
  });

  it("marks an empty sneakerName as invalid and omits safeCandidateDraft", () => {
    const result = mapCandidateUiInputToSafeDraft(
      makeInput({ sneakerName: "   " }),
      { supportedCandidateTagIds }
    );

    expect(result.isValid).toBe(false);
    expect(result.safeCandidateDraft).toBeNull();
    expect(result.missingFields).toContain("sneakerName");
  });

  it("keeps supported selectedTagIds as candidateTagIds", () => {
    const result = mapCandidateUiInputToSafeDraft(
      makeInput({ selectedTagIds: ["classic", "heritage", "premium"] }),
      { supportedCandidateTagIds }
    );

    expect(result.safeCandidateDraft?.candidateTagIds).toEqual([
      "classic",
      "heritage",
      "premium",
    ]);
    expect(result.warnings).toEqual([]);
    expect(result.unsupportedFields).toEqual([]);
  });

  it("records unsupported tags without silently keeping them in the safe draft", () => {
    const result = mapCandidateUiInputToSafeDraft(
      makeInput({ selectedTagIds: ["classic", "unknown_tag", "invalid_tag"] }),
      { supportedCandidateTagIds }
    );

    expect(result.isValid).toBe(true);
    expect(result.safeCandidateDraft?.candidateTagIds).toEqual(["classic"]);
    expect(result.warnings).toContain(
      "unsupported candidate tag: unknown_tag"
    );
    expect(result.warnings).toContain(
      "unsupported candidate tag: invalid_tag"
    );
    expect(result.unsupportedFields).toContain("selectedTagIds:unknown_tag");
    expect(result.unsupportedFields).toContain("selectedTagIds:invalid_tag");
  });

  it("treats all selectedTagIds as unsupported when supportedCandidateTagIds is omitted", () => {
    const result = mapCandidateUiInputToSafeDraft(
      makeInput({ selectedTagIds: ["classic", "street"] })
    );

    expect(result.isValid).toBe(true);
    expect(result.safeCandidateDraft?.candidateTagIds).toEqual([]);
    expect(result.warnings).toEqual([
      "unsupported candidate tag: classic",
      "unsupported candidate tag: street",
    ]);
    expect(result.unsupportedFields).toEqual([
      "selectedTagIds:classic",
      "selectedTagIds:street",
    ]);
  });

  it("does not convert brand, price text, budget text, or memo into Core judgment values", () => {
    const result = mapCandidateUiInputToSafeDraft(
      makeInput({
        brand: "Nike",
        seenPriceText: "18000",
        budgetText: "20000",
        memo: "Maybe for rainy days",
        selectedTagIds: ["running"],
      }),
      { supportedCandidateTagIds }
    );

    expect(result.safeCandidateDraft).toEqual({
      name: "Nike Air Max 90",
      candidateTagIds: ["running"],
    });
    expect(result.unsupportedFields).toEqual([
      "brand",
      "seenPriceText",
      "budgetText",
      "memo",
    ]);
    expect(result.safeCandidateDraft).not.toHaveProperty("brand");
    expect(result.safeCandidateDraft).not.toHaveProperty("price");
    expect(result.safeCandidateDraft).not.toHaveProperty("budget");
    expect(result.safeCandidateDraft).not.toHaveProperty("score");
    expect(result.safeCandidateDraft).not.toHaveProperty("decision");
    expect(result.safeCandidateDraft).not.toHaveProperty("vector");
    expect(result.safeCandidateDraft).not.toHaveProperty("candidateVector");
    expect(result.safeCandidateDraft).not.toHaveProperty("priceLevel");
    expect(result.safeCandidateDraft).not.toHaveProperty("budgetFit");
  });

  it("keeps the mapper independent from Core execution and app data", () => {
    const mapperSource = readFileSync(
      new URL("./candidateInputMapper.ts", import.meta.url),
      "utf8"
    );

    expect(mapperSource).not.toMatch(/recommendSneakers/);
    expect(mapperSource).not.toMatch(/src\/core|src\/domain|src\/data|@\/src|~\/src/);
    expect(mapperSource).not.toMatch(/app\/_data|_data\/candidateSneakerOptions/);
  });
});
