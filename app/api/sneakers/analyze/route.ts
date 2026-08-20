import { analyzeSneakerRequest } from "../../../../server/routes/analyzeSneaker";
import { validateMutationRequest } from "../../../../src/application/http/requestSecurity";

export async function POST(request: Request) {
  const guard = validateMutationRequest(request, { key: "sneaker-analysis", limit: 15, bodyRequired: false });
  if (!guard.ok) return Response.json({ ok: false, error: { code: guard.code } }, { status: guard.status });
  return analyzeSneakerRequest(request);
}
