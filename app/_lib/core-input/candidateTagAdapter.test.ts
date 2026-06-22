import { describe, expect, it } from "vitest";

import { mapCandidateTagsToCoreTags } from "./candidateTagAdapter";

const confirmedCandidateTagIds = [
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

describe("mapCandidateTagsToCoreTags", () => {
  it("maps all 12 confirmed Candidate UI tag IDs one-to-one", () => {
    const result = mapCandidateTagsToCoreTags(confirmedCandidateTagIds);

    expect(result).toEqual({
      status: "mapped",
      canMap: true,
      coreTags: confirmedCandidateTagIds,
      normalizedCandidateTagIds: confirmedCandidateTagIds,
      warnings: [],
      blockedReasons: [],
      unsupportedCandidateTagIds: [],
    });
  });

  it("maps the five D-001 IDs independently of their display wording", () => {
    const idsWithPendingDisplayWording = [
      "low_tech",
      "street",
      "minimal",
      "retro",
      "heritage",
    ];

    const result = mapCandidateTagsToCoreTags(idsWithPendingDisplayWording);

    expect(result.status).toBe("mapped");
    expect(result.coreTags).toEqual(idsWithPendingDisplayWording);
  });

  it("blocks an unknown candidateTagId and reports it as unsupported", () => {
    const result = mapCandidateTagsToCoreTags(["classic", "future_tag"]);

    expect(result.status).toBe("blocked");
    expect(result.canMap).toBe(false);
    expect(result.unsupportedCandidateTagIds).toEqual(["future_tag"]);
    expect(result.blockedReasons).toContain(
      "unknown candidateTagId: future_tag"
    );
  });

  it.each([
    [""],
    ["   "],
    ["not a tag"],
    ["UPPERCASE"],
    ["tag!"],
  ])("blocks invalid string candidateTagId %j", (invalidCandidateTagId) => {
    const result = mapCandidateTagsToCoreTags([invalidCandidateTagId]);

    expect(result.status).toBe("blocked");
    expect(result.canMap).toBe(false);
    expect(result.blockedReasons).toEqual(
      expect.arrayContaining([
        expect.stringContaining("invalid candidateTagId at index 0"),
      ])
    );
  });

  it("removes duplicate IDs after normalization and returns a warning", () => {
    const result = mapCandidateTagsToCoreTags([
      "classic",
      " street ",
      "classic",
      "street",
      "premium",
    ]);

    expect(result.status).toBe("mapped");
    expect(result.normalizedCandidateTagIds).toEqual([
      "classic",
      "street",
      "premium",
    ]);
    expect(result.coreTags).toEqual(["classic", "street", "premium"]);
    expect(result.warnings).toEqual([
      "duplicate candidateTagId removed: classic",
      "duplicate candidateTagId removed: street",
    ]);
  });

  it("blocks an empty selection", () => {
    const result = mapCandidateTagsToCoreTags([]);

    expect(result).toMatchObject({
      status: "blocked",
      canMap: false,
      coreTags: [],
      normalizedCandidateTagIds: [],
      blockedReasons: ["candidate tag selection is empty"],
    });
  });

  it("preserves first-occurrence input order deterministically", () => {
    const input = ["premium", "classic", "running", "classic", "heritage"];

    const firstResult = mapCandidateTagsToCoreTags(input);
    const secondResult = mapCandidateTagsToCoreTags(input);

    expect(firstResult.normalizedCandidateTagIds).toEqual([
      "premium",
      "classic",
      "running",
      "heritage",
    ]);
    expect(firstResult.coreTags).toEqual([
      "premium",
      "classic",
      "running",
      "heritage",
    ]);
    expect(secondResult).toEqual(firstResult);
  });

  it("does not silently drop Core-only or other unsupported IDs", () => {
    const result = mapCandidateTagsToCoreTags([
      "canvas",
      "classic",
      "unknown_tag",
    ]);

    expect(result.status).toBe("blocked");
    expect(result.unsupportedCandidateTagIds).toEqual([
      "canvas",
      "unknown_tag",
    ]);
    expect(result.blockedReasons).toEqual(
      expect.arrayContaining([
        "unknown candidateTagId: canvas",
        "unknown candidateTagId: unknown_tag",
      ])
    );
  });

  it("returns no provisional Core tags when any input blocks mapping", () => {
    const result = mapCandidateTagsToCoreTags(["classic", "unknown_tag"]);

    expect(result.normalizedCandidateTagIds).toEqual(["classic"]);
    expect(result.coreTags).toEqual([]);
  });
});
