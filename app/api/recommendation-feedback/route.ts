import {
  appendGlobalFeedbackEntry,
  normalizeGlobalFeedbackInput,
} from "../../_lib/recommendation-feedback/globalFeedbackCorpus";
import { readBoundedJsonBody, validateMutationRequest } from "../../../src/application/http/requestSecurity";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const guard = validateMutationRequest(request, { key: "global-recommendation-feedback", limit: 20 });
  if (!guard.ok) return Response.json({ ok: false, error: { code: guard.code } }, { status: guard.status });
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
  try { return await readBoundedJsonBody(request); } catch { return null; }
}
