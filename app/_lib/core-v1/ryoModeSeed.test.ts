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
