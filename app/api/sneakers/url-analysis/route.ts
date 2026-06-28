import { NextResponse } from "next/server";

import { analyzeSneakerUrlSafely } from "../../../../server/services/sneakerUrlService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const url = String(body["url"] ?? "");
    const data = await analyzeSneakerUrlSafely(url);
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "URL_ANALYSIS_ERROR", message: "商品URLを解析できませんでした。" },
      },
      { status: 400 },
    );
  }
}
