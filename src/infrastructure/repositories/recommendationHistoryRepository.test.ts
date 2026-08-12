import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseServerClient } from "../auth/supabase/server";
import { saveRecommendationFeedback } from "./recommendationHistoryRepository";

vi.mock("../auth/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));

const userId = "00000000-0000-4000-8000-000000000001";
const snapshotId = "00000000-0000-4000-8000-000000000011";
const input = {
  snapshotId,
  canonicalKey: {
    brandSlug: "new-balance",
    modelFamily: "991",
    generation: "v2",
    styleCode: "U991GL2",
    audience: "unisex" as const,
  },
  sentiment: "liked",
  reasonCodes: ["style"],
  comment: null,
};

describe("recommendation history repository feedback ownership", () => {
  beforeEach(() => vi.clearAllMocks());

  it("saves feedback after finding the snapshot for the same user", async () => {
    const { client, from, insert, ownershipEqId, ownershipEqUser } = databaseFixture({ snapshot: { id: snapshotId } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await expect(saveRecommendationFeedback(userId, input)).resolves.toEqual({ id: "feedback-1" });
    expect(from).toHaveBeenNthCalledWith(1, "recommendation_snapshots");
    expect(from).toHaveBeenNthCalledWith(2, "recommendation_feedback");
    expect(ownershipEqId).toHaveBeenCalledWith("id", snapshotId);
    expect(ownershipEqUser).toHaveBeenCalledWith("user_id", userId);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: userId,
      recommendation_snapshot_id: snapshotId,
    }));
  });

  it.each(["foreign", "missing"])("rejects a %s snapshot without revealing ownership", async () => {
    const { client, from, insert } = databaseFixture({ snapshot: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await expect(saveRecommendationFeedback(userId, input)).rejects.toThrow("SNAPSHOT_NOT_FOUND");
    expect(from).toHaveBeenCalledTimes(1);
    expect(insert).not.toHaveBeenCalled();
  });

  it("does not insert when the ownership lookup fails", async () => {
    const { client, insert } = databaseFixture({ snapshot: null, snapshotError: { message: "read failed" } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await expect(saveRecommendationFeedback(userId, input)).rejects.toThrow("SNAPSHOT_LOOKUP_FAILED");
    expect(insert).not.toHaveBeenCalled();
  });

  it("surfaces a feedback write failure only after ownership succeeds", async () => {
    const { client } = databaseFixture({ snapshot: { id: snapshotId }, insertError: { message: "write failed" } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client);

    await expect(saveRecommendationFeedback(userId, input)).rejects.toThrow("FEEDBACK_WRITE_FAILED");
  });
});

function databaseFixture(options: {
  snapshot: { id: string } | null;
  snapshotError?: { message: string } | null;
  insertError?: { message: string } | null;
}) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: options.snapshot, error: options.snapshotError ?? null });
  const ownershipEqUser = vi.fn(() => ({ maybeSingle }));
  const ownershipEqId = vi.fn(() => ({ eq: ownershipEqUser }));
  const ownershipSelect = vi.fn(() => ({ eq: ownershipEqId }));
  const single = vi.fn().mockResolvedValue({
    data: options.insertError ? null : { id: "feedback-1" },
    error: options.insertError ?? null,
  });
  const insertSelect = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select: insertSelect }));
  const from = vi.fn((table: string) => table === "recommendation_snapshots"
    ? { select: ownershipSelect }
    : { insert });
  const client = { from } as never;
  return { client, from, insert, ownershipEqId, ownershipEqUser };
}
