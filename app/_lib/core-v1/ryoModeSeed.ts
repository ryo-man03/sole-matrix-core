export type RyoSeedSneaker = {
  brand: string;
  model: string;
  family: string;
  aliases: string[];
  context: string;
};

export type RyoCuratedSneakerSeed = {
  rawName: string;
  brand: string;
  modelFamily?: string;
  colorway?: string;
  status: "wishlist" | "recommendable" | "release_watch";
  recommendationReasonTags: string[];
  priceExpectation?: "affordable" | "mid" | "premium" | "unknown";
  styleTags: string[];
  notes?: string;
};

export type RyoModeSeedProfile = {
  profileId: "ryo-mode-seed-v2";
  displayName: "林諒馬";
  ownedModels: RyoSeedSneaker[];
  wishlistModels: RyoSeedSneaker[];
  curatedRecommendationModels: RyoCuratedSneakerSeed[];
  preferredBrands: string[];
  preferredColors: string[];
  preferredMaterials: string[];
  preferredContexts: string[];
  rainyDayPreferenceTags: string[];
  recommendationPrinciples: string[];
  newBalancePreference: {
    preferredFamilies: string[];
    budgetAlternatives: string[];
    cautionFamilies: string[];
    rationale: string;
  };
  cautionSignals: string[];
};

const ownedModelNames = [
  'Nike Air Jordan 1 High 85 "Bred" (2025)',
  'Nike Air Jordan 1 Retro High OG "Hyper Crimson"',
  'Nike Air Jordan 1 Retro High OG "Shattered Backboard" (2025)',
  'Nike Air Jordan 1 Retro Low OG "Chicago" (2025)',
  'Nike OG Cortez "Redwood/White" (1970s shape reissue)',
  'adidas Bern GORE-TEX "Dark Brown/Cream White/Wonder White"',
  'BILLY\'S Exclusive adidas Shibuya "Night Indigo"',
  'adidas Superstar Vintage Made in Germany "Core Black/Core White/Cream White"',
  'JJJJound × adidas Samba Tobacco "Mesa/Gum"',
  'BILLY\'S Exclusive adidas Gazelle Indoor "Core Black/Metallic Silver"',
  'BILLY\'S Exclusive adidas Hamburg "Legend Ink/Silver Metallic/Gold Metallic"',
  'adidas Tobacco "Core Black/Dark Brown/Gum"',
  'adidas Galapagos "Burgundy/Wild Sepia"',
  'Converse One Star J VTG "Orange"',
  'Converse One Star J VTG "Red"',
  'Converse One Star J VTG Canvas "Black"',
  'Converse One Star J "Black"',
  'Converse One Star J "Black/Red"',
  'BILLY\'S Exclusive Converse One Star J Suede "Aged Navy"',
  'Stranger Things 5 × Converse One Star Suede "Black"',
  'OSHMAN\'S × Converse Weapon PS Hi "OSHMAN’S 40th Anniversary"',
  'Converse All Star US IGNT Hi "Blue"',
  'Hot Wheels × Converse All Star Aged FL Hi "Sky Blue"',
  'Converse Canvas All Star J Hi "Red"',
  'Converse All Star J Okayamadenim Hi "Black"',
  'Converse All Star J VTG 59 Hi "Timeline Black"',
  'Converse LEA All Star JOE Hi "Red"',
  'Converse All Star Localize Hi "Tokyo"',
  'Converse All Star Aged Waxed Leather Hi "Antique Brown"',
  'Converse All Star R Olive Green Leather Hi "Deep Sea"',
  'Converse Jack Purcell 1935 "Black"',
  'Converse Jack Purcell Leather "Black"',
  'Converse Jack Purcell "Olive Green Leather"',
  'Converse Jack Purcell RET Colors',
  'Converse Jack Purcell RET Patent',
  'atmos × SOMA × Puma Suede VTG MIJ "Gold Monster"',
  'BILLY\'S Exclusive Puma Clyde MIJ "Puma Black/Puma Silver"',
  'Noah × Puma Suede Classic Mid "Elektro Blue"',
  'OTW by Vans Era 95 Vibram "Racing Red/Navy Blue"',
  'Vans Premium Authentic "Red"',
  'New Balance 2002R "Navy" (Safari Exclusive)',
] as const;

const wishlistModelNames = [
  'Virgil Abloh Archive (V.A.A.) × Nike Air Jordan 1 Retro High OG "Alaska"',
  'Nike Air Jordan 1 Retro High "Chicago"',
  'Nike Air Jordan 11 Retro "Bred"',
  'Eric Koston × Nike SB Air Max 95 "Obsidian and Speed Yellow"',
  'Nike Air Jordan 1 Retro High "Chicago" (2015)',
  'BODE × Nike Astro Grabber "Black and Coconut Milk"',
  'Jacquemus × Nike Women’s Moon Shoe SP "University Red"',
  'Nike Air Max 95 "Black/Hyper Crimson"',
  'Yu-Gi-Oh! × Nike Air Max 95 "Air Muscle/Joey"',
  'Nike Air Jordan 6 Retro PRM "Bin23" (2300 pairs)',
  'Nike Cortez QS PRM "Forrest Gump"',
  'Wales Bonner × adidas Karintha "Core Black/Wonder White/Lush Blue"',
  'adidas State Series OR "Shadow Maroon/Core Black"',
  'adidas Superstar 82 GORE-TEX "Cloud White/Core Black"',
  'Jonah Hill × adidas Samba "Craft Ochre"',
  'Wales Bonner × adidas Gazelle Indoor Pony Hair "Aurora Coffee"',
  'adidas London "Red/Black"',
  'adidas Superstar Vintage Made in Germany "Core White/Core Black/Cream White"',
  'adidas Tobacco "Pantone/Mesa/Gum"',
  'Vans Vault × Julian Klincewicz UA OG Style 31 LX "Umber & Black Beauty"',
  'adidas Japan "Cloud White/Power Red/Cream White"',
  'Converse Pro Leather J VTG OX 50th Anniversary "Black/Grey"',
  'Back To The Future × Converse All Star US LG Hi "Black"',
  'Converse Addict All Star Training Shoes "Red"',
  'SOMA × Converse One Star J VTG Suede Timeline "Black/Grey"',
  'Converse Addict One Star Loafer "Black"',
  'Converse One Star J VTG Hi "50th Anniversary"',
  'Dime × Vans Half Cab "Blue/Marshmallow"',
  'White Mountaineering × Vans Chukka 49 DX "Brown/Beige"',
  'Vans Knu Skool Suede "Black/White"',
  'BEDWIN & THE HEARTBREAKERS × Vans Vault OG Authentic LX "Bandana Black"',
  'UNDERCOVER × OTW by Vans Era 95 Dog "Red"',
  'Puma Suede Charles F. Stead IV "Orange Glo/Puma White"',
  'PRO-Keds Royal Plus Suede Hi "Mustard"',
  'New Balance 998 "Brown/Black"',
  'New Balance 990V3 "Moonbeam"',
  'New Balance 990V3 "Gray"',
  'KITH × New Balance 991V2 "Asphalt/Lead/Oyster Mushroom"',
  'New Balance 991V2 "Vintage Sport"',
  'New Balance 2010 "Brown"',
] as const;

const curatedRecommendationNames = [
  'Nike TERMINATOR HIGH OG "Georgetown" GRANITE / DARK OBSIDIAN / SAIL',
  "Nike Blazer Mid '77 Vintage White / Black",
  "Nike Blazer Mid '77 Vintage Black",
  "Nike WMNS Cortez VNTG Black / Sail",
  "Nike LD-1000 Black / Sail / Sesame",
  "Converse Stranger Things 5 × Converse All Star Aged 87 CL HI",
  "Converse One Star Suede Black",
  "Converse All Star J HI Black",
  "Converse Star & Bars Suede Red",
  "Converse One Star J VTG HS Suede Black",
  "Converse One Star Suede Navy",
  "Converse One Star J Suede Purple",
  "adidas Liverpool College Green / Pyrite / College Royal",
  "adidas Campus 80s by Preloved Inc / Wonder White",
  "adidas Dover Street Market × adidas Samba Core Black / Footwear White / Gum",
  "adidas Brain Dead × adidas Bowling Black",
  "adidas Brain Dead × adidas Bowling White",
  "adidas Japan",
  "adidas MK II Conavy / Legink / FTWWHT",
  "adidas Gazelle Core Black / White / Gold Metallic",
  "adidas Superstar 82 FI Forum Home Alone",
  "adidas Country OG Night Indigo / Off White / Silver Metallic",
  "adidas Forum Home Alone Cream White / College Red / Off White",
  "adidas Samba OG Core Black / Footwear White / Gum",
  "adidas Samba OG Footwear White / Core Black / Clear Granite",
  "adidas Country OG College Green / Chalk White / Gum",
  "adidas MK II Auburn / Carbrn / Mesa",
  "adidas Campus 00s CBLK / SVMT / CWHT",
  "Vans Authentic Black / Black",
  "Vans Authentic Reissue 44 LX",
  "Vans OG Authentic LX Black / White",
  "Vans Bold Ni Staple Black / White",
  "Vans Knu Skool Red / True White",
  "Vans Half Cab Black / White",
  "Vans OG Classic Slip-On LX Black / White Checkerboard",
  "Vans Knu Skool Navy / True White",
  "Puma Brasil Myrtle / Tangerine",
  "Puma Brasil Tangerine / Dark Myrtle",
  "Puma Clyde OG Parisian Night / Puma White / Pristine",
  "Puma Suede",
  "New Balance U1500PBK Black / Gray",
  "New Balance M991GL Gray",
  "New Balance U991GG2 Gray / Navy",
  "New Balance U990NV4 Navy",
  "New Balance U993GG Gray",
  "New Balance M2002RHO Phantom",
  "Size? × New Balance 990v3 Orange / Cream",
  "Last Resort AB Julian Smith × Last Resort AB VM001 Canvas Lo",
  "Reebok Classic Leather 1983 Vintage Chalk",
] as const;

export const ryoModeSeed: RyoModeSeedProfile = {
  profileId: "ryo-mode-seed-v2",
  displayName: "林諒馬",
  ownedModels: ownedModelNames.map(createSeedSneaker),
  wishlistModels: wishlistModelNames.map(createSeedSneaker),
  curatedRecommendationModels: curatedRecommendationNames.map(
    createCuratedRecommendation,
  ),
  preferredBrands: [
    "Nike",
    "Jordan",
    "adidas",
    "Converse",
    "Puma",
    "Vans",
    "New Balance",
    "PRO-Keds",
  ],
  preferredColors: [
    "black",
    "red",
    "brown",
    "navy",
    "indigo",
    "burgundy",
    "cream white",
    "orange",
    "olive green",
    "sky blue",
    "silver",
    "gold",
  ],
  preferredMaterials: [
    "suede",
    "leather",
    "canvas",
    "gum sole",
    "GORE-TEX",
    "denim",
    "patent leather",
    "waxed leather",
    "pony hair",
    "Vibram sole",
  ],
  preferredContexts: [
    "1980s-1990s basketball",
    "1970s running reissue",
    "terrace",
    "skate",
    "Japanese production / MIJ",
    "German production",
    "vintage / VTG / Timeline",
    "collaboration archive",
    "store exclusive",
    "brand history",
  ],
  rainyDayPreferenceTags: [
    "gore_tex_practicality",
    "canvas_rain_candidate",
    "canvas_color_fade",
    "easy_care",
  ],
  recommendationPrinciples: [
    "classic",
    "retro",
    "historical_context",
    "patina",
    "wearable_deep_color",
    "playful_detail",
    "affordable_first",
    "limited_colorway",
    "release_watch_requires_external_evidence",
    "high_tech_is_user_context_dependent",
  ],
  newBalancePreference: {
    preferredFamilies: ["991", "993", "990v4_or_earlier", "1500"],
    budgetAlternatives: ["2002R", "2010"],
    cautionFamilies: ["990v5_or_later"],
    rationale: "990v5以降は大きく見えるNロゴがRyo Modeの主な好みではない。",
  },
  cautionSignals: [
    "所有モデルとfamily・役割が重複する",
    "色違いだけで体験が増えない",
    "価格に対して語れる背景が弱い",
    "流行だけで選んでいる",
    "既存コレクション内で役割が薄い",
  ],
};

function createCuratedRecommendation(rawName: string): RyoCuratedSneakerSeed {
  const brand = inferBrand(rawName);
  const modelFamily = inferFamily(rawName);
  const colorway = inferColorway(rawName, modelFamily);
  const isReleaseWatch = /Stranger Things 5/i.test(rawName);

  return {
    rawName,
    brand,
    ...(modelFamily !== rawName ? { modelFamily } : {}),
    ...(colorway ? { colorway } : {}),
    status: isReleaseWatch ? "release_watch" : "recommendable",
    recommendationReasonTags: inferRecommendationReasonTags(rawName),
    priceExpectation: inferPriceExpectation(rawName),
    styleTags: inferCuratedStyleTags(rawName),
    ...(isReleaseWatch ? {
      notes: "発売状況・価格・サイズ・入手性は外部証拠で確認する。",
    } : {}),
  };
}

function createSeedSneaker(model: string): RyoSeedSneaker {
  const brand = inferBrand(model);
  const family = inferFamily(model);
  return {
    brand,
    model,
    family,
    aliases: familyAliases(family),
    context: inferContext(model),
  };
}

function inferBrand(model: string): string {
  const brands = [
    "Last Resort AB",
    "New Balance",
    "PRO-Keds",
    "Reebok",
    "Converse",
    "adidas",
    "Puma",
    "Vans",
    "Nike",
  ];
  return brands.find((brand) => model.toLowerCase().includes(brand.toLowerCase())) ?? "Unknown";
}

function inferFamily(model: string): string {
  const families: Array<[string, RegExp]> = [
    ["Terminator High", /terminator high/i],
    ["Blazer Mid", /blazer mid/i],
    ["LD-1000", /ld-1000/i],
    ["Air Jordan 11", /air jordan 11/i],
    ["Air Jordan 6", /air jordan 6/i],
    ["Air Jordan 1", /air jordan 1/i],
    ["Air Max 95", /air max 95/i],
    ["Astro Grabber", /astro grabber/i],
    ["Moon Shoe", /moon shoe/i],
    ["Cortez", /cortez/i],
    ["Campus 80s", /campus 80s/i],
    ["Campus 00s", /campus 00s/i],
    ["Country OG", /country og/i],
    ["Forum", /\bforum\b/i],
    ["Bowling", /\bbowling\b/i],
    ["MK II", /mk ii/i],
    ["Liverpool", /\bliverpool\b/i],
    ["Superstar", /superstar/i],
    ["Samba", /samba/i],
    ["Gazelle Indoor", /gazelle indoor/i],
    ["Hamburg", /hamburg/i],
    ["Tobacco", /tobacco/i],
    ["Bern", /\bbern\b/i],
    ["Shibuya", /shibuya/i],
    ["Galapagos", /galapagos/i],
    ["Karintha", /karintha/i],
    ["State Series", /state series/i],
    ["London", /\blondon\b/i],
    ["adidas Japan", /adidas japan/i],
    ["One Star", /one star/i],
    ["Jack Purcell", /jack purcell/i],
    ["All Star", /all star/i],
    ["Weapon", /weapon/i],
    ["Pro Leather", /pro leather/i],
    ["Star & Bars", /star & bars/i],
    ["Puma Clyde", /puma clyde/i],
    ["Puma Suede", /puma suede/i],
    ["Era 95", /era 95/i],
    ["Authentic", /authentic/i],
    ["Classic Slip-On", /classic slip-on/i],
    ["Bold Ni", /bold ni/i],
    ["Style 31", /style 31/i],
    ["Half Cab", /half cab/i],
    ["Chukka 49", /chukka 49/i],
    ["Knu Skool", /knu skool/i],
    ["New Balance 2002R", /2002r/i],
    ["New Balance 998", /\b998\b/i],
    ["New Balance 990V3", /990v3/i],
    ["New Balance 991V2", /991v2/i],
    ["New Balance 2010", /new balance 2010/i],
    ["New Balance 1500", /\b(?:u|m)?1500/i],
    ["New Balance 991", /\b(?:u|m)?991/i],
    ["New Balance 993", /\b(?:u|m)?993/i],
    ["New Balance 990V4", /990nv4|990v4/i],
    ["New Balance 990V3", /990v3/i],
    ["VM001", /vm001/i],
    ["Classic Leather", /classic leather/i],
    ["Puma Brasil", /puma brasil/i],
    ["Royal Plus", /royal plus/i],
  ];
  return families.find(([, pattern]) => pattern.test(model))?.[0] ?? model;
}

function inferColorway(rawName: string, family: string): string | undefined {
  const familyIndex = rawName.toLowerCase().indexOf(family.toLowerCase());
  if (familyIndex < 0) return undefined;
  const suffix = rawName.slice(familyIndex + family.length).trim();
  return suffix.length > 0 ? suffix.replace(/^[-–—:/\s]+/, "") : undefined;
}

function inferRecommendationReasonTags(rawName: string): string[] {
  const tags = ["classic_heritage", "curated_reference"];
  if (/vintage|vntg|vtg|aged|1983|og|reissue|80s/i.test(rawName)) {
    tags.push("historical_context");
  }
  if (/suede|leather|canvas/i.test(rawName)) tags.push("patina_material");
  if (/authentic|all star j hi|puma suede$|classic leather|blazer mid|2002r/i.test(rawName)) {
    tags.push("affordable_alternative");
  }
  if (/black|navy|indigo|gray|granite|myrtle|auburn|phantom/i.test(rawName)) {
    tags.push("wearable_deep_color");
  }
  return tags;
}

function inferPriceExpectation(
  rawName: string,
): NonNullable<RyoCuratedSneakerSeed["priceExpectation"]> {
  if (/new balance (?!m2002r)|u1500|m991|u991|u990|u993|990v3/i.test(rawName)) {
    return "premium";
  }
  if (/authentic|all star j hi|puma suede$|classic leather|blazer mid|2002r/i.test(rawName)) {
    return "affordable";
  }
  if (/×|dover street market|brain dead|preloved/i.test(rawName)) return "premium";
  return "mid";
}

function inferCuratedStyleTags(rawName: string): string[] {
  const tags = ["classic", "retro", "low_tech"];
  if (/vintage|vntg|vtg|aged|1983|og|reissue|80s/i.test(rawName)) {
    tags.push("historical");
  }
  if (/suede/i.test(rawName)) tags.push("suede", "patina");
  if (/leather/i.test(rawName)) tags.push("leather", "patina");
  if (/canvas|all star|authentic|slip-on/i.test(rawName)) {
    tags.push("canvas", "rain_candidate", "patina");
  }
  return [...new Set(tags)];
}

function familyAliases(family: string): string[] {
  const aliases: Record<string, string[]> = {
    "Air Jordan 1": ["Jordan 1", "AJ1"],
    "Air Jordan 11": ["Jordan 11", "AJ11"],
    "Air Jordan 6": ["Jordan 6", "AJ6"],
    "New Balance 2002R": ["NB 2002R", "2002R"],
    "New Balance 990V3": ["NB 990V3", "990V3"],
    "New Balance 991V2": ["NB 991V2", "991V2"],
    "Puma Clyde": ["Clyde MIJ", "Clyde"],
    "Puma Suede": ["Suede MIJ", "Suede VTG"],
  };
  return aliases[family] ?? [];
}

function inferContext(model: string): string {
  const contexts: string[] = [];
  if (/made in germany|germany/i.test(model)) contexts.push("German production");
  if (/\bMIJ\b|\bJ\b|Japanese|Okayama/i.test(model)) contexts.push("Japanese production");
  if (/VTG|vintage|timeline|1935|50th|1970/i.test(model)) contexts.push("vintage / reissue history");
  if (/×|exclusive|collaboration|archive/i.test(model)) contexts.push("collaboration / exclusive context");
  if (/gore-tex|vibram/i.test(model)) contexts.push("functional material");
  if (/air jordan|weapon|pro leather|clyde/i.test(model)) contexts.push("basketball heritage");
  if (/samba|tobacco|gazelle|hamburg|bern|london/i.test(model)) contexts.push("terrace heritage");
  if (/vans|half cab|one star/i.test(model)) contexts.push("skate context");
  return contexts.length > 0 ? contexts.join(" / ") : "brand and model history";
}
