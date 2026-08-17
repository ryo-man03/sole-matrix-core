import { describe, expect, it } from "vitest";

import { parseConflictReview, parseEvidenceReview, parseManualEvidenceDraft, parseManualReleaseDraft } from "./manualEntry";

describe("data steward manual entry", () => {
  it("normalizes a release draft without writing the release catalog", () => {
    expect(parseManualReleaseDraft({ brand: "New Balance", modelName: "991 v2", modelFamily: "991", generation: "v2", colorwayName: "Grey", styleCode: "u991-gl2", releaseDate: "2026-08-18", region: "jp", informationState: "official_announced" }))
      .toMatchObject({ style_code: "U991GL2", region: "JP", review_state: "draft" });
  });

  it.each(["http://example.com", "https://localhost/a", "https://127.0.0.1/a", "https://user:pass@example.com/a"])("rejects unsafe evidence URL %s", (sourceUrl) => {
    expect(() => parseManualEvidenceDraft({ sourceUrl, sourceKind: "manual_other", brand: "Nike", modelName: "AJ1", styleCode: null, colorwayName: null, releaseDate: null, region: "JP", informationState: "unknown" })).toThrow("UNSAFE_URL");
  });

  it("allows only bounded review transitions", () => {
    expect(parseEvidenceReview({ reviewState: "accepted", reasonCode: "official_source_confirmed" }).reviewState).toBe("accepted");
    expect(parseConflictReview({ status: "resolved", resolutionNote: "Two independent official references agree." }).status).toBe("resolved");
    expect(() => parseEvidenceReview({ reviewState: "superseded", reasonCode: "x" })).toThrow();
  });
});
