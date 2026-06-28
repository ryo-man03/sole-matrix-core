export type RyoSeedSneaker = {
  brand: string;
  model: string;
  aliases: string[];
  context: string;
};

export type RyoModeSeedProfile = {
  profileId: "ryo-mode-seed-v1";
  displayName: "林諒馬";
  ownedModels: RyoSeedSneaker[];
  wishlistModels: RyoSeedSneaker[];
  preferredBrands: string[];
  preferredColors: string[];
  preferredMaterials: string[];
  preferredContexts: string[];
  cautionSignals: string[];
};

export const ryoModeSeed: RyoModeSeedProfile = {
  profileId: "ryo-mode-seed-v1",
  displayName: "林諒馬",
  ownedModels: [
    sneaker("Nike", "Air Jordan 1", ["AJ1", "Jordan 1"], "1980年代のバスケットボール"),
    sneaker("adidas", "Samba", ["Samba OG"], "terrace / gum sole"),
    sneaker("Converse", "One Star", ["One Star J", "ワンスター"], "skate / vintage"),
    sneaker("Vans", "Authentic", ["オーセンティック"], "canvas / skate"),
    sneaker("New Balance", "990", ["990v3", "990v4", "99x"], "running heritage"),
  ],
  wishlistModels: [
    sneaker("adidas", "Tobacco", ["Tobacco Gruen"], "terrace / suede"),
    sneaker("adidas", "Hamburg", ["Hamburg Made in Germany"], "terrace / German production"),
    sneaker("Converse", "Jack Purcell Addict", ["Jack Purcell", "Addict"], "Japanese premium reproduction"),
    sneaker("Puma", "Clyde MIJ", ["Clyde", "Made in Japan"], "basketball heritage"),
    sneaker("Vans", "Half Cab", ["Halfcab"], "skate history"),
    sneaker("New Balance", "2002R", ["2002", "NB 2002R"], "running / lifestyle"),
  ],
  preferredBrands: ["Nike", "Jordan", "adidas", "Converse", "Puma", "Vans", "New Balance"],
  preferredColors: ["black", "red", "brown", "navy", "burgundy", "ecru"],
  preferredMaterials: ["suede", "leather", "gum sole", "canvas"],
  preferredContexts: [
    "1980s-1990s basketball",
    "terrace",
    "skate",
    "Japanese production",
    "German production",
    "vintage",
    "reissue",
    "brand history",
  ],
  cautionSignals: [
    "所有モデルと役割が重複する",
    "色違いだけで体験が増えない",
    "価格に対して語れる背景が弱い",
    "流行だけで選んでいる",
    "既存コレクション内で役割が薄い",
  ],
};

function sneaker(
  brand: string,
  model: string,
  aliases: string[],
  context: string,
): RyoSeedSneaker {
  return { brand, model, aliases, context };
}
