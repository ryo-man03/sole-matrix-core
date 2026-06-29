# User Target and Delivery

## Who this product serves

SOLE//MATRIX v1.1 Product-ready Beta is designed primarily for students and young professionals who like sneakers but cannot yet turn taste, wardrobe fit, budget, and purchase timing into a confident decision. It should also help an experienced recommender explain a judgment without asking the user to accept taste as authority.

The product is not a marketplace, an authentication service, a price oracle, or an authenticity checker. Its promise is narrower: make the user's preferences legible, produce a reproducible Core recommendation, and show uncertain external information without silently changing that recommendation.

## User pain and value

- Taste is often felt before it can be named.
- A popular or expensive pair is not automatically right for a specific wardrobe.
- Availability, release status, price, images, and seller listings are volatile evidence.
- Advice becomes hard to trust when AI output and external APIs can alter the answer invisibly.

SOLE//MATRIX answers those problems with an explicit preference vector, deterministic TypeScript scoring, two evaluation modes, and a separate external-evidence layer with readiness and confidence labels.

## Start and return flow

1. Enter through the product home and `/login`.
2. Choose the login-equivalent path or a one-diagnosis guest session.
3. Complete the six-step `/onboarding` flow when a temporary preference hint is useful.
4. Run the eight-question diagnosis in `/app`.
5. Review the Core recommendation and external evidence as separate outputs.
6. Record one of three satisfaction states and an optional reason.
7. Review storage and deletion boundaries in `/settings`.

Guest state is limited to browser storage and never creates personal `memory.md` data. The login-equivalent path can use the existing local profile and memory boundary, but it is not production authentication. Supabase environment placeholders document the intended next integration without exposing a secret to the browser.

## Responsive delivery

The primary experience starts as a single-column mobile flow and progressively expands. At 1024px and above, the workspace presents three columns for inputs, the Core result, and memory or evidence context. The delivery baseline covers 390, 500, 768, 1024, and 1440 pixel viewport widths without horizontal overflow.

## Decision and evidence boundary

TypeScript Core owns candidate scoring and the final Decision. Ryo Mode curated references contribute only a bounded preference signal. Rakuten listings, Gemini image features, URL metadata or URL Context, and global feedback patterns remain external evidence. They may explain uncertainty or support a follow-up check, but do not enter the Core candidate set, alter `budgetFit`, or set the Decision.

## Beta delivery status

This beta includes the entry flow, guest and login-equivalent session boundary, onboarding, responsive workspace, satisfaction feedback, anonymized global corpus, Ryo curated seed, external evidence panel, settings, tests, and documentation. Production authentication, durable hosted storage, account deletion, provider credentials, and operational monitoring remain deployment work rather than completed product capabilities.
