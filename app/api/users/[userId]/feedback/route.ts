import { NextResponse } from "next/server";

import type { LocalUserFeedback } from "../../../../_lib/user-memory/types";
import {
  createUserMemoryService,
  UserMemoryValidationError,
} from "../../../../_lib/user-memory/userMemoryService";

const userMemoryService = createUserMemoryService();

export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const data = await userMemoryService.saveFeedback(userId, {
      sneakerName: String(body["sneakerName"] ?? ""),
      mode: String(body["mode"] ?? "") as LocalUserFeedback["mode"],
      decision: String(body["decision"] ?? "") as LocalUserFeedback["decision"],
      balancedScore: Number(body["balancedScore"]),
      ryoScore: Number(body["ryoScore"]),
      userRating: Number(body["userRating"]),
      userComment: String(body["userComment"] ?? ""),
    });
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof UserMemoryValidationError) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: error.code === "USER_NOT_FOUND" ? 404 : 400 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: { code: "USER_MEMORY_ERROR", message: "フィードバックを保存できませんでした。" },
      },
      { status: 500 },
    );
  }
}
