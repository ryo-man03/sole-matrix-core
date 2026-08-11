import type { LocalUserFeedback } from "../../app/_lib/user-memory/types";
import { UserMemoryValidationError } from "../../app/_lib/user-memory/userMemoryService";
import {
  userMemoryService,
  type UserMemoryService,
} from "../services/userMemoryService";

export async function registerUserRequest(
  request: Request,
  service: UserMemoryService = userMemoryService,
): Promise<Response> {
  if (process.env.NODE_ENV === "production") return localMemoryDisabled();
  try {
    const body = await readJsonRecord(request);
    const data = await service.registerUser({
      userId: String(body["userId"] ?? ""),
      displayName: String(body["displayName"] ?? ""),
    });
    return Response.json({ ok: true, data });
  } catch (error) {
    return userErrorResponse(error, "ユーザーデータを保存できませんでした。");
  }
}

export async function getUserProfileRequest(
  userId: string,
  service: UserMemoryService = userMemoryService,
): Promise<Response> {
  if (process.env.NODE_ENV === "production") return localMemoryDisabled();
  try {
    const data = await service.getUserMemory(userId);
    return Response.json({ ok: true, data });
  } catch (error) {
    return userErrorResponse(error, "ユーザーデータを読み込めませんでした。");
  }
}

export async function saveUserFeedbackRequest(
  request: Request,
  userId: string,
  service: UserMemoryService = userMemoryService,
): Promise<Response> {
  if (process.env.NODE_ENV === "production") return localMemoryDisabled();
  try {
    const body = await readJsonRecord(request);
    const data = await service.saveFeedback(userId, {
      sneakerName: String(body["sneakerName"] ?? ""),
      mode: String(body["mode"] ?? "") as LocalUserFeedback["mode"],
      decision: String(body["decision"] ?? "") as LocalUserFeedback["decision"],
      balancedScore: Number(body["balancedScore"]),
      ryoScore: Number(body["ryoScore"]),
      userRating: Number(body["userRating"]),
      userComment: String(body["userComment"] ?? ""),
    });
    return Response.json({ ok: true, data });
  } catch (error) {
    return userErrorResponse(error, "フィードバックを保存できませんでした。");
  }
}

function localMemoryDisabled() {
  return Response.json({ ok: false, error: { code: "LOCAL_MEMORY_DISABLED", message: "ローカルメモリは開発環境専用です。" } }, { status: 410 });
}

function userErrorResponse(error: unknown, fallbackMessage: string): Response {
  if (error instanceof UserMemoryValidationError) {
    return Response.json(
      { ok: false, error: { code: error.code, message: error.message } },
      { status: error.code === "USER_NOT_FOUND" ? 404 : 400 },
    );
  }
  return Response.json(
    { ok: false, error: { code: "USER_MEMORY_ERROR", message: fallbackMessage } },
    { status: 500 },
  );
}

async function readJsonRecord(request: Request): Promise<Record<string, unknown>> {
  try {
    const value = (await request.json()) as unknown;
    return isRecord(value) ? value : {};
  } catch {
    return {};
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
