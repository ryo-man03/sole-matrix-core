import { describe, expect, it } from "vitest";

import { retainPreviousProductJudgementOnFailure } from "./resultRetention";

describe("product judgement previous-result retention", () => {
  it("keeps the previous result and its links while clearly marking a new request failure", () => {
    const result = { candidate: "previous shoe", recommendationId: "previous-result" };
    const productLinks = [{ href: "https://example.com/previous-shoe" }];
    const presentation = retainPreviousProductJudgementOnFailure({ result, productLinks }, "画像を分析できませんでした。");

    expect(presentation.result).toBe(result);
    expect(presentation.productLinks).toBe(productLinks);
    expect(presentation.retainedPreviousResult).toBe(true);
    expect(presentation.status).toContain("前回成功した結果");
    expect(presentation.status).toContain("画像を分析できませんでした。");
    expect(presentation.analysisStage).toBe("error");
    expect(presentation.isAnalyzing).toBe(false);
  });

  it("does not claim that a previous result exists on the first failure", () => {
    const presentation = retainPreviousProductJudgementOnFailure({ result: null, productLinks: [] }, "入力を確認してください。");
    expect(presentation.retainedPreviousResult).toBe(false);
    expect(presentation.status).toBe("入力を確認してください。");
  });
});
