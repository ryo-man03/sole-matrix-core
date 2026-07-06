import type { RyoSneakerFeatures } from "./types";
import { hasJapaneseText, isAbstractRecommendationName, isOfficialEnglishDisplayName, validateRyoDisplayName } from "./validation";

describe("official English display name validation", () => {
  it("accepts official English model names", () => {
    expect(isOfficialEnglishDisplayName("adidas Samba OG")).toBe(true);
    expect(isOfficialEnglishDisplayName("New Balance 991")).toBe(true);
  });

  it.each(["サンバ OG", "ニューバランス 991", "レトロなスニーカー"])("rejects localized main name %s", (name) => {
    expect(hasJapaneseText(name)).toBe(true);
    expect(isOfficialEnglishDisplayName(name)).toBe(false);
  });

  it("rejects abstract recommendation names and checks official brand/model presence", () => {
    expect(isAbstractRecommendationName("classic sneaker")).toBe(true);
    const features: RyoSneakerFeatures = {
      displayNameOfficial: "adidas Samba OG",
      brandOfficial: "adidas",
      modelOfficial: "Samba OG",
      verified: true,
      isAbstractName: false,
      hasLocalizedMainName: false,
      traits: {},
    };
    expect(validateRyoDisplayName(features)).toEqual({ ok: true, penalties: [] });
  });
});
