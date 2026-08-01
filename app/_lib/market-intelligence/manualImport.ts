import type { MarketProviderId } from "./provider";
import {
  getMarketSeriesKey,
  MARKET_PRICE_TYPES,
  validateMarketSnapshot,
  type MarketPriceType,
  type MarketSnapshot,
} from "./snapshot";

const MAX_IMPORT_ROWS = 1_000;
const MAX_IMPORT_BYTES = 2_000_000;
const SIZE_SYSTEMS = new Set(["US_M", "US_W", "JP_CM", "UK", "EU"]);
const CONDITIONS = new Set(["new", "used", "unknown"]);
const SUPPORTED_CURRENCIES = new Set([
  "AUD", "CAD", "CHF", "EUR", "GBP", "HKD",
  "JPY", "KRW", "MXN", "NZD", "SGD", "USD",
]);
const PROVIDERS = new Set<MarketProviderId>([
  "stockx",
  "snkrdunk",
  "mercari",
  "manual_import",
]);
const PRICE_TYPES = new Set<MarketPriceType>(MARKET_PRICE_TYPES);
const FORMULA_PREFIX = /^[\t\r\n ]*[=+\-@]/u;
const FORMULA_SAFE_TEXT_FIELDS = [
  "provider",
  "sourceReference",
  "observedAt",
  "brand",
  "modelName",
  "colorwayName",
  "styleCode",
  "sizeSystem",
  "sizeValue",
  "condition",
  "currency",
  "priceType",
  "identityMatch",
] as const;

export const MANUAL_IMPORT_FIELDS = [
  "provider",
  "sourceReference",
  "observedAt",
  "brand",
  "modelName",
  "colorwayName",
  "styleCode",
  "releaseYear",
  "sizeSystem",
  "sizeValue",
  "condition",
  "currency",
  "priceType",
  "amount",
  "sampleCount",
  "identityMatch",
  "includesFees",
  "includesShipping",
  "includesTax",
] as const;

type ImportRecord = Record<string, unknown>;

export type ManualImportRejection = Readonly<{
  row: number;
  errors: readonly string[];
}>;

export type ManualImportResult = Readonly<{
  accepted: readonly MarketSnapshot[];
  rejected: readonly ManualImportRejection[];
}>;

function parseCsv(text: string): string[][] | null {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!;
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (quoted) return null;
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function csvRecords(text: string): ImportRecord[] | null {
  const rows = parseCsv(text);
  if (!rows?.length) return null;
  const headers = rows[0]?.map((value) => value.trim());
  if (!headers?.length || new Set(headers).size !== headers.length) return null;
  return rows.slice(1).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])),
  );
}

function jsonRecords(text: string): ImportRecord[] | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (
      !Array.isArray(parsed) ||
      parsed.some(
        (value) =>
          typeof value !== "object" || value === null || Array.isArray(value),
      )
    ) {
      return null;
    }
    return parsed as ImportRecord[];
  } catch {
    return null;
  }
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalText(value: unknown): string | null {
  return text(value);
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function integerOrNull(value: unknown): number | null {
  const parsed = numberOrNull(value);
  return parsed !== null && Number.isSafeInteger(parsed) ? parsed : null;
}

function triState(value: unknown): boolean | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
}

function normalizeRecord(
  record: ImportRecord,
): { snapshot: MarketSnapshot | null; errors: string[] } {
  const errors: string[] = [];
  const provider = text(record.provider);
  const sourceReference = text(record.sourceReference);
  const observedAt = text(record.observedAt);
  const brand = text(record.brand);
  const modelName = text(record.modelName);
  const sizeSystem = text(record.sizeSystem);
  const sizeValue = text(record.sizeValue);
  const condition = text(record.condition);
  const currency = text(record.currency);
  const priceType = text(record.priceType);
  const identityMatch = text(record.identityMatch);
  const amount = numberOrNull(record.amount);
  const releaseYear = integerOrNull(record.releaseYear);
  const sampleCount = integerOrNull(record.sampleCount);
  const includesFees = triState(record.includesFees);
  const includesShipping = triState(record.includesShipping);
  const includesTax = triState(record.includesTax);

  for (const field of FORMULA_SAFE_TEXT_FIELDS) {
    if (
      typeof record[field] === "string" &&
      FORMULA_PREFIX.test(record[field])
    ) {
      errors.push(`${field} contains a formula-like value`);
    }
  }
  if (!provider || !PROVIDERS.has(provider as MarketProviderId)) {
    errors.push("provider is invalid");
  }
  if (!sourceReference) errors.push("sourceReference is required");
  if (!observedAt) errors.push("observedAt is required");
  if (!brand) errors.push("brand is required");
  if (!modelName) errors.push("modelName is required");
  if (!sizeSystem || !SIZE_SYSTEMS.has(sizeSystem)) {
    errors.push("sizeSystem is invalid");
  }
  if (!sizeValue) errors.push("sizeValue is required");
  if (!condition || !CONDITIONS.has(condition)) {
    errors.push("condition is invalid");
  }
  if (
    !currency ||
    !SUPPORTED_CURRENCIES.has(currency.toUpperCase())
  ) {
    errors.push("currency is invalid");
  }
  if (!priceType || !PRICE_TYPES.has(priceType as MarketPriceType)) {
    errors.push("priceType is invalid");
  }
  if (amount === null) errors.push("amount is invalid");
  if (identityMatch !== "exact") {
    errors.push("identityMatch must be exact");
  }
  if (!text(record.styleCode)) {
    errors.push("exact identity requires styleCode");
  }
  if ([includesFees, includesShipping, includesTax].includes(undefined)) {
    errors.push("fee, shipping, and tax flags must be true, false, or blank");
  }
  if (errors.length) return { snapshot: null, errors };

  const snapshot: MarketSnapshot = {
    provider: provider as MarketProviderId,
    identity: {
      brand: brand!,
      modelName: modelName!,
      colorwayName: optionalText(record.colorwayName),
      styleCode: optionalText(record.styleCode),
      releaseYear,
    },
    variant: {
      sizeSystem: sizeSystem as MarketSnapshot["variant"]["sizeSystem"],
      sizeValue: sizeValue!,
      condition: condition as MarketSnapshot["variant"]["condition"],
    },
    priceType: priceType as MarketPriceType,
    amount: amount!,
    currency: currency!.toUpperCase(),
    observedAt: observedAt!,
    sourceReference,
    sampleCount,
    identityMatch: "exact",
    sourceQuality: "manual_import",
    includesFees: includesFees!,
    includesShipping: includesShipping!,
    includesTax: includesTax!,
  };
  const validation = validateMarketSnapshot(snapshot);
  return validation.valid
    ? { snapshot, errors: [] }
    : { snapshot: null, errors: [...validation.errors] };
}

export function importMarketData(
  input: string,
  format: "csv" | "json",
): ManualImportResult {
  if (new TextEncoder().encode(input).byteLength > MAX_IMPORT_BYTES) {
    return {
      accepted: [],
      rejected: [{
        row: 1,
        errors: [`import exceeds ${MAX_IMPORT_BYTES} byte limit`],
      }],
    };
  }
  const records = format === "csv" ? csvRecords(input) : jsonRecords(input);
  if (!records) {
    return {
      accepted: [],
      rejected: [{ row: 1, errors: [`invalid ${format.toUpperCase()}`] }],
    };
  }
  if (records.length > MAX_IMPORT_ROWS) {
    return {
      accepted: [],
      rejected: [{
        row: 1,
        errors: [`import exceeds ${MAX_IMPORT_ROWS} row limit`],
      }],
    };
  }

  const accepted: MarketSnapshot[] = [];
  const rejected: ManualImportRejection[] = [];
  const acceptedKeys = new Set<string>();
  records.forEach((record, index) => {
    const normalized = normalizeRecord(record);
    if (!normalized.snapshot) {
      rejected.push({ row: index + 2, errors: normalized.errors });
      return;
    }
    const key = `${getMarketSeriesKey(normalized.snapshot)}|${normalized.snapshot.observedAt}`;
    if (acceptedKeys.has(key)) {
      rejected.push({
        row: index + 2,
        errors: ["duplicate snapshot in import"],
      });
      return;
    }
    acceptedKeys.add(key);
    accepted.push(normalized.snapshot);
  });
  return { accepted, rejected };
}
