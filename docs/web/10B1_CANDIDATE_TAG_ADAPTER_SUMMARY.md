# WEB-10B1: Candidate Tag Adapter Summary

## 1. Purpose

WEB-10B1 implements the narrow adapter authorized by WEB-10A.1:

```txt
safeCandidateDraft.candidateTagIds
-> validation / normalization
-> Core SneakerTag[]
```

It does not assemble complete Core input or execute recommendation logic.

## 2. Target Commit

Implementation started from:

```txt
e82667e38aa527328349540b184677b1086712fd
```

Branch: `main`.

The working tree was clean before implementation.

## 3. Resolution Used

The implementation follows:

- `docs/web/10A_1_CANDIDATE_TAG_MAPPING_RESOLUTION.md`
- Gate A1: Eligible
- Gate A2: Eligible
- Candidate Tag Adapter: Mapping implementation possible

Core input assembly and recommendation integration remain Not ready.

## 4. Implemented Files

- `app/_lib/core-input/candidateTagAdapter.ts`
- `app/_lib/core-input/candidateTagAdapter.test.ts`
- `docs/web/10B1_CANDIDATE_TAG_ADAPTER_SUMMARY.md`

`app/_lib/core-input/types.ts` was not changed.

## 5. Implemented Function

```ts
mapCandidateTagsToCoreTags(
  candidateTagIds: readonly string[]
): CandidateTagAdapterResult
```

The function is pure and returns mapping status, normalized Candidate UI IDs,
Core tags, warnings, blocked reasons, and unsupported IDs.

## 6. Mapping Policy

The adapter contains an explicit 12-entry table based on the Confirmed mapping
in WEB-10A.1:

```txt
classic -> classic
low_tech -> low_tech
street -> street
minimal -> minimal
chunky -> chunky
running -> running
basketball -> basketball
comfortable -> comfortable
durable -> durable
retro -> retro
heritage -> heritage
premium -> premium
```

All mappings are 1:1. Core-only tags `canvas`, `collab`, `trail`, and `outdoor`
are not inserted or accepted as Candidate UI IDs.

The table uses `satisfies Record<string, SneakerTag>` so every mapped output is
checked against the Core `SneakerTag` type.

## 7. Validation And Normalization Policy

- Each input string is trimmed.
- Empty strings and strings that do not match lowercase snake_case tag-ID
  syntax are invalid and block mapping.
- Well-formed IDs outside the 12 supported Candidate UI IDs are unknown,
  recorded in `unsupportedCandidateTagIds`, and block mapping.
- Unsupported values are not silently removed.
- Duplicate IDs are removed after trimming, keeping the first occurrence.
- Every removed duplicate produces a warning.
- Empty input or empty normalized output blocks mapping.
- Output preserves first-occurrence input order.
- If any value blocks mapping, `coreTags` is empty. The adapter does not return
  provisional or partially mapped Core tags.

## 8. Invalid Candidate Tag ID Definition

WEB-10B1 treats the following string values as invalid:

- empty string
- whitespace-only string
- string that is empty after trimming
- string that is clearly not a lowercase snake_case tag ID, such as a value
  containing spaces, uppercase letters, or punctuation

A syntactically valid but unsupported string is classified as unknown rather
than invalid.

## 9. WEB-08 Responsibility Separation

WEB-08 remains responsible for filtering raw Candidate UI input against the
supported ID list and recording unsupported raw values as warnings and
unsupported fields.

WEB-10B1 accepts the resulting `safeCandidateDraft.candidateTagIds` boundary and
performs defensive validation, normalization, and Confirmed Core tag mapping.
An unsupported value reaching WEB-10B1 is treated as a boundary violation and
blocks mapping.

## 10. Gate A1 And Gate A2

- Gate A1 behavior is implemented through format validation, supported-ID
  validation, duplicate removal, non-empty enforcement, and deterministic
  first-occurrence order.
- Gate A2 behavior is implemented through the explicit 12-entry mapping,
  type-checked Core outputs, defensive output de-duplication, and blocked
  handling when a mapping is unavailable.

## 11. D-001 Display Wording

D-001 concerns display-label differences for `low_tech`, `street`, `minimal`,
`retro`, and `heritage`.

The adapter uses stable tag IDs only. It does not import labels or UI option
data, so the pending display wording has no effect on mapping.

## 12. Dependency Boundaries

`candidateTagAdapter.ts`:

- imports `SneakerTag` with a type-only import
- does not import `app/_data/**`
- does not import `app/_components/**`
- does not depend on React, storage, network access, or external state

The adapter does not create a complete Core input and does not call
`recommendSneakers`.

## 13. Explicit Non-Scope

WEB-10B1 does not implement:

- Core input assembly
- `RecommendSneakersInput` construction
- recommendation execution
- preference profile generation
- candidate identity generation
- candidate vector generation
- budget-fit generation
- UI changes
- API, backend, DB, storage, or external data access
- package or configuration changes

## 14. Non-String Runtime Defensive Validation

Non-string runtime defensive validation is out of scope for WEB-10B1.

Reason: the adapter input type is `readonly string[]`, and non-string tests
would require breaking the type boundary. No `as any` escape is used.

Future consideration: validate unknown external payloads at an API or server
boundary if such a boundary is introduced.

## 15. Test Coverage

The focused test file covers:

- all 12 Confirmed 1:1 mappings
- D-001 label independence
- unknown IDs
- invalid string IDs
- duplicate removal and warnings
- empty selection
- deterministic first-occurrence order
- explicit reporting of unsupported values
- empty `coreTags` for blocked results

## 16. Verification Results

Focused adapter test:

```txt
pnpm exec vitest run app/_lib/core-input/candidateTagAdapter.test.ts
passed
Test Files 1 passed
Tests 13 passed
```

Repository test suite:

```txt
pnpm test
passed
Test Files 14 passed
Tests 90 passed
```

Web production build:

```txt
pnpm web:build
passed
Next.js 16.2.7
Routes: / and /_not-found
```

Typecheck:

```txt
pnpm typecheck
passed
```

Forbidden-pattern checks:

```txt
candidateTagAdapter.ts: no matches
candidateTagAdapter.test.ts: no matches
```

Import check:

```txt
SneakerTag is imported with import type only
No normal SneakerTag import exists
```

Diff check:

```txt
Only the three WEB-10B1 files are present
git diff --check passed
```

## 17. Next Step Candidate

WEB-10B1 removes only the Candidate tag mapping gap.

Before Core input assembly can begin, separate decisions and adapters are still
needed for:

- `preferenceProfile`
- `sneakerId`
- complete candidate vector including `priceLevel`
- `budgetFit`

The next step should resolve one of those independent blockers. It should not
start Core input assembly or recommendation execution while required fields
remain unresolved.
