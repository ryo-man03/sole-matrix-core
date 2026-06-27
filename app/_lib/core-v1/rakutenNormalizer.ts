import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";

export type ExternalCandidate = {
  id: string;
  name: string;
  source: "rakuten";
  priceYen: number;
  url: string;
  imageUrl?: string;
  shopName?: string;
  tags: SneakerTag[];
  note?: string;
};

export type RakutenNormalizationFailure =
  | "invalid_response"
  | "empty"
  | "missing_required_field";

export type RakutenNormalizationResult =
  | { ok: true; candidates: ExternalCandidate[] }
  | { ok: false; reason: RakutenNormalizationFailure };

const maxNameLength = 180;
const maxShopNameLength = 120;
const maxNoteLength = 240;
const maxUrlLength = 2_048;
const maxPriceYen = 100_000_000;

export function normalizeRakutenItemSearchResponse(
  value: unknown,
): RakutenNormalizationResult {
  if (!isRecord(value) || !Array.isArray(value["items"])) {
    return { ok: false, reason: "invalid_response" };
  }

  const items = value["items"];

  if (items.length === 0) {
    return { ok: false, reason: "empty" };
  }

  const candidates: ExternalCandidate[] = [];

  for (const [index, item] of items.entries()) {
    if (!isRecord(item)) {
      return { ok: false, reason: "invalid_response" };
    }

    if (
      item["itemName"] === undefined ||
      item["itemPrice"] === undefined ||
      item["itemUrl"] === undefined
    ) {
      return { ok: false, reason: "missing_required_field" };
    }

    const name = normalizeText(item["itemName"], maxNameLength);
    const priceYen = normalizePrice(item["itemPrice"]);
    const url = normalizeHttpsUrl(item["itemUrl"]);

    if (!name || priceYen === undefined || !url) {
      return { ok: false, reason: "invalid_response" };
    }

    const shopName = normalizeText(item["shopName"], maxShopNameLength);
    const note = normalizePlainText(item["itemCaption"], maxNoteLength);
    const imageUrl = normalizeFirstImageUrl(item["mediumImageUrls"]);

    candidates.push({
      id: `rakuten-item-${index + 1}`,
      name,
      source: "rakuten",
      priceYen,
      url,
      tags: inferSafeTags(`${name} ${note ?? ""}`),
      ...(shopName ? { shopName } : {}),
      ...(note ? { note } : {}),
      ...(imageUrl ? { imageUrl } : {}),
    });
  }

  return { ok: true, candidates };
}

function normalizePrice(value: unknown): number | undefined {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d[\d,]*$/.test(value.trim())
        ? Number(value.replaceAll(",", ""))
        : Number.NaN;

  return Number.isSafeInteger(numericValue) &&
    numericValue > 0 &&
    numericValue <= maxPriceYen
    ? numericValue
    : undefined;
}

function normalizeText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, " ").trim();

  return normalized.length > 0 && normalized.length <= maxLength
    ? normalized
    : undefined;
}

function normalizePlainText(
  value: unknown,
  maxLength: number,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const withoutMarkup = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  if (!withoutMarkup) {
    return undefined;
  }

  return withoutMarkup.slice(0, maxLength);
}

function normalizeHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > maxUrlLength) {
    return undefined;
  }

  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      !url.hostname
    ) {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

function normalizeFirstImageUrl(value: unknown): string | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  for (const entry of value) {
    const directUrl = normalizeHttpsUrl(entry);

    if (directUrl) {
      return directUrl;
    }

    if (isRecord(entry)) {
      const nestedUrl = normalizeHttpsUrl(entry["imageUrl"]);

      if (nestedUrl) {
        return nestedUrl;
      }
    }
  }

  return undefined;
}

function inferSafeTags(text: string): SneakerTag[] {
  const normalized = text.toLowerCase();
  const matches: Array<[SneakerTag, RegExp]> = [
    ["classic", /classic|クラシック|定番/],
    ["minimal", /minimal|ミニマル|シンプル/],
    ["street", /street|ストリート/],
    ["chunky", /chunky|チャンキー|厚底/],
    ["basketball", /basketball|バスケット|バッシュ/],
    ["running", /running|runner|ランニング|ランナー/],
    ["comfortable", /comfort|comfortable|クッション|快適/],
    ["durable", /durable|耐久/],
    ["retro", /retro|レトロ/],
    ["trail", /trail|トレイル/],
    ["outdoor", /outdoor|アウトドア/],
    ["premium", /premium|プレミアム/],
    ["heritage", /heritage|ヘリテージ/],
  ];

  return matches
    .filter(([, pattern]) => pattern.test(normalized))
    .map(([tag]) => tag);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
