import { createMockFeedbackRepository } from "../../../_lib/core-v1/repository";
import { validateFeedbackRequest } from "../../../_lib/core-v1/validation";
import { readBoundedJsonBody } from "../../../../src/application/http/requestSecurity";

const feedbackRepository = createMockFeedbackRepository();

export async function POST(request: Request): Promise<Response> {
  const body = await readJson(request);
  const validation = validateFeedbackRequest(body);

  if (!validation.ok) {
    return Response.json(
      { ok: false, error: validation.error },
      { status: 400 },
    );
  }

  const result = await feedbackRepository.saveFeedback(validation.value);

  if (!result.ok) {
    return Response.json(
      {
        ok: false,
        error: {
          code: "FEEDBACK_UNAVAILABLE",
          message: "フィードバックを保存できませんでした。",
        },
      },
      { status: 503 },
    );
  }

  return Response.json({
    ok: true,
    data: { saved: true, repository: "mock" },
  });
}

async function readJson(request: Request): Promise<unknown> {
  try { return await readBoundedJsonBody(request); } catch { return null; }
}
