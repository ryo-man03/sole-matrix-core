export type CanonicalSneakerIdentity = Readonly<{
  brand: string;
  modelName: string;
  colorwayName: string | null;
  styleCode: string | null;
  releaseYear: number | null;
}>;

export type SneakerVariant = Readonly<{
  sizeSystem: "US_M" | "US_W" | "JP_CM" | "UK" | "EU";
  sizeValue: string;
  condition: "new" | "used" | "unknown";
}>;

export type IdentityMatch = "exact" | "probable" | "model_only" | "rejected";

export type IdentityMatchReport = Readonly<{
  match: IdentityMatch;
  reasons: readonly string[];
}>;

function normalizeWords(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

function normalizeStyleCode(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleUpperCase("en-US")
    .replace(/[^A-Z0-9]/gu, "");
}

function normalizeSize(value: string): string {
  const normalized = value.normalize("NFKC").trim();
  const numeric = Number(normalized);
  if (Number.isFinite(numeric)) return String(numeric);
  return normalized.toLocaleUpperCase("en-US").replace(/\s+/gu, "");
}

function reject(...reasons: string[]): IdentityMatchReport {
  return { match: "rejected", reasons };
}

export function matchSneakerIdentity(
  expected: CanonicalSneakerIdentity,
  observed: CanonicalSneakerIdentity,
): IdentityMatchReport {
  if (
    !normalizeWords(expected.brand) ||
    normalizeWords(expected.brand) !== normalizeWords(observed.brand)
  ) {
    return reject("brand differs");
  }

  const expectedStyle = expected.styleCode
    ? normalizeStyleCode(expected.styleCode)
    : null;
  const observedStyle = observed.styleCode
    ? normalizeStyleCode(observed.styleCode)
    : null;
  if (expectedStyle && observedStyle && expectedStyle !== observedStyle) {
    return reject("style code differs");
  }

  if (
    expected.releaseYear !== null &&
    observed.releaseYear !== null &&
    expected.releaseYear !== observed.releaseYear
  ) {
    return reject("release year differs");
  }

  const expectedColor = expected.colorwayName
    ? normalizeWords(expected.colorwayName)
    : null;
  const observedColor = observed.colorwayName
    ? normalizeWords(observed.colorwayName)
    : null;
  if (expectedColor && observedColor && expectedColor !== observedColor) {
    return reject("colorway differs");
  }

  if (expectedStyle && observedStyle) {
    return {
      match: "exact",
      reasons: ["style code exact match", "brand consistent"],
    };
  }

  if (
    !normalizeWords(expected.modelName) ||
    normalizeWords(expected.modelName) !== normalizeWords(observed.modelName)
  ) {
    return reject("formal model name differs");
  }

  if (expectedColor && observedColor) {
    const reasons = ["formal model name matches", "verified colorway matches"];
    if (
      expected.releaseYear !== null &&
      observed.releaseYear !== null
    ) {
      reasons.push("release year matches");
    }
    return { match: "probable", reasons };
  }

  return {
    match: "model_only",
    reasons: [
      "formal model name matches",
      "style code and verified colorway are insufficient",
    ],
  };
}

export function matchSneakerSeries(
  expectedIdentity: CanonicalSneakerIdentity,
  observedIdentity: CanonicalSneakerIdentity,
  expectedVariant: SneakerVariant,
  observedVariant: SneakerVariant,
): IdentityMatchReport {
  const identity = matchSneakerIdentity(expectedIdentity, observedIdentity);
  if (identity.match === "rejected") return identity;

  if (expectedVariant.sizeSystem !== observedVariant.sizeSystem) {
    return reject("size system or gender differs");
  }
  if (
    normalizeSize(expectedVariant.sizeValue) !==
    normalizeSize(observedVariant.sizeValue)
  ) {
    return reject("size differs");
  }
  if (expectedVariant.condition !== observedVariant.condition) {
    return reject("condition differs");
  }

  return {
    match: identity.match,
    reasons: [
      ...identity.reasons,
      "size system and size match",
      "condition matches",
    ],
  };
}

export function isStandardAggregationMatch(
  report: IdentityMatchReport,
): boolean {
  return report.match === "exact";
}

