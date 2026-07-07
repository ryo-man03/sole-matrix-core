import type { RyoSneakerFeatures } from "./types";

type RyoTraits = RyoSneakerFeatures["traits"];

export const RYO_PANTS_MODEL_MAPPINGS = {
  widePants: [
    "Nike Air Jordan 1 High", "Nike Air Force 1 Low", "Converse All Star Hi",
    "Converse One Star", "PUMA Suede", "PUMA Clyde", "Vans Half Cab",
    "adidas Superstar", "adidas Bern", "New Balance 991", "New Balance 993", "New Balance 998",
  ],
  straightPants: [
    "Nike Air Force 1 Low", "Converse Jack Purcell", "Vans Authentic", "Vans Era",
    "adidas Samba", "adidas Tobacco", "adidas Gazelle", "adidas Superstar",
    "PUMA Clyde", "Nike Cortez", "New Balance 2002R", "New Balance 2010",
  ],
  denim: [
    "Nike Air Jordan 1 High", "Nike Air Force 1 Low", "Converse One Star",
    "Converse All Star Hi", "PUMA Suede", "adidas Galapagos", "adidas Tobacco",
    "Vans Authentic", "Reebok Classic Leather",
  ],
  workPants: [
    "Nike Air Force 1 Low", "Converse Jack Purcell", "adidas Bern", "PUMA Suede",
    "PUMA Clyde", "Nike Blazer Mid", "Nike Terminator High", "Vans Half Cab",
    "New Balance 993", "Reebok Classic Leather",
  ],
  slimPants: [
    "adidas Samba", "Converse Jack Purcell", "Nike Cortez", "Vans Authentic", "adidas Tobacco",
  ],
} as const;

export const RYO_SPORT_ORIGIN_MAPPINGS = {
  basketball: [
    "Nike Air Jordan 1", "Nike Air Jordan 11", "Nike Air Force 1", "Nike Terminator High",
    "Nike Blazer Mid", "Converse Weapon", "Converse Pro Leather", "adidas Superstar", "PUMA Clyde",
  ],
  tennis: [
    "Converse Jack Purcell", "adidas Stan Smith", "adidas Rod Laver",
    "PRO-Keds Royal Plus", "Reebok Club C",
  ],
  football: [
    "adidas Samba", "adidas Gazelle", "adidas Hamburg", "adidas Bern",
    "adidas Tobacco", "adidas Japan", "adidas Country", "Nike Astro Grabber",
  ],
  skate: [
    "Vans Authentic", "Vans Era", "Vans Half Cab", "Vans Knu Skool",
    "Converse One Star", "PUMA Suede", "Last Resort AB VM001",
  ],
  running: [
    "Nike Cortez", "Nike LD-1000", "Nike Air Max 95", "New Balance 991",
    "New Balance 993", "New Balance 998", "New Balance 2002R", "New Balance 2010",
  ],
} as const;

export const RYO_CUT_CORRECTIONS = {
  highCut: ["Nike Air Jordan 1 High", "Converse All Star Hi", "Nike Terminator High", "Nike Blazer Mid"],
  lowCut: [
    "Nike Air Force 1 Low", "Converse Jack Purcell", "Vans Authentic", "Vans Era",
    "PUMA Suede", "PUMA Clyde", "adidas Samba", "adidas Tobacco", "adidas Gazelle",
    "adidas Hamburg", "adidas Bern",
  ],
  oxCut: ["Converse One Star", "Converse Jack Purcell"],
  midCut: ["Vans Half Cab"],
} as const;

export function inferMappedRyoTraits(displayName: string): Partial<RyoTraits> {
  const traits: Partial<RyoTraits> = {};
  for (const [trait, models] of Object.entries(RYO_PANTS_MODEL_MAPPINGS)) {
    if (models.some((model) => modelNameMatches(displayName, model))) {
      traits[`${trait}Good` as keyof RyoTraits] = true as never;
    }
  }
  for (const [origin, models] of Object.entries(RYO_SPORT_ORIGIN_MAPPINGS)) {
    if (models.some((model) => modelNameMatches(displayName, model))) {
      traits.sportOrigin = origin as NonNullable<RyoTraits["sportOrigin"]>;
      break;
    }
  }
  for (const [trait, models] of Object.entries(RYO_CUT_CORRECTIONS)) {
    if (models.some((model) => modelNameMatches(displayName, model))) {
      traits[trait as keyof RyoTraits] = true as never;
    }
  }
  return traits;
}

export function modelNameMatches(displayName: string, mappedModel: string): boolean {
  return normalizeModelName(displayName).includes(normalizeModelName(mappedModel));
}

function normalizeModelName(value: string): string {
  return value.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, " ").trim();
}
