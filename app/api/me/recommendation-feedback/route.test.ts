import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveRecommendationFeedback } from "../../../../src/infrastructure/repositories/recommendationHistoryRepository";
import { POST } from "./route";

vi.mock("../../../../src/infrastructure/repositories/recommendationHistoryRepository", () => ({
  saveRecommendationFeedback: vi.fn(),
}));
vi.mock("../../../../src/application/personalization/routeHelpers", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../../src/application/personalization/routeHelpers")>();
  return {
    ...original,
    guard: () => ({ ok: true as const }),
    privateUser: () => Promise.resolve({ id: "00000000-0000-4000-8000-000000000001" }),
  };
});

const snapshotId = "00000000-0000-4000-8000-000000000011";
const validBody = {
  snapshotId,
  sentiment: "liked",
  reasonCodes: ["style"],
  comment: "useful",
  sneaker: { brand: "New Balance", modelName: "991v2", styleCode: "U991GL2", audience: "unisex" },
};

describe("recommendation feedback route ownership", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects malformed snapshot IDs before calling the repository", async () => {
    const response = await POST(request({ ...validBody, snapshotId: "not-a-uuid" }));
    expect(response.status).toBe(400);
    expect(saveRecommendationFeedback).not.toHaveBeenCalled();
  });

  it.each(["foreign", "missing"])("returns the same generic response for a %s snapshot", async () => {
    vi.mocked(saveRecommendationFeedback).mockRejectedValue(new Error("SNAPSHOT_NOT_FOUND"));
    const response = await POST(request(validBody));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("passes only the authenticated session user to the repository", async () => {
    vi.mocked(saveRecommendationFeedback).mockResolvedValue({ id: "feedback-1" });
    const response = await POST(request(validBody));
    expect(response.status).toBe(201);
    expect(saveRecommendationFeedback).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      expect.objectContaining({ snapshotId }),
    );
  });
});

function request(body: unknown) {
  return new Request("https://app.example/api/me/recommendation-feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
