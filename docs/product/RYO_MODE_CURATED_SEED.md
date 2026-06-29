# Ryo Mode Curated Recommendation Seed

## Purpose

The curated recommendation seed widens the candidates and taste references used by Ryo Mode. It describes sneakers Ryo considers recommendable or worth watching; it is not an ownership record, purchase history, or personal memory.

The seed emphasizes classic and retro construction, historical context, materials that develop patina, wearable deep colors, playful details, and affordable alternatives. High-tech sneakers are not rejected when they fit the user's preference.

## Data boundary

- `ownedModels` remains the real owned collection.
- `wishlistModels` remains the existing personal wishlist seed.
- `curatedRecommendationModels` is a separate recommendation reference.
- Curated entries have no `owned` flag and are never written to `data/users`.
- A curated match may contribute a bounded Ryo Mode reference bonus, but it cannot replace Core score inputs or directly set a Decision.

Each curated entry preserves `rawName`. Brand, model family, colorway, price expectation, style tags, and reason tags are normalized only where the source text supports it.

## Release-watch and external evidence

`release_watch` means a model may be discussed as a future or uncertain candidate. It does not assert that the sneaker is released, purchasable, fairly priced, in stock, or available in the user's size. Those facts require separate external evidence.

## Preference policy

- One Star, Air Jordan 1 High, and Jack Purcell are strong reference families.
- Leather, suede, and canvas receive credit for aging character.
- Gore-Tex receives practical rainy-day credit; canvas can also be a rainy-day option when fading and wear suit the model.
- Black canvas staples such as Converse All Star J HI and Vans Authentic are valued for versatility, easy care, and character after wear.
- New Balance 991, 993, 990v4-or-earlier, and 1500 families lean positive. 2002R and 2010 are budget alternatives. 990v5-or-later is not automatically boosted.
- Price, size, condition, availability, and release status remain external-evidence questions.
