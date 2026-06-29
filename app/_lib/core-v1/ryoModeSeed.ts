export type RyoSeedSneaker = {
  brand: string;
  model: string;
  family: string;
  aliases: string[];
  context: string;
};

export type RyoModeSeedProfile = {
  profileId: "ryo-mode-seed-v2";
  displayName: "林諒馬";
  ownedModels: RyoSeedSneaker[];
  wishlistModels: RyoSeedSneaker[];
  preferredBrands: string[];
  preferredColors: string[];
  preferredMaterials: string[];
  preferredContexts: string[];
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

export const ryoModeSeed: RyoModeSeedProfile = {
  profileId: "ryo-mode-seed-v2",
  displayName: "林諒馬",
  ownedModels: ownedModelNames.map(createSeedSneaker),
  wishlistModels: wishlistModelNames.map(createSeedSneaker),
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
  cautionSignals: [
    "所有モデルとfamily・役割が重複する",
    "色違いだけで体験が増えない",
    "価格に対して語れる背景が弱い",
    "流行だけで選んでいる",
    "既存コレクション内で役割が薄い",
  ],
};

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
    "New Balance",
    "PRO-Keds",
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
    ["Air Jordan 11", /air jordan 11/i],
    ["Air Jordan 6", /air jordan 6/i],
    ["Air Jordan 1", /air jordan 1/i],
    ["Air Max 95", /air max 95/i],
    ["Astro Grabber", /astro grabber/i],
    ["Moon Shoe", /moon shoe/i],
    ["Cortez", /cortez/i],
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
    ["Puma Clyde", /puma clyde/i],
    ["Puma Suede", /puma suede/i],
    ["Era 95", /era 95/i],
    ["Authentic", /authentic/i],
    ["Style 31", /style 31/i],
    ["Half Cab", /half cab/i],
    ["Chukka 49", /chukka 49/i],
    ["Knu Skool", /knu skool/i],
    ["New Balance 2002R", /2002r/i],
    ["New Balance 998", /\b998\b/i],
    ["New Balance 990V3", /990v3/i],
    ["New Balance 991V2", /991v2/i],
    ["New Balance 2010", /new balance 2010/i],
    ["Royal Plus", /royal plus/i],
  ];
  return families.find(([, pattern]) => pattern.test(model))?.[0] ?? model;
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
