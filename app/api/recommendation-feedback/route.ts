import {
  appendGlobalFeedbackEntry,
  normalizeGlobalFeedbackInput,
} from "../../_lib/recommendation-feedback/globalFeedbackCorpus";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const body = await readJson(request);
  const entry = normalizeGlobalFeedbackInput(body);
  if (!entry) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "推薦評価の入力内容を確認してください。",
        },
      },
      { status: 400 },
    );
  }

  try {
    await appendGlobalFeedbackEntry(entry);
  } catch {
    return Response.json(
      {
        ok: false,
        error: {
          code: "FEEDBACK_CORPUS_UNAVAILABLE",
          message: "共通の推薦評価を保存できませんでした。",
        },
      },
      { status: 503 },
    );
  }

  return Response.json({
    ok: true,
    data: {
      saved: true,
      sessionType: entry.sessionType,
      anonymized: true,
      referenceOnly: true,
    },
  });
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}
