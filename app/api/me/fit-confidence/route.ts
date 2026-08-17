import { NextResponse } from "next/server";

import { evaluateFitConfidence, type FitCandidateIdentity } from "../../../_lib/market/confidence";
import { privateUser, unauthenticated } from "../../../../src/application/personalization/routeHelpers";
import { listOwnedRows } from "../../../../src/infrastructure/repositories/personalizationRepository";

export async function POST(request: Request) {
  const user = await privateUser();
  if (!user) return unauthenticated();
  let value: unknown;
  try { value = await request.json(); } catch { return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 }); }
  const candidate = parseCandidate(value);
  if (!candidate) return NextResponse.json({ ok: false, error: "invalid_candidate" }, { status: 400 });
  try {
    const [owned, sizes] = await Promise.all([
      listOwnedRows("owned_sneakers", user.id),
      listOwnedRows("user_sizes", user.id),
    ]);
    return NextResponse.json({ ok: true, data: { fit: evaluateFitConfidence(candidate, owned, sizes) } }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ ok: true, data: { fit: evaluateFitConfidence(candidate, [], []) } }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  }
}

function parseCandidate(value: unknown): FitCandidateIdentity | null {
  if (!isRecord(value)) return null;
  const modelName = text(value.modelName, 160);
  if (!modelName) return null;
  const audience = value.audience;
  if (typeof audience !== "string" || !["men", "women", "unisex", "kids", "unknown"].includes(audience)) return null;
  return {
    brand: text(value.brand, 80),
    modelName,
    modelFamily: text(value.modelFamily, 120),
    generation: text(value.generation, 80),
    styleCode: text(value.styleCode, 40),
    audience: audience as FitCandidateIdentity["audience"],
  };
}

function text(value: unknown, maximum: number): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return null;
  const normalized = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f<>]/gu, " ").replace(/\s+/gu, " ").trim();
  return normalized && normalized.length <= maximum ? normalized : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
