import {
  createProductJudgementDraft,
  PRODUCT_JUDGEMENT_DRAFT_KEY,
  readProductJudgementDraft,
  writeProductJudgementDraft,
} from "./productJudgementDraft";

describe("product judgement draft", () => {
  it("normalizes reload-safe fields without storing images or results", () => {
    const draft = createProductJudgementDraft({
      mode: "balanced",
      sneakerName: "  New Balance Made in UK 991v2  ",
      productUrl: " https://example.com/item ",
      budgetText: " 32000 ",
    });
    expect(draft).toEqual({
      version: 1,
      mode: "balanced",
      sneakerName: "New Balance Made in UK 991v2",
      productUrl: "https://example.com/item",
      budgetText: "32000",
    });
    expect(draft).not.toHaveProperty("image");
    expect(draft).not.toHaveProperty("result");
  });

  it("round-trips and recovers safely from corrupted or blocked storage", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    };
    expect(writeProductJudgementDraft(storage, {
      mode: "ryo",
      sneakerName: "Converse One Star J",
      productUrl: "",
      budgetText: "",
    })).toBe(true);
    expect(readProductJudgementDraft(storage)?.sneakerName).toBe("Converse One Star J");

    values.set(PRODUCT_JUDGEMENT_DRAFT_KEY, "{broken");
    expect(readProductJudgementDraft(storage)).toBeNull();

    const blocked = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("quota"); },
    };
    expect(readProductJudgementDraft(blocked)).toBeNull();
    expect(writeProductJudgementDraft(blocked, {
      mode: "ryo",
      sneakerName: "",
      productUrl: "",
      budgetText: "",
    })).toBe(false);
  });
});
