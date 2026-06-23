import { describe, expect, it, vi } from "vitest";

import { recommendSneakers } from "../../../src/core/recommendSneakers";
import { buildCoreInputFromValidatedBoundary } from "./coreInputBoundary";

vi.mock("../../../src/core/recommendSneakers", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../src/core/recommendSneakers")
    >();

  return {
    ...actual,
    recommendSneakers: vi.fn(actual.recommendSneakers),
  };
});

const featureValues = {
  culture: 90,
  styleFit: 80,
  simplicity: 70,
  street: 60,
  volume: 50,
  comfort: 40,
  durability: 30,
  priceLevel: 20,
};

function makeBoundaryInput() {
  return {
    safeCandidateInput: {
      name: "Unresolved UI Candidate Name",
      candidateTagIds: ["classic", "minimal", "running"],
    },
    resolvedCatalogItem: {
      id: "smx-snk-smoke-0001",
      displayName: "Canonical Smoke Sneaker",
      tags: ["classic", "comfortable"],
      comparisonPriceYen: 40_000,
      featureValues,
    },
    userBudgetYen: 30_000,
    profileMeta: {
      userId: "smoke-user-001",
      updatedAt: "2026-06-23T12:00:00Z",
    },
  };
}

describe("validated boundary to recommendSneakers smoke integration", () => {
  it("passes a ready boundary output to recommendSneakers inside the test only", () => {
    const boundaryResult = buildCoreInputFromValidatedBoundary(
      makeBoundaryInput()
    );

    expect(boundaryResult.status).toBe("ready");

    if (boundaryResult.status !== "ready") {
      throw new Error("expected ready boundary result");
    }

    const results = recommendSneakers(boundaryResult.coreInput);

    expect(recommendSneakers).toHaveBeenCalledOnce();
    expect(recommendSneakers).toHaveBeenCalledWith(boundaryResult.coreInput);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(
      expect.objectContaining({
        sneakerId: "smx-snk-smoke-0001",
        name: "Canonical Smoke Sneaker",
        scoreBreakdown: expect.any(Object),
        finalDecision: expect.any(String),
      })
    );
  });

  it("does not call recommendSneakers when the boundary is blocked", () => {
    vi.mocked(recommendSneakers).mockClear();

    const boundaryResult = buildCoreInputFromValidatedBoundary({
      ...makeBoundaryInput(),
      resolvedCatalogItem: null,
    });

    expect(boundaryResult.status).toBe("blocked");
    expect(boundaryResult.coreInput).toBeNull();
    expect(recommendSneakers).not.toHaveBeenCalled();
  });
});
