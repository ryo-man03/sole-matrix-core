import { normalizeRakutenItemSearchResponse } from "./rakutenNormalizer";

describe("Rakuten formatVersion=2 normalizer", () => {
  it("normalizes a valid fixture without retaining the raw response", () => {
    const result = normalizeRakutenItemSearchResponse({
      items: [
        {
          itemName: " Retro Runner ",
          itemPrice: 12_800,
          itemUrl: "https://item.rakuten.co.jp/example/runner/",
          shopName: "Example Shop",
          itemCaption: "<b>レトロ</b>で快適なランニングモデル",
          mediumImageUrls: [
            { imageUrl: "https://thumbnail.image.rakuten.co.jp/example.jpg" },
          ],
          secretField: "must-not-survive",
        },
      ],
    });

    expect(result).toEqual({
      ok: true,
      candidates: [
        {
          id: "rakuten-item-1",
          name: "Retro Runner",
          source: "rakuten",
          priceYen: 12_800,
          url: "https://item.rakuten.co.jp/example/runner/",
          imageUrl: "https://thumbnail.image.rakuten.co.jp/example.jpg",
          shopName: "Example Shop",
          tags: ["running", "comfortable", "retro"],
          note: "レトロ で快適なランニングモデル",
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain("must-not-survive");
  });

  it.each([
    ["invalid shape", null, "invalid_response"],
    ["missing items", {}, "invalid_response"],
    ["empty items", { items: [] }, "empty"],
    [
      "missing itemName",
      { items: [{ itemPrice: 1000, itemUrl: "https://example.com/item" }] },
      "missing_required_field",
    ],
    [
      "missing itemPrice",
      { items: [{ itemName: "shoe", itemUrl: "https://example.com/item" }] },
      "missing_required_field",
    ],
    [
      "missing itemUrl",
      { items: [{ itemName: "shoe", itemPrice: 1000 }] },
      "missing_required_field",
    ],
  ])("rejects %s", (_label, value, reason) => {
    expect(normalizeRakutenItemSearchResponse(value)).toEqual({
      ok: false,
      reason,
    });
  });

  it("accepts numeric price strings and rejects invalid prices", () => {
    expect(
      normalizeRakutenItemSearchResponse({
        items: [
          {
            itemName: "shoe",
            itemPrice: "12,800",
            itemUrl: "https://example.com/item",
          },
        ],
      }),
    ).toMatchObject({
      ok: true,
      candidates: [{ priceYen: 12_800 }],
    });
    expect(
      normalizeRakutenItemSearchResponse({
        items: [
          {
            itemName: "shoe",
            itemPrice: -1,
            itemUrl: "https://example.com/item",
          },
        ],
      }),
    ).toEqual({ ok: false, reason: "invalid_response" });
  });

  it.each(["javascript:alert(1)", "http://example.com/item", "not-a-url"])(
    "rejects unsafe URL %s",
    (itemUrl) => {
      expect(
        normalizeRakutenItemSearchResponse({
          items: [{ itemName: "shoe", itemPrice: 1000, itemUrl }],
        }),
      ).toEqual({ ok: false, reason: "invalid_response" });
    },
  );
});
