import { ryoModeSeed } from "./ryoModeSeed";

describe("Ryo Mode real collection seed", () => {
  it("contains the supplied owned collection and de-duplicated wishlist", () => {
    expect(ryoModeSeed.profileId).toBe("ryo-mode-seed-v2");
    expect(ryoModeSeed.ownedModels).toHaveLength(41);
    expect(ryoModeSeed.wishlistModels).toHaveLength(40);
    expect(ryoModeSeed.ownedModels.map((item) => item.model)).toEqual(
      expect.arrayContaining([
        'Nike Air Jordan 1 High 85 "Bred" (2025)',
        'BILLY\'S Exclusive Puma Clyde MIJ "Puma Black/Puma Silver"',
        'New Balance 2002R "Navy" (Safari Exclusive)',
      ]),
    );
    expect(ryoModeSeed.wishlistModels.map((item) => item.model)).toEqual(
      expect.arrayContaining([
        'Virgil Abloh Archive (V.A.A.) × Nike Air Jordan 1 Retro High OG "Alaska"',
        'SOMA × Converse One Star J VTG Suede Timeline "Black/Grey"',
        'KITH × New Balance 991V2 "Asphalt/Lead/Oyster Mushroom"',
      ]),
    );
  });

  it("keeps curated recommendations separate from owned sneakers and personal memory", () => {
    expect(ryoModeSeed.curatedRecommendationModels).toHaveLength(49);
    expect(
      ryoModeSeed.curatedRecommendationModels.map((item) => item.rawName),
    ).toEqual(
      expect.arrayContaining([
        'Nike TERMINATOR HIGH OG "Georgetown" GRANITE / DARK OBSIDIAN / SAIL',
        "Converse All Star J HI Black",
        "Vans Authentic Black / Black",
        "New Balance U993GG Gray",
        "Reebok Classic Leather 1983 Vintage Chalk",
      ]),
    );
    expect(
      ryoModeSeed.ownedModels.map((item) => item.model),
    ).not.toContain("Converse All Star J HI Black");
    expect(
      ryoModeSeed.curatedRecommendationModels.every(
        (item) => !("owned" in item),
      ),
    ).toBe(true);
  });

  it("preserves raw names while keeping normalized fields optional", () => {
    const terminator = ryoModeSeed.curatedRecommendationModels[0];
    const releaseWatch = ryoModeSeed.curatedRecommendationModels.find((item) =>
      item.rawName.includes("Stranger Things 5"),
    );

    expect(terminator).toMatchObject({
      rawName: 'Nike TERMINATOR HIGH OG "Georgetown" GRANITE / DARK OBSIDIAN / SAIL',
      brand: "Nike",
      modelFamily: "Terminator High",
      status: "recommendable",
    });
    expect(releaseWatch).toMatchObject({
      status: "release_watch",
      notes: expect.stringContaining("外部証拠"),
    });
  });

  it("represents classic, patina, rainy-day, and New Balance preferences", () => {
    const canvas = ryoModeSeed.curatedRecommendationModels.find((item) =>
      item.rawName.includes("VM001 Canvas Lo"),
    );

    expect(ryoModeSeed.recommendationPrinciples).toEqual(
      expect.arrayContaining([
        "classic",
        "retro",
        "historical_context",
        "patina",
        "affordable_first",
      ]),
    );
    expect(ryoModeSeed.rainyDayPreferenceTags).toEqual(
      expect.arrayContaining(["gore_tex_practicality", "canvas_rain_candidate"]),
    );
    expect(canvas?.styleTags).toEqual(
      expect.arrayContaining(["canvas", "rain_candidate", "patina"]),
    );
    expect(ryoModeSeed.newBalancePreference).toMatchObject({
      preferredFamilies: expect.arrayContaining(["991", "993", "1500"]),
      budgetAlternatives: expect.arrayContaining(["2002R", "2010"]),
      cautionFamilies: ["990v5_or_later"],
    });
  });

  it("keeps family and cultural context for overlap analysis", () => {
    const clyde = ryoModeSeed.ownedModels.find((item) =>
      item.model.includes("Puma Clyde MIJ"),
    );
    const germany = ryoModeSeed.ownedModels.find((item) =>
      item.model.includes("Made in Germany"),
    );

    expect(clyde).toMatchObject({
      brand: "Puma",
      family: "Puma Clyde",
      aliases: expect.arrayContaining(["Clyde MIJ"]),
    });
    expect(germany?.context).toContain("German production");
  });
});
