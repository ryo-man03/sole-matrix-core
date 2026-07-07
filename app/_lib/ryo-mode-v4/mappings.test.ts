import { inferMappedRyoTraits } from "./mappings";

describe("Ryo Mode v4 model mappings", () => {
  it("maps pants compatibility without creating a model ranking", () => {
    expect(inferMappedRyoTraits("Nike Air Force 1 Low White/White")).toMatchObject({
      widePantsGood: true,
      straightPantsGood: true,
      denimGood: true,
      workPantsGood: true,
    });
    expect(inferMappedRyoTraits("adidas Samba OG")).toMatchObject({
      straightPantsGood: true,
      slimPantsGood: true,
    });
  });

  it("maps sports origin and cut corrections", () => {
    expect(inferMappedRyoTraits("Nike Air Jordan 1 High 85 Bred")).toMatchObject({
      sportOrigin: "basketball",
      highCut: true,
    });
    expect(inferMappedRyoTraits("Vans Half Cab Black")).toMatchObject({
      sportOrigin: "skate",
      midCut: true,
    });
    expect(inferMappedRyoTraits("Nike Air Max 95 Neon")).toMatchObject({
      sportOrigin: "running",
    });
  });
});
