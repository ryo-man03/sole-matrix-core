const informationStates = [
  "official_announced", "retailer_confirmed", "editorial_reported", "rumor", "released", "restocked", "cancelled",
  "date_changed", "conflicting_evidence", "unknown",
] as const;
const sourceKinds = ["manual_official_reference", "manual_retailer_reference", "manual_other"] as const;

export function parseManualReleaseDraft(value: unknown) {
  const input = exactRecord(value, ["brand", "modelName", "modelFamily", "generation", "colorwayName", "styleCode", "releaseDate", "region", "informationState"]);
  return {
    canonical_brand: text(input.brand, 80, true),
    canonical_model_name: text(input.modelName, 160, true),
    model_family: text(input.modelFamily, 120, true),
    generation: text(input.generation, 80),
    colorway_name: text(input.colorwayName, 160),
    style_code: styleCode(input.styleCode),
    release_date: date(input.releaseDate),
    region: region(input.region),
    information_state: enumValue(input.informationState, informationStates),
    review_state: "draft" as const,
  };
}

export function parseManualEvidenceDraft(value: unknown) {
  const input = exactRecord(value, ["sourceUrl", "sourceKind", "brand", "modelName", "styleCode", "colorwayName", "releaseDate", "region", "informationState"]);
  return {
    source_url: publicHttpsUrl(input.sourceUrl),
    source_kind: enumValue(input.sourceKind, sourceKinds),
    canonical_brand: text(input.brand, 80, true),
    canonical_model_name: text(input.modelName, 160, true),
    style_code: styleCode(input.styleCode),
    colorway_name: text(input.colorwayName, 160),
    observed_release_date: date(input.releaseDate),
    region: region(input.region),
    information_state: enumValue(input.informationState, informationStates),
    review_state: "draft" as const,
  };
}

export function parseEvidenceReview(value: unknown) {
  const input = exactRecord(value, ["reviewState", "reasonCode"]);
  return {
    reviewState: enumValue(input.reviewState, ["accepted", "rejected"] as const),
    reasonCode: text(input.reasonCode, 120, true),
  };
}

export function parseConflictReview(value: unknown) {
  const input = exactRecord(value, ["status", "resolutionNote"]);
  return {
    status: enumValue(input.status, ["resolved", "dismissed"] as const),
    resolutionNote: text(input.resolutionNote, 500, true),
  };
}

function exactRecord(value: unknown, allowed: readonly string[]): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value) || Object.keys(value).some((key) => !allowed.includes(key))) throw new Error("INVALID_INPUT");
  return value as Record<string, unknown>;
}

function text(value: unknown, maximum: number, required = false): string | null {
  if (value === null || value === undefined || value === "") {
    if (required) throw new Error("REQUIRED_FIELD");
    return null;
  }
  if (typeof value !== "string") throw new Error("INVALID_TEXT");
  const normalized = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f<>]/gu, " ").replace(/\s+/gu, " ").trim();
  if (!normalized || normalized.length > maximum) throw new Error("INVALID_TEXT");
  return normalized;
}

function styleCode(value: unknown): string | null {
  const parsed = text(value, 40);
  return parsed ? parsed.toLocaleUpperCase("en-US").replace(/[^A-Z0-9]/gu, "") : null;
}

function date(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) throw new Error("INVALID_DATE");
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) throw new Error("INVALID_DATE");
  return value;
}

function region(value: unknown): string {
  const parsed = text(value, 12, true)!;
  if (!/^[A-Za-z0-9_-]{2,12}$/u.test(parsed)) throw new Error("INVALID_REGION");
  return parsed.toLocaleUpperCase("en-US");
}

function enumValue<T extends readonly string[]>(value: unknown, values: T): T[number] {
  if (!values.includes(value as T[number])) throw new Error("INVALID_ENUM");
  return value as T[number];
}

function publicHttpsUrl(value: unknown): string {
  const raw = text(value, 2048, true)!;
  let parsed: URL;
  try { parsed = new URL(raw); } catch { throw new Error("UNSAFE_URL"); }
  const hostname = parsed.hostname.toLocaleLowerCase("en-US");
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port || hostname === "localhost" || hostname.endsWith(".local") || /^\d+(?:\.\d+){3}$/u.test(hostname) || hostname.includes(":")) throw new Error("UNSAFE_URL");
  parsed.hash = "";
  return parsed.toString();
}
