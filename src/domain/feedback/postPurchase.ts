import { audiences, sizeSystems } from "../collection/collection";

export const overallFitValues = ["too_small", "slightly_small", "true_to_size", "slightly_large", "too_large"] as const;
export const toeRoomValues = ["tight", "good", "roomy"] as const;
export const widthFeelValues = ["tight", "slightly_tight", "comfortable", "slightly_roomy", "roomy"] as const;
export const heelHoldValues = ["slipping", "secure", "tight"] as const;
export const instepFeelValues = ["tight", "comfortable", "roomy"] as const;
export const behaviorEventNames = ["recommendation_viewed", "market_listing_clicked"] as const;
export const clientProductEventNames = [...behaviorEventNames, "market_search_requested"] as const;

export type PurchaseReportInput = ReturnType<typeof parsePurchaseReport>;
export type FitFeedbackInput = ReturnType<typeof parseFitFeedback>;
export type ProductEventInput = ReturnType<typeof parseClientProductEvent>;

export function parsePurchaseReport(value: unknown) {
  const input = exactRecord(value, [
    "idempotencyKey", "recommendationSnapshotId", "wishlistItemId", "brand", "modelName", "modelFamily",
    "generation", "colorwayName", "styleCode", "audience", "sizeSystem", "sizeValue", "condition", "purchasedAt", "satisfactionRating",
  ]);
  const brand = requiredText(input.brand, 80);
  const modelName = requiredText(input.modelName, 160);
  const modelFamily = requiredText(input.modelFamily, 120);
  const generation = optionalText(input.generation, 80);
  const colorwayName = optionalText(input.colorwayName, 160);
  const styleCode = normalizeStyleCode(input.styleCode);
  const audience = enumValue(input.audience, audiences, "unknown");
  return {
    idempotency_key: idempotencyKey(input.idempotencyKey),
    recommendation_snapshot_id: optionalUuid(input.recommendationSnapshotId),
    wishlist_item_id: optionalUuid(input.wishlistItemId),
    canonical_key: {
      brand: normalizeKey(brand),
      modelFamily: normalizeKey(modelFamily),
      generation: normalizeKey(generation),
      styleCode,
    },
    brand,
    model_name: modelName,
    model_family: modelFamily,
    generation,
    colorway_name: colorwayName,
    style_code: styleCode,
    audience,
    purchased_size_system: nullableEnum(input.sizeSystem, sizeSystems),
    purchased_size_value: optionalNumber(input.sizeValue),
    purchased_condition: enumValue(input.condition, ["new", "used", "unknown"] as const, "unknown"),
    purchased_at: optionalDate(input.purchasedAt),
    satisfaction_rating: optionalInteger(input.satisfactionRating, 1, 5),
  };
}

export function parseFitFeedback(value: unknown) {
  const input = exactRecord(value, [
    "idempotencyKey", "sizeSystem", "sizeValue", "overallFit", "toeRoom", "widthFeel", "heelHold", "instepFeel",
    "sameSizeAgain", "note",
  ]);
  const parsed = {
    idempotency_key: idempotencyKey(input.idempotencyKey),
    size_system: nullableEnum(input.sizeSystem, sizeSystems),
    size_value: optionalNumber(input.sizeValue),
    overall_fit: nullableEnum(input.overallFit, overallFitValues),
    toe_room: nullableEnum(input.toeRoom, toeRoomValues),
    width_feel: nullableEnum(input.widthFeel, widthFeelValues),
    heel_hold: nullableEnum(input.heelHold, heelHoldValues),
    instep_feel: nullableEnum(input.instepFeel, instepFeelValues),
    same_size_again: optionalBoolean(input.sameSizeAgain),
    note: optionalText(input.note, 500),
  };
  if (Object.entries(parsed).every(([key, item]) => key === "idempotency_key" || item === null)) throw new Error("EMPTY_FIT_FEEDBACK");
  return parsed;
}

export function parseClientProductEvent(value: unknown) {
  const input = exactRecord(value, ["idempotencyKey", "eventName", "subjectType", "subjectId", "properties", "occurredAt"]);
  if (!clientProductEventNames.includes(input.eventName as typeof clientProductEventNames[number])) throw new Error("INVALID_EVENT");
  const properties = input.properties === undefined ? {} : input.properties;
  if (!isRecord(properties) || JSON.stringify(properties).length > 4096) throw new Error("INVALID_PROPERTIES");
  return {
    idempotency_key: idempotencyKey(input.idempotencyKey),
    event_name: input.eventName as typeof clientProductEventNames[number],
    event_class: behaviorEventNames.includes(input.eventName as typeof behaviorEventNames[number])
      ? "behavior_analytics" as const : "explicit_product_action" as const,
    subject_type: optionalText(input.subjectType, 80),
    subject_id: optionalText(input.subjectId, 200),
    properties,
    occurred_at: optionalTimestamp(input.occurredAt) ?? new Date().toISOString(),
  };
}

function exactRecord(value: unknown, allowed: readonly string[]): Record<string, unknown> {
  if (!isRecord(value) || Object.keys(value).some((key) => !allowed.includes(key))) throw new Error("INVALID_INPUT");
  return value;
}

function requiredText(value: unknown, maximum: number): string {
  const parsed = optionalText(value, maximum);
  if (!parsed) throw new Error("REQUIRED_FIELD");
  return parsed;
}

function optionalText(value: unknown, maximum: number): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw new Error("INVALID_TEXT");
  const parsed = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f<>]/gu, " ").replace(/\s+/gu, " ").trim();
  if (!parsed || parsed.length > maximum) throw new Error("INVALID_TEXT");
  return parsed;
}

function idempotencyKey(value: unknown): string {
  const parsed = optionalText(value, 128);
  if (!parsed || parsed.length < 8 || !/^[A-Za-z0-9._:-]+$/u.test(parsed)) throw new Error("INVALID_IDEMPOTENCY_KEY");
  return parsed;
}

function optionalUuid(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value)) throw new Error("INVALID_REFERENCE");
  return value;
}

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value >= 100) throw new Error("INVALID_SIZE");
  return value;
}

function optionalInteger(value: unknown, minimum: number, maximum: number): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum || value > maximum) throw new Error("INVALID_INTEGER");
  return value;
}

function optionalBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "boolean") throw new Error("INVALID_BOOLEAN");
  return value;
}

function optionalDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00Z`))) throw new Error("INVALID_DATE");
  return value;
}

function optionalTimestamp(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) throw new Error("INVALID_TIMESTAMP");
  return new Date(value).toISOString();
}

function enumValue<T extends readonly string[]>(value: unknown, values: T, fallback: T[number]): T[number] {
  if (value === null || value === undefined || value === "") return fallback;
  if (!values.includes(value as T[number])) throw new Error("INVALID_ENUM");
  return value as T[number];
}

function nullableEnum<T extends readonly string[]>(value: unknown, values: T): T[number] | null {
  if (value === null || value === undefined || value === "") return null;
  if (!values.includes(value as T[number])) throw new Error("INVALID_ENUM");
  return value as T[number];
}

function normalizeStyleCode(value: unknown): string | null {
  const parsed = optionalText(value, 40);
  return parsed ? parsed.toLocaleUpperCase("en-US").replace(/[^A-Z0-9]/gu, "") : null;
}

function normalizeKey(value: string | null): string | null {
  return value ? value.toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]/gu, "") : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
