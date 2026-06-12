# WEB-09: Core Recommendation Dry Run / Integration Guard Summary

## 1. Purpose

WEB-09 adds a pure guard that checks whether the WEB-08 Candidate Input Safe Mapper output is enough to safely dry-run Core recommendation logic.

The guard intentionally returns blocked for mapper output alone. It records missing Core fields and blocked reasons instead of generating fallback values, importing `recommendSneakers`, or calling Core.

## 2. Implemented Files

- `app/_lib/core-input/coreRecommendationDryRun.ts`
- `app/_lib/core-input/coreRecommendationDryRun.test.ts`
- `docs/web/09_CORE_RECOMMENDATION_DRY_RUN_SUMMARY.md`

`app/_lib/core-input/types.ts` was not changed.

## 3. Core Files Read

- `src/core/index.ts`
- `src/core/types.ts`
- `src/core/recommendSneakers.ts`
- `src/domain/profile/preferenceTypes.ts`
- `src/domain/sneaker/sneakerVector.ts`
- `src/domain/sneaker/sneakerTag.ts`
- `src/domain/recommendation/axes.ts`
- `src/domain/recommendation/axisWeights.ts`
- `src/domain/recommendation/balancedScore.ts`
- `src/domain/recommendation/decision.ts`
- `src/domain/recommendation/demotion.ts`
- `src/domain/recommendation/overlapPenalty.ts`
- `src/domain/recommendation/priceScore.ts`
- `src/domain/recommendation/scoreBreakdown.ts`
- `src/domain/recommendation/scoreUtils.ts`
- `src/domain/recommendation/tagBonus.ts`
- `src/data/index.ts`
- `src/data/sampleProfiles.ts`
- `src/data/sampleSneakers.ts`
- `src/data/sampleOwnedSneakers.ts`

Sample data was read only as reference and was not used as permission to create adapter values.

## 4. Core Public API Input Shape

`recommendSneakers(input: RecommendSneakersInput)` expects:

```ts
type RecommendSneakersInput = {
  preferenceProfile: PreferenceProfile;
  candidates: SneakerCandidate[];
  ownedSneakers?: OwnedSneaker[];
  preferredTags?: SneakerTag[];
};
```

`SneakerCandidate` requires:

```ts
type SneakerCandidate = {
  sneakerId: string;
  name: string;
  vector: SneakerVector;
  tags: SneakerTag[];
  budgetFit: number;
};
```

`SneakerVector` requires:

```ts
type SneakerVector = {
  culture: number;
  styleFit: number;
  simplicity: number;
  street: number;
  volume: number;
  comfort: number;
  durability: number;
  priceLevel: number;
};
```

## 5. Core Required Fields

Core execution needs:

- `preferenceProfile`
- `candidates`
- `candidates[].sneakerId`
- `candidates[].name`
- `candidates[].vector`
- `candidates[].tags`
- `candidates[].budgetFit`

`priceLevel` is required inside `SneakerVector`, so WEB-09 records the missing parent field `candidates[].vector` rather than double-counting `candidates[].vector.priceLevel` in `missingCoreFields`.

`ownedSneakers` and `preferredTags` are optional in `RecommendSneakersInput`.

## 6. Values Present In WEB-08 Mapper Output

WEB-08 mapper output safely provides:

- `safeCandidateDraft.name`
- `safeCandidateDraft.candidateTagIds`
- `warnings`
- `unsupportedFields`
- `missingFields`
- `isValid`

`safeCandidateDraft.name` can correspond to candidate display/name text, but it is not enough to build a complete `SneakerCandidate`.

## 7. Values Missing From WEB-08 Mapper Output

WEB-08 mapper output does not provide:

- `preferenceProfile`
- `candidates[].sneakerId`
- `candidates[].vector`
- `candidates[].tags`
- `candidates[].budgetFit`

The missing `vector` includes required numeric axes such as `culture`, `styleFit`, `comfort`, `durability`, and `priceLevel`.

`candidateTagIds` remain UI-origin tag IDs. They are not treated as confirmed Core `SneakerTag[]` in WEB-09.

## 8. Safe Draft Boundary

`safeCandidateDraft` is not a complete Core input. It is a safe UI-origin draft that can be inspected by later adapter work.

`candidateTagIds` are Candidate UI-derived tag IDs. WEB-09 does not convert them to Core tags, preferred tags, price signals, resale signals, or authenticity signals.

## 9. Guard Design

The guard exports:

```ts
export type CoreRecommendationDryRunStatus = "blocked" | "ready";

export type CoreRecommendationDryRunCheck = {
  status: CoreRecommendationDryRunStatus;
  canDryRun: boolean;
  missingCoreFields: string[];
  blockedReasons: string[];
  warnings: string[];
};
```

The function is:

```ts
checkCoreRecommendationDryRunReadiness(mappingResult)
```

It accepts `CandidateInputMappingResult` and returns a plain object. It has no React, DOM, API, storage, app data, or Core runtime dependency.

This function is dedicated to assessing gaps from WEB-08 Candidate mapper output. It is not the final generic readiness checker for all future Core inputs, and WEB-10 should add a separate explicit adapter design instead of expanding this guard into a catch-all builder.

## 10. missingCoreFields Design

For mapper output alone, `missingCoreFields` is:

```txt
preferenceProfile
candidates[].sneakerId
candidates[].vector
candidates[].tags
candidates[].budgetFit
```

These are names only. WEB-09 uses parent-level `candidates[].vector` to avoid double-counting nested missing fields such as `priceLevel`. It records missing fields but does not generate real values, default values, dummy values, zeros, or empty arrays for them.

## 11. blockedReasons Design

For a valid `safeCandidateDraft`, `blockedReasons` is:

```txt
safeCandidateDraft is not a complete Core input
preferenceProfile has not been created
sneakerId has not been created for the candidate
candidateVector has not been created
priceLevel has not been created
candidateTagIds are UI-derived tag IDs and have not been mapped to Core tags
budgetFit has not been created
```

Invalid mapper output additionally records:

```txt
candidate input mapping is invalid
```

`safeCandidateDraft: null` additionally records:

```txt
safeCandidateDraft is missing
```

Reasons are de-duplicated.

## 12. Warnings

The guard carries `mappingResult.warnings` forward unchanged by value:

- Unsupported candidate tags remain warnings.
- Warnings are not converted into Core fields.
- Warnings are not dropped.

## 13. canDryRun

`canDryRun` is `false` for mapper output alone because at least one required Core input field is missing.

This is true even when `mappingResult.isValid` is `true` and `safeCandidateDraft` exists.

## 14. Explicit Non-Scope

WEB-09 does not:

- import `recommendSneakers`
- call `recommendSneakers`
- execute Core
- create a complete Core input
- create `preferenceProfile`
- create `candidateVector`
- create `priceLevel`
- create `budgetFit`
- convert `candidateTagIds` into Core tags
- create Result List UI
- create Result Detail UI
- connect UI to Core
- change Core files
- add API, DB, storage, external service, market price, inventory, authenticity, scraper, or purchase-link behavior

## 15. Tests

`app/_lib/core-input/coreRecommendationDryRun.test.ts` covers:

- invalid mapping result is blocked
- `safeCandidateDraft: null` is blocked
- valid `safeCandidateDraft` remains blocked because Core input is incomplete
- `canDryRun` is `false`
- `status` is `blocked`
- `missingCoreFields` includes Core-required missing fields
- `blockedReasons` explains why execution is blocked
- mapper warnings are carried forward unchanged
- missing field names are recorded without generating values
- UI recommendation result values are not generated
- guard source does not import or call `recommendSneakers`
- guard source does not include UI, external, storage, or dummy-value assignments

## 16. Verification Results

Initial status:

```txt
git status --short --untracked-files=all
<no output>
```

WEB-09 unit test:

```txt
pnpm exec vitest run app/_lib/core-input/coreRecommendationDryRun.test.ts
passed
Test Files 1 passed
Tests 7 passed
```

Repository test suite:

```txt
pnpm test
passed
Test Files 13 passed
Tests 77 passed
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

`recommendSneakers` contamination check:

```txt
Get-ChildItem app/_lib/core-input -Recurse -Include coreRecommendationDryRun*.ts |
  Select-String -Pattern "import .*recommendSneakers|recommendSneakers\("

<no output>
```

Dummy Core value generation check:

```txt
Get-ChildItem app/_lib/core-input -Recurse -Include coreRecommendationDryRun*.ts |
  Select-String -Pattern "candidateVector\s*:|priceLevel\s*:|budgetFit\s*:|preferenceProfile\s*:"

<no output>
```

UI and external feature contamination check:

```txt
Get-ChildItem app/_lib/core-input -Recurse -Include coreRecommendationDryRun.ts |
  Select-String -Pattern "ResultList|ResultDetail|BuyScore|PersonalFit|Gemini|OpenAI|fetch\(|localStorage|sessionStorage|React|useState|useEffect"

<no output>
```

Core diff check:

```txt
git diff --name-only -- src
<no output>
```

Status before diff visibility helper:

```txt
git status --short --untracked-files=all
?? app/_lib/core-input/coreRecommendationDryRun.test.ts
?? app/_lib/core-input/coreRecommendationDryRun.ts
?? docs/web/09_CORE_RECOMMENDATION_DRY_RUN_SUMMARY.md
```

Diff visibility after `git add -N`:

```txt
git status --short --untracked-files=all
 A app/_lib/core-input/coreRecommendationDryRun.test.ts
 A app/_lib/core-input/coreRecommendationDryRun.ts
 A docs/web/09_CORE_RECOMMENDATION_DRY_RUN_SUMMARY.md

git diff --stat
app/_lib/core-input/coreRecommendationDryRun.test.ts    | 130 +++++++
app/_lib/core-input/coreRecommendationDryRun.ts         |  58 +++
docs/web/09_CORE_RECOMMENDATION_DRY_RUN_SUMMARY.md     | 387 +++++++++++++++++++++
3 files changed, 575 insertions(+)

git diff --name-status
A app/_lib/core-input/coreRecommendationDryRun.test.ts
A app/_lib/core-input/coreRecommendationDryRun.ts
A docs/web/09_CORE_RECOMMENDATION_DRY_RUN_SUMMARY.md
```

## 17. Files Not Changed

Confirmed by implementation scope:

- `src/core/**`
- `src/domain/**`
- `src/data/**`
- `package.json`
- `pnpm-lock.yaml`
- `README.md`
- `.github/**`
- `app/page.tsx`
- `app/globals.css`
- `app/_components/**`
- `app/_data/**`
- `app/_lib/core-input/types.ts`
- `app/_lib/core-input/candidateInputMapper.ts`
- `app/_lib/core-input/candidateInputMapper.test.ts`
- `docs/web/07_CORE_INPUT_MAPPING_PLAN.md`
- `docs/web/08_CORE_INPUT_MAPPER_SUMMARY.md`
- `docs/web/08_5_TEST_COVERAGE_SUMMARY.md`
- `docs/agent-prompts/**`

## 18. Next Step

Next WEB number:

```txt
WEB-10: Core Input Completion Plan / Explicit Adapter Design
```

WEB-10 should design how to safely fill the missing values through explicit inputs and adapter rules. It should still avoid Result List and Result Detail UI.
