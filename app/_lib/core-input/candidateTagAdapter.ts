import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";

export type CandidateTagAdapterStatus = "mapped" | "blocked";

export type CandidateTagAdapterResult = {
  status: CandidateTagAdapterStatus;
  canMap: boolean;
  coreTags: SneakerTag[];
  normalizedCandidateTagIds: string[];
  warnings: string[];
  blockedReasons: string[];
  unsupportedCandidateTagIds: string[];
};

const candidateTagMapping = {
  classic: "classic",
  low_tech: "low_tech",
  street: "street",
  minimal: "minimal",
  chunky: "chunky",
  running: "running",
  basketball: "basketball",
  comfortable: "comfortable",
  durable: "durable",
  retro: "retro",
  heritage: "heritage",
  premium: "premium",
} as const satisfies Record<string, SneakerTag>;

type CandidateTagId = keyof typeof candidateTagMapping;

const candidateTagIdPattern = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

export function mapCandidateTagsToCoreTags(
  candidateTagIds: readonly string[]
): CandidateTagAdapterResult {
  const normalizedCandidateTagIds: string[] = [];
  const warnings: string[] = [];
  const blockedReasons: string[] = [];
  const unsupportedCandidateTagIds: string[] = [];
  const seenCandidateTagIds = new Set<string>();

  for (const [index, rawCandidateTagId] of candidateTagIds.entries()) {
    const candidateTagId = rawCandidateTagId.trim();

    if (!candidateTagId || !candidateTagIdPattern.test(candidateTagId)) {
      blockedReasons.push(
        `invalid candidateTagId at index ${index}: expected a lowercase snake_case tag ID`
      );
      continue;
    }

    if (!isSupportedCandidateTagId(candidateTagId)) {
      unsupportedCandidateTagIds.push(candidateTagId);
      blockedReasons.push(`unknown candidateTagId: ${candidateTagId}`);
      continue;
    }

    if (seenCandidateTagIds.has(candidateTagId)) {
      warnings.push(`duplicate candidateTagId removed: ${candidateTagId}`);
      continue;
    }

    seenCandidateTagIds.add(candidateTagId);
    normalizedCandidateTagIds.push(candidateTagId);
  }

  if (normalizedCandidateTagIds.length === 0) {
    blockedReasons.push("candidate tag selection is empty");
  }

  const uniqueBlockedReasons = uniqueStrings(blockedReasons);
  const uniqueUnsupportedCandidateTagIds = uniqueStrings(
    unsupportedCandidateTagIds
  );

  if (uniqueBlockedReasons.length > 0) {
    return {
      status: "blocked",
      canMap: false,
      coreTags: [],
      normalizedCandidateTagIds,
      warnings: uniqueStrings(warnings),
      blockedReasons: uniqueBlockedReasons,
      unsupportedCandidateTagIds: uniqueUnsupportedCandidateTagIds,
    };
  }

  const coreTags: SneakerTag[] = [];
  const seenCoreTags = new Set<SneakerTag>();

  for (const candidateTagId of normalizedCandidateTagIds) {
    if (!isSupportedCandidateTagId(candidateTagId)) {
      return {
        status: "blocked",
        canMap: false,
        coreTags: [],
        normalizedCandidateTagIds,
        warnings: uniqueStrings(warnings),
        blockedReasons: [
          `candidateTagId has no confirmed Core mapping: ${candidateTagId}`,
        ],
        unsupportedCandidateTagIds: [candidateTagId],
      };
    }

    const coreTag = candidateTagMapping[candidateTagId];

    if (seenCoreTags.has(coreTag)) {
      warnings.push(`duplicate Core tag removed: ${coreTag}`);
      continue;
    }

    seenCoreTags.add(coreTag);
    coreTags.push(coreTag);
  }

  if (coreTags.length === 0) {
    return {
      status: "blocked",
      canMap: false,
      coreTags: [],
      normalizedCandidateTagIds,
      warnings: uniqueStrings(warnings),
      blockedReasons: ["mapped Core tag selection is empty"],
      unsupportedCandidateTagIds: [],
    };
  }

  return {
    status: "mapped",
    canMap: true,
    coreTags,
    normalizedCandidateTagIds,
    warnings: uniqueStrings(warnings),
    blockedReasons: [],
    unsupportedCandidateTagIds: [],
  };
}

function isSupportedCandidateTagId(value: string): value is CandidateTagId {
  return Object.prototype.hasOwnProperty.call(candidateTagMapping, value);
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
