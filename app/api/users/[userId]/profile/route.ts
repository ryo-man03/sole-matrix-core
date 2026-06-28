import { NextResponse } from "next/server";

import {
  createUserMemoryService,
  UserMemoryValidationError,
} from "../../../../_lib/user-memory/userMemoryService";

const userMemoryService = createUserMemoryService();

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await context.params;
    const data = await userMemoryService.getUserMemory(userId);
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
        error: { code: "USER_MEMORY_ERROR", message: "ユーザーデータを読み込めませんでした。" },
      },
      { status: 500 },
    );
  }
}
