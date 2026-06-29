import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";
import type { SneakerVector } from "../../../src/domain/sneaker/sneakerVector";
import {
  normalizeRakutenItemSearchResponse,
  type ExternalCandidate,
} from "./rakutenNormalizer";
import {
  createRakutenProviderReadiness,
  type RakutenProviderStatus,
} from "./rakutenReadiness";
import type { CandidateProfile, ProviderReadiness } from "./types";
import type { ExternalListingEvidence } from "../external-evidence/types";

type SafeEnvironment = Record<string, string | undefined>;

export type RakutenCandidateProviderInput = {
  budgetYen?: number;
  preferenceTags?: readonly SneakerTag[];
  sneakerName?: string;
  brand?: string;
  color?: string;
  urlNameHint?: string;
};

export type RakutenCandidateProviderResult = {
  status: RakutenProviderStatus;
  candidates: CandidateProfile[];
  evidence: ExternalListingEvidence[];
  readiness: ProviderReadiness;
  networkAttempted: boolean;
  responseOk: boolean;
  shapeValid: boolean;
  httpStatus?: number;
};

export type RakutenCandidateProvider = (
  input: RakutenCandidateProviderInput,
) => Promise<RakutenCandidateProviderResult>;

const itemSearchEndpoint =
  "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401";

export async function fetchRakutenCandidates(
  input: RakutenCandidateProviderInput,
  options: {
    env?: SafeEnvironment;
    fetcher?: typeof fetch;
    endpoint?: string;
  } = {},
): Promise<RakutenCandidateProviderResult> {
  const env = options.env ?? process.env;
  const applicationId = env["RAKUTEN_APPLICATION_ID"]?.trim();
  const accessKey = env["RAKUTEN_ACCESS_KEY"]?.trim();

  if (!applicationId || !accessKey) {
    return failure("missing_config", false, false, false);
  }

  const fetcher = options.fetcher ?? globalThis.fetch;

  if (typeof fetcher !== "function") {
    return failure("network_or_http_error", false, false, false);
  }

  let url: URL;

  try {
    url = new URL(options.endpoint ?? itemSearchEndpoint);
    url.searchParams.set("applicationId", applicationId);
    url.searchParams.set("keyword", buildRakutenSearchKeyword(input));
    url.searchParams.set("hits", "3");
    url.searchParams.set("format", "json");
    url.searchParams.set("formatVersion", "2");
    url.searchParams.set(
      "elements",
      "itemName,itemPrice,itemUrl,mediumImageUrls,shopName,itemCaption",
    );
  } catch {
    return failure("network_or_http_error", false, false, false);
  }

  let response: Response;

  try {
    response = await fetcher(url, {
      method: "GET",
      headers: { accessKey },
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    return failure("network_or_http_error", true, false, false);
  }

  if (!response.ok) {
    const status =
      response.status === 403
        ? "blocked_forbidden"
        : response.status === 429
          ? "blocked_rate_limit"
          : "network_or_http_error";

    return failure(status, true, false, false, response.status);
  }

  let responseBody: unknown;

  try {
    responseBody = (await response.json()) as unknown;
  } catch {
    return failure("invalid_response", true, true, false, response.status);
  }

  const normalized = normalizeRakutenItemSearchResponse(responseBody);

  if (!normalized.ok) {
    return failure("invalid_response", true, true, false, response.status);
  }

  return {
    status: "ready",
    candidates: normalized.candidates.map(toCandidateProfile),
    evidence: normalized.candidates.map(toExternalListingEvidence),
    readiness: createRakutenProviderReadiness("ready"),
    networkAttempted: true,
    responseOk: true,
    shapeValid: true,
    httpStatus: response.status,
  };
}

function toCandidateProfile(
  candidate: ExternalCandidate,
): CandidateProfile {
  return {
    id: candidate.id,
    name: candidate.name,
    source: "rakuten",
    description:
      "楽天市場で取得し、安全な項目だけを正規化した商品候補です。価格や在庫は購入前に商品ページで確認してください。",
    tags: [...candidate.tags],
    vector: createCandidateVector(candidate.tags, candidate.priceYen),
    budgetFit: 65,
    risk: "medium",
    informationCompleteness: 88,
    readiness: "ready_external",
    priceYen: candidate.priceYen,
    url: candidate.url,
    ...(candidate.imageUrl ? { imageUrl: candidate.imageUrl } : {}),
    ...(candidate.shopName ? { shopName: candidate.shopName } : {}),
    ...(candidate.note ? { note: candidate.note } : {}),
  };
}

function toExternalListingEvidence(
  candidate: ExternalCandidate,
): ExternalListingEvidence {
  return {
    kind: "external_listing",
    provider: "rakuten",
    listingName: candidate.name,
    priceYen: candidate.priceYen,
    productUrl: candidate.url,
    ...(candidate.imageUrl ? { imageUrl: candidate.imageUrl } : {}),
    ...(candidate.shopName ? { shopName: candidate.shopName } : {}),
    confidence: "normalized_listing",
    warnings: [
      "価格・在庫・サイズ・販売状態は商品ページで再確認してください。",
      "この価格はCore budgetFitとDecisionを直接変更しません。",
    ],
    budgetFitImpact: "none",
    coreDecisionImpact: "none",
  };
}

export function buildRakutenSearchKeyword(
  input: RakutenCandidateProviderInput,
): string {
  const tagKeywords: Partial<Record<SneakerTag, string>> = {
    classic: "クラシック",
    minimal: "シンプル",
    street: "ストリート",
    basketball: "バスケット",
    running: "ランニング",
    comfortable: "クッション",
    retro: "レトロ",
    trail: "トレイル",
    outdoor: "アウトドア",
  };
  const firstTagKeyword = input.preferenceTags
    ?.map((tag) => tagKeywords[tag])
    .find((value): value is string => Boolean(value));
  const parts = [
    input.sneakerName,
    input.brand,
    input.color,
    input.urlNameHint,
    firstTagKeyword,
  ]
    .map(normalizeSearchPart)
    .filter((value): value is string => Boolean(value));
  const uniqueParts = parts.filter((part, index) => {
    const normalizedPart = part.toLocaleLowerCase("ja-JP");
    return !parts.slice(0, index).some((candidate) => {
      const normalizedCandidate = candidate.toLocaleLowerCase("ja-JP");
      return (
        normalizedCandidate === normalizedPart ||
        normalizedCandidate.split(/\s+/).includes(normalizedPart)
      );
    });
  });
  const keyword = uniqueParts.join(" ").slice(0, 100).trim();

  return keyword ? `${keyword} スニーカー`.slice(0, 100).trim() : "スニーカー";
}

function normalizeSearchPart(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/[<>"'`\\/{}[\]|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50);
  return normalized || undefined;
}

function createCandidateVector(
  tags: readonly SneakerTag[],
  priceYen: number,
): SneakerVector {
  const tagSet = new Set(tags);

  return {
    culture: tagScore(tagSet, ["classic", "retro", "heritage"], 56),
    styleFit: 68,
    simplicity: tagScore(tagSet, ["minimal", "low_tech", "classic"], 58),
    street: tagScore(tagSet, ["street", "basketball", "chunky"], 52),
    volume: tagScore(tagSet, ["chunky", "basketball", "trail"], 48),
    comfort: tagScore(tagSet, ["comfortable", "running"], 62),
    durability: tagScore(tagSet, ["durable", "trail", "outdoor"], 60),
    priceLevel: Math.round(Math.min(100, Math.max(0, priceYen / 500))),
  };
}

function tagScore(
  tags: ReadonlySet<SneakerTag>,
  targets: readonly SneakerTag[],
  fallback: number,
): number {
  const matches = targets.filter((tag) => tags.has(tag)).length;

  return matches === 0 ? fallback : Math.min(92, 70 + matches * 8);
}

function failure(
  status: Exclude<RakutenProviderStatus, "ready">,
  networkAttempted: boolean,
  responseOk: boolean,
  shapeValid: boolean,
  httpStatus?: number,
): RakutenCandidateProviderResult {
  return {
    status,
    candidates: [],
    evidence: [],
    readiness: createRakutenProviderReadiness(status),
    networkAttempted,
    responseOk,
    shapeValid,
    ...(httpStatus === undefined ? {} : { httpStatus }),
  };
}
