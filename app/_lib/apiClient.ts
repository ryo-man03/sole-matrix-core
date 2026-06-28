import type {
  IntegratedRecommendationRequest,
  IntegratedRecommendationResult,
} from "./integrated-recommendation/types";
import type { SneakerVisualAnalysis } from "./image-analysis/types";
import type { SneakerUrlAnalysis } from "./url-analysis/types";
import type {
  LocalUserFeedback,
  UserMemorySummary,
} from "./user-memory/types";

type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; error: { code: string; message: string; field?: string } };
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export type AnalyzeSneakerResult = {
  sneakerName?: string;
  urlAnalysis?: SneakerUrlAnalysis;
  visualAnalysis?: SneakerVisualAnalysis;
};

export async function registerUser(input: {
  userId: string;
  displayName: string;
}): Promise<ApiResult<UserMemorySummary>> {
  return requestJson("/api/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function getUserProfile(
  userId: string,
): Promise<ApiResult<UserMemorySummary>> {
  return requestJson(`/api/users/${encodeURIComponent(userId)}/profile`);
}

export async function saveUserFeedback(
  userId: string,
  input: Omit<LocalUserFeedback, "createdAt">,
): Promise<ApiResult<UserMemorySummary>> {
  return requestJson(`/api/users/${encodeURIComponent(userId)}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function analyzeSneaker(input: {
  sneakerName?: string;
  url?: string;
  image?: File;
}): Promise<ApiResult<AnalyzeSneakerResult>> {
  const body = new FormData();
  if (input.sneakerName) body.set("sneakerName", input.sneakerName);
  if (input.url) body.set("url", input.url);
  if (input.image) body.set("image", input.image);
  return requestJson("/api/sneakers/analyze", { method: "POST", body });
}

export async function searchRecommendations(
  input: IntegratedRecommendationRequest,
): Promise<ApiResult<IntegratedRecommendationResult>> {
  return requestJson("/api/recommendations/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(createApiUrl(path), init);
    const payload = (await response.json()) as ApiResult<T>;
    if (isApiResult(payload)) {
      return payload;
    }
  } catch {
    // Return a stable error contract without exposing transport details.
  }
  return {
    ok: false,
    error: { code: "API_UNAVAILABLE", message: "APIへ接続できませんでした。" },
  };
}

function createApiUrl(path: string): string {
  if (typeof window !== "undefined") {
    return path;
  }
  const baseUrl = process.env.BACKEND_API_BASE_URL?.trim();
  return baseUrl ? new URL(path, ensureTrailingSlash(baseUrl)).toString() : path;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function isApiResult<T>(value: unknown): value is ApiResult<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    typeof value.ok === "boolean"
  );
}
