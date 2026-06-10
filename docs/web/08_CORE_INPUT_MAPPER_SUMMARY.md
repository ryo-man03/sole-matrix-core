# WEB-08: Candidate Input Safe Mapper Summary

## 1. Purpose

WEB-08 adds a small pure mapper layer for Candidate Sneaker Check UI input.

The mapper converts only the currently safe Candidate UI values into a draft shape that can be reviewed before any later Core integration. It does not create complete Core input, does not call `recommendSneakers`, and does not render recommendation results.

## 2. Implemented Files

- `app/_lib/core-input/types.ts`
- `app/_lib/core-input/candidateInputMapper.ts`
- `app/_lib/core-input/candidateInputMapper.test.ts`
- `docs/web/08_CORE_INPUT_MAPPER_SUMMARY.md`

## 3. Input Shape

`CandidateUiInput` is the UI-origin input shape accepted by the mapper:

```ts
export type CandidateUiInput = {
  sneakerName: string;
  brand?: string;
  seenPriceText?: string;
  budgetText?: string;
  memo?: string;
  selectedTagIds: string[];
};
```

This is not Core input. `seenPriceText` and `budgetText` remain UI-only strings.

## 4. Mapper Options

The mapper accepts:

```ts
export type CandidateInputMapperOptions = {
  supportedCandidateTagIds?: readonly string[];
};
```

Only tag ids included in `supportedCandidateTagIds` are treated as supported candidate tags. If `supportedCandidateTagIds` is omitted, every `selectedTagIds` entry is treated as unsupported.

The mapper does not import `app/_data/candidateSneakerOptions.ts`. A future UI integration may pass the supported tag id list from UI data, but WEB-08 does not connect that layer.

## 5. Return Shape

The mapper returns:

```ts
export type CandidateInputMappingResult = {
  isValid: boolean;
  safeCandidateDraft: {
    name: string;
    candidateTagIds: string[];
  } | null;
  warnings: string[];
  unsupportedFields: string[];
  missingFields: string[];
};
```

`safeCandidateDraft` is not complete Core input. It is not passed to Core as-is. `candidateTagIds` are Candidate UI-origin tag ids, not independently confirmed Core tag values.

## 6. Values Converted

- `sneakerName` is trimmed.
- The trimmed `sneakerName` becomes `safeCandidateDraft.name`.
- Supported `selectedTagIds` become `safeCandidateDraft.candidateTagIds`.

## 7. Values Not Converted

- `brand` is not used for Core judgment.
- `seenPriceText` is not parsed or converted.
- `budgetText` is not parsed or converted.
- `memo` is not used for Core judgment.
- `priceLevel` is not created.
- `budgetFit` is not created.
- `candidateVector` is not created.
- `score`, `finalScore`, `decision`, `finalDecision`, `demotion`, and `overlapPenalty` are not created or displayed.

## 8. sneakerName Handling

`sneakerName` is trimmed before mapping.

If the trimmed value is empty:

- `isValid` is `false`
- `safeCandidateDraft` is `null`
- `missingFields` includes `sneakerName`

## 9. selectedTagIds Handling

`selectedTagIds` are treated as Candidate UI-origin tag ids.

Supported tags are copied into `safeCandidateDraft.candidateTagIds` in input order. Unsupported tags are not copied into the safe draft. They are recorded in:

- `warnings`, for example `unsupported candidate tag: unknown_tag`
- `unsupportedFields`, for example `selectedTagIds:unknown_tag`

Unsupported tag examples use ids such as `unknown_tag` and `invalid_tag`, not valid Candidate UI ids such as `heritage`.

Candidate tags are not treated as Preference Diagnosis tags, preferred user tags, price signals, resale signals, or authenticity signals.

## 10. Unsupported UI Fields

When non-empty, these fields are accepted as UI input but recorded in `unsupportedFields` instead of being converted:

- `brand`
- `seenPriceText`
- `budgetText`
- `memo`

This keeps the user's text visible to the caller while avoiding unsafe Core interpretation.

## 11. Dependency Boundaries

`app/_lib/core-input/candidateInputMapper.ts` imports only local types from `app/_lib/core-input/types.ts`.

It does not import:

- `recommendSneakers`
- `src/**`
- `app/_data/**`
- UI components
- React
- DOM APIs

WEB-08 read `src/**` and `app/_data/**` for design context, but `app/_lib/core-input/**` does not depend on those modules.

## 12. Tests

`app/_lib/core-input/candidateInputMapper.test.ts` covers:

- `sneakerName` trimming
- empty `sneakerName` invalid handling
- `missingFields` behavior
- supported tag preservation
- unsupported tag warnings
- unsupported tag field recording
- omitted `supportedCandidateTagIds` behavior
- no numeric conversion of price or budget text
- no Core judgment fields in `safeCandidateDraft`
- no `recommendSneakers`, `src/**`, or `app/_data/**` dependency in the mapper source

The test does not mock or call `recommendSneakers`.

## 13. Explicit Non-Scope

WEB-08 does not implement:

- Preference Diagnosis numeric conversion
- `PreferenceProfile` generation
- complete `RecommendSneakersInput` generation
- `recommendSneakers` import or execution
- Result List UI
- Result Detail UI
- Gemini or OpenAI API usage
- external price API usage
- scraping
- inventory lookup
- authenticity judgment
- resale prediction
- purchase links
- DB behavior
- login
- localStorage or sessionStorage persistence
- existing Core logic changes
- existing fixture changes

## 14. Verification Results

Initial status:

```txt
git status --short --untracked-files=all
<no output>
```

Mapper unit test:

```txt
pnpm exec vitest run --config <temp config for app/_lib/core-input>
passed
Test Files 1 passed
Tests 7 passed
```

The temporary config was used because the repository's existing `vitest.config.ts` includes only `src/**/*.test.ts`. The repository config was not changed in WEB-08.

Repository test suite:

```txt
pnpm test
passed
Test Files 11 passed
Tests 63 passed
```

Typecheck:

```txt
pnpm typecheck
passed
```

Web build:

```txt
pnpm web:build
passed
Route (app)
- /
- /_not-found
```

Forbidden term check for non-test mapper files:

```txt
Get-ChildItem app/_lib/core-input -Recurse -Include *.ts |
  Where-Object { $_.Name -notlike "*.test.ts" } |
  Select-String -Pattern "recommendSneakers|finalScore|finalDecision|demotion|overlapPenalty|priceLevel|budgetFit|candidateVector"

<no output>
```

Test-file `recommendSneakers` contamination check:

```txt
Get-ChildItem app/_lib/core-input -Recurse -Include *.test.ts |
  Select-String -Pattern "import .*recommendSneakers|recommendSneakers\("

<no output>
```

`src/**` and `app/_data/**` import contamination check:

```txt
Get-ChildItem app/_lib/core-input -Recurse -Include *.ts |
  Select-String -Pattern "src/core|src/domain|src/data|@/src|~/src|\.\./\.\./src|\.\./\.\./\.\./src|app/_data|_data/candidateSneakerOptions|\.\./\.\./_data|\.\./_data"

<no output>
```

Diff visibility after `git add -N`:

```txt
git diff --stat
app/_lib/core-input/candidateInputMapper.test.ts | 150 +++++++++++++++++++
app/_lib/core-input/candidateInputMapper.ts      |  73 +++++++++
app/_lib/core-input/types.ts                     |  23 +++
docs/web/08_CORE_INPUT_MAPPER_SUMMARY.md         | 180 +++++++++++++++++++++++
4 files changed, 426 insertions(+)

git diff --name-status
A app/_lib/core-input/candidateInputMapper.test.ts
A app/_lib/core-input/candidateInputMapper.ts
A app/_lib/core-input/types.ts
A docs/web/08_CORE_INPUT_MAPPER_SUMMARY.md
```

## 15. Next Step

Next WEB number:

```txt
WEB-09: Core Recommendation Dry Run / Integration Guard
```

WEB-09 should use WEB-08 mapper output only to identify remaining missing Core values needed for a safe dry run. WEB-09 should still avoid Result List and Result Detail UI unless a later task explicitly approves them.
