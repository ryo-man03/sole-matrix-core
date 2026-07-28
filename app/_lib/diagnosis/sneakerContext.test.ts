import {
  DEFAULT_USER_SNEAKER_CONTEXT,
  normalizeContextList,
  normalizeUserSneakerContext,
  parseContextListInput,
} from "./sneakerContext";

describe("user sneaker context", () => {
  it("defaults invalid or missing purchase purpose without blocking the 11 questions", () => {
    expect(normalizeUserSneakerContext(undefined)).toEqual(DEFAULT_USER_SNEAKER_CONTEXT);
    expect(normalizeUserSneakerContext({ purchasePurpose: "invalid" }).purchasePurpose).toBe("daily_rotation");
  });

  it("normalizes NFKC, trims, deduplicates, and caps every list", () => {
    const values = [
      "  ＰＵＭＡ　Ｓｕｅｄｅ  ",
      "PUMA Suede",
      ...Array.from({ length: 12 }, (_, index) => `Model ${index}`),
    ];
    const normalized = normalizeContextList(values);
    expect(normalized[0]).toBe("PUMA Suede");
    expect(normalized).toHaveLength(10);
    expect(new Set(normalized.map((item) => item.toLowerCase())).size).toBe(normalized.length);
  });

  it("limits each item to 80 characters and parses comma or newline input", () => {
    const result = parseContextListInput(`  PUMA Suede、Converse One Star\n${"x".repeat(100)}`);
    expect(result).toHaveLength(3);
    expect(result[2]).toHaveLength(80);
  });
});
