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

1. Enter through the landing-only `/` and continue to `/login`.
2. Use the guest entry; login and signup remain clearly disabled until production authentication exists.
3. In `/app?session=guest`, choose either the standalone eight-question diagnosis or product judgment.
4. In diagnosis mode, answer eight questions and review the recommended model plus a verified direct URL or labeled search fallback.
5. In product mode, provide a name, URL, image, or budget and review Core output separately from external evidence.
6. Return to mode selection or home from either flow. Use `/onboarding` only when a temporary preference hint is useful.
7. Review storage and deletion boundaries in `/settings`.

Guest state is limited to browser storage and never creates personal `memory.md` data. Login and signup are preparation-only UI, not production authentication. Supabase environment placeholders document the intended next integration without exposing a secret to the browser.

## Responsive delivery

The primary experience starts as a single-column mobile flow and progressively expands. At 1024px and above, the workspace presents three columns for inputs, the Core result, and memory or evidence context. The delivery baseline covers 390, 500, 768, 1024, and 1440 pixel viewport widths without horizontal overflow.

## Decision and evidence boundary

TypeScript Core owns candidate scoring and the final Decision. Ryo Mode curated references contribute only a bounded preference signal. Rakuten listings, Gemini image features, URL metadata or URL Context, and global feedback patterns remain external evidence. They may explain uncertainty or support a follow-up check, but do not enter the Core candidate set, alter `budgetFit`, or set the Decision.

## Live product URL delivery

After the eight-question recommendation is complete, the UI can request external product references for the selected model. The server verifies public HTTP or HTTPS, DNS and redirect safety, current HTTP status, and a bounded redirect count before returning any link. A direct product page is preferred when a verified Rakuten listing is available; otherwise verified search URLs are labeled as search fallbacks rather than product pages.

The UI shows the domain, source, verification status, and `verifiedAt`. It explicitly tells the user to confirm price, stock, and size on the destination site. Generated, verified, and manually entered URLs are transient screen state: raw URLs are not written to user memory or the global feedback corpus. Tracking, affiliate, token-like query parameters, and fragments are removed before display. These links cannot change the candidate, Core score, `budgetFit`, or Decision.

## Beta delivery status

This beta includes the landing and entry flow, guest session boundary, separate diagnosis and product modes, onboarding, responsive workspace, satisfaction feedback, anonymized global corpus, Ryo curated seed, external evidence panel, transient live product reference links, settings, tests, and documentation. It does not promise price comparison, inventory, size availability, or a direct product page for every model. Production authentication, durable hosted storage, account deletion, provider credentials, and operational monitoring remain deployment work rather than completed product capabilities.
