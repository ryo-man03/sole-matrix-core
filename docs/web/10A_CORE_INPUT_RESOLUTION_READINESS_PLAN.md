# WEB-10A: Core Input Resolution Readiness Plan

## 1. Purpose

WEB-10A investigates the remaining Core input gaps identified by WEB-09 and
turns them into a readiness plan for later adapter work.

This document is design material only. It does not implement TypeScript, does
not create adapters, does not assemble Core input, does not call
`recommendSneakers`, and does not change UI, API, backend, DB, external service,
or package configuration.

The main questions are:

- Which Core input fields are required by the public API and runtime?
- Which fields can be safely sourced from the current UI?
- Which fields still need project decisions, adapter rules, validation, or data
  sourcing?
- Which small adapter steps are eligible before Core input assembly?
- What must be true before moving to Core input assembly and
  `recommendSneakers` integration?

## 2. Evidence Snapshot

| Item | Value |
| ---- | ----- |
| Expected baseline revision | `58326e0` |
| Actual repository revision | `58326e0db14780ed7d647e886247b5908158d6ed` |
| Repository branch | `main` |
| Investigation timestamp | `2026-06-13T00:05:27+09:00` |
| Working tree status at investigation start | clean; `git status --short --untracked-files=all` returned no output |
| Baseline revision difference | None; actual HEAD starts with expected baseline `58326e0` |
| Baseline difference verification | `git log --oneline -5` shows `58326e0 feat: add core recommendation dry run guard` as HEAD |
| Core public entry point | `src/core/index.ts` exports `recommendSneakers` and Core public types |
| Documents reviewed | `docs/web/07_CORE_INPUT_MAPPING_PLAN.md`, `docs/web/08_CORE_INPUT_MAPPER_SUMMARY.md`, `docs/web/08_5_TEST_COVERAGE_SUMMARY.md`, `docs/web/09_CORE_RECOMMENDATION_DRY_RUN_SUMMARY.md`, selected final Core spec documents |
| Core implementation files reviewed | `src/core/index.ts`, `src/core/types.ts`, `src/core/recommendSneakers.ts`, `src/domain/profile/preferenceTypes.ts`, `src/domain/sneaker/sneakerVector.ts`, `src/domain/sneaker/sneakerTag.ts`, `src/domain/recommendation/**`, `src/data/**` |
| UI implementation files reviewed | `app/_components/PreferenceDiagnosisFlow.tsx`, `app/_data/preferenceDiagnosisQuestions.ts`, `app/_components/CandidateSneakerCheckFlow.tsx`, `app/_data/candidateSneakerOptions.ts`, `app/_lib/core-input/**` |
| Figma direct access status | Not accessed |
| Provided screenshot access status | Not available |

## 3. Baseline Revision Check

Expected baseline commit was `58326e0`.

Actual HEAD was `58326e0db14780ed7d647e886247b5908158d6ed`, so the repository
was investigated at the expected WEB-09 baseline. No automatic choice between
old and new repository state was required.

Recent history:

```txt
58326e0 feat: add core recommendation dry run guard
a3e9481 test: include app lib tests in vitest
353688c feat: add safe candidate input mapper
126fdf7 fix: avoid candidate tag aria pressed warning
58cd29e docs: add core input mapping plan
```

## 4. Evidence Hierarchy

Evidence is weighted in this order:

1. Core public API / exported type
2. Runtime implementation
3. Validation rule / guard
4. Constant / domain definition
5. Formal project document
6. Test
7. Fixture
8. Sample data
9. UI implementation
10. Comment / naming inference

Sample, fixture, and test data may show observed examples, but they are not used
as the only basis for declared value ranges or adapter authorization.

## 5. External Information Use

No external web information was used to confirm SOLE//MATRIX Core fields.

External information may be useful later only for general security or API trust
boundary thinking. It must not be used to define Core field value domains,
vector formulas, sneaker taxonomies, runtime behavior, or SOLE//MATRIX-specific
requirements.

## 6. Evidence Conflict Policy

When evidence conflicts, this document does not silently resolve the conflict.
The affected item is marked `Unresolved`, includes both evidence IDs, records
`Evidence conflict: Yes`, and receives a `Decision owner`,
`Resolution mechanism`, and next action.

No evidence conflict was found where the current implementation contradicts the
public Core type for WEB-10A's required fields. Several fields are still
unresolved because the current UI and mapper do not provide safe source data.

`Evidence conflict: No` does not mean a field is Confirmed. For unresolved
source or value-domain questions, the intended reading is:

- Evidence conflict: No
- Confidence: Unresolved
- Reason: formal evidence is insufficient

## 7. Evidence Register

| Evidence ID | Claim / field | Evidence type | File path | Symbol / section | Evidence summary | Conflict | Confidence |
| ----------- | ------------- | ------------- | --------- | ---------------- | ---------------- | -------- | ---------- |
| E-001 | Core public entry point | Core public API | `src/core/index.ts` | exports | `recommendSneakers` and public Core types are exported. | No | Confirmed |
| E-002 | `RecommendSneakersInput` requiredness | exported type | `src/core/types.ts` | `RecommendSneakersInput` | `preferenceProfile` and `candidates` are required; `ownedSneakers` and `preferredTags` are optional. | No | Confirmed |
| E-003 | Optional defaults | runtime implementation | `src/core/recommendSneakers.ts` | `recommendSneakers` | `ownedSneakers` and `preferredTags` default to empty arrays. | No | Confirmed |
| E-004 | `PreferenceProfile` shape | exported type | `src/domain/profile/preferenceTypes.ts` | `PreferenceProfile` | Profile requires `userId`, `vector`, `policy`, `axisImportance`, `sourceConfidence`, `profileVersion`, `updatedAt`. | No | Confirmed |
| E-005 | `SneakerCandidate` and `SneakerVector` shape | exported type | `src/domain/sneaker/sneakerVector.ts` | `SneakerCandidate`, `SneakerVector` | Candidate requires `sneakerId`, `name`, `vector`, `tags`, `budgetFit`; vector has 8 numeric dimensions including `priceLevel`. | No | Confirmed |
| E-006 | Core tag domain | domain definition | `src/domain/sneaker/sneakerTag.ts` | `SneakerTag` | Core tag union contains 16 tag strings. | No | Confirmed |
| E-007 | Runtime candidate/profile usage | runtime implementation | `src/domain/recommendation/balancedScore.ts` | `calculateBalancedScore` | Runtime reads profile vector, policy, axis importance, candidate vector, tags, budgetFit, owned sneakers, and preferred tags. | No | Confirmed |
| E-008 | Taste and quality score behavior | runtime implementation | `src/domain/recommendation/axes.ts` | `calculateTasteAxisScore`, `calculateQualityAxisScore` | Output scores are clamped, but input value validation is not performed here. | No | Confirmed |
| E-009 | Price score dependencies | runtime implementation | `src/domain/recommendation/priceScore.ts` | `calculatePriceScore` | Uses `priceSensitivity`, `priceLevel`, and `budgetFit`. | No | Confirmed |
| E-010 | Tag bonus dependencies | runtime implementation | `src/domain/recommendation/tagBonus.ts` | `calculateTagBonus` | Uses overlap between candidate tags and preferred tags. | No | Confirmed |
| E-011 | Overlap penalty dependencies | runtime implementation | `src/domain/recommendation/overlapPenalty.ts` | `calculateOverlapPenalty` | Uses candidate tags, owned sneaker role tags, wear frequency, and overlap sensitivity. | No | Confirmed |
| E-012 | Axis weight dependencies | runtime implementation | `src/domain/recommendation/axisWeights.ts` | `calculateAxisWeights` | Uses all profile `axisImportance` numeric axes. | No | Confirmed |
| E-013 | WEB-07 mapping boundary | formal project document | `docs/web/07_CORE_INPUT_MAPPING_PLAN.md` | Sections 7-18 | Only candidate name and candidate tag direction were safe; profile, vector, id, and budget conversion remained unresolved. | No | Confirmed |
| E-014 | WEB-08 mapper return shape | exported app type | `app/_lib/core-input/types.ts` | `CandidateInputMappingResult` | Mapper result contains `safeCandidateDraft.name` and `candidateTagIds`, not complete Core input. | No | Confirmed |
| E-015 | WEB-08 mapper behavior | runtime implementation | `app/_lib/core-input/candidateInputMapper.ts` | `mapCandidateUiInputToSafeDraft` | Trims `sneakerName`, filters supported tag IDs, records unsupported UI fields. | No | Confirmed |
| E-016 | WEB-09 dry-run guard | runtime guard | `app/_lib/core-input/coreRecommendationDryRun.ts` | `requiredMissingCoreFields` | Guard blocks mapper output because `preferenceProfile`, `sneakerId`, `vector`, `tags`, and `budgetFit` are missing. | No | Confirmed |
| E-017 | WEB-09 guard tests | test | `app/_lib/core-input/coreRecommendationDryRun.test.ts` | blocked valid draft test | Tests assert valid mapper output still cannot dry-run Core. | No | Confirmed |
| E-018 | Candidate UI tag ids | UI implementation / constant | `app/_data/candidateSneakerOptions.ts` | `CandidateTagId` | UI currently exposes 12 candidate tag IDs. | No | Confirmed |
| E-019 | Candidate UI state | UI implementation | `app/_components/CandidateSneakerCheckFlow.tsx` | local state | Candidate flow stores name, brand, seen price text, budget text, memo, selected tags, and UI flags. | No | Confirmed |
| E-020 | Preference UI state | UI implementation | `app/_components/PreferenceDiagnosisFlow.tsx` | local state | Preference flow stores answer IDs by question and UI progress; it does not create a profile. | No | Confirmed |
| E-021 | Observed sample profile values | sample data | `src/data/sampleProfiles.ts` | `sampleProfiles` | Samples show numeric profile values and `preferredTags`, but not UI-to-profile rules. | No | Observed only |
| E-022 | Observed sample sneaker values | sample data | `src/data/sampleSneakers.ts` | `sampleSneakers` | Samples show numeric sneaker vectors and budgetFit, but not UI-to-vector rules. | No | Observed only |
| E-023 | Formal Core type spec | formal project document | `docs/final-spec/SOLE_MATRIX_Final_Specification_Set_Core_v0_1/04_FINAL_TYPES.md` | final types | Formal types align with current Core type shapes. | No | Confirmed |
| E-024 | Formal scoring spec | formal project document | `docs/final-spec/SOLE_MATRIX_Final_Specification_Set_Core_v0_1/05_AXIS_AND_SCORE_RULES.md` | axis and score rules | Formal scoring dependencies align with runtime formula files. | No | Confirmed |
| E-025 | Public recommendation behavior | test | `src/core/__tests__/recommendSneakers.test.ts` | `recommendSneakers` suite | Tests show sorting, result fields, and delegation to `calculateBalancedScore`. | No | Confirmed for behavior, not adapter source |

## 8. Core Public Input Surface

Core public input is:

```ts
type RecommendSneakersInput = {
  preferenceProfile: PreferenceProfile;
  candidates: SneakerCandidate[];
  ownedSneakers?: OwnedSneaker[];
  preferredTags?: SneakerTag[];
};
```

`recommendSneakers` returns sorted `RecommendationResult[]` values. It maps each
candidate through `calculateBalancedScore`, preserves `sneakerId`, `name`, and
`inputIndex`, and sorts by `scoreBreakdown.finalScore` descending with input
order as the tie breaker. Evidence: E-001, E-002, E-003, E-007, E-025.

## 9. Type-Level, Runtime, And Semantic Requirements

Type-level requiredness is not the same as runtime safety.

- Type-level requiredness comes from public exported types.
- Runtime requirement comes from actual reads, defaults, and guards.
- Semantic / quality requirement describes whether a value can be trusted enough
  to produce meaningful recommendations.

For example, `ownedSneakers` is optional and has a runtime default. By contrast,
`candidates[].vector` is type-level required and runtime-read in scoring. It
cannot be skipped merely because numeric output is clamped later.

## 10. Core Field Summary

| Core field | Type-level requiredness | Runtime requirement | Current source | Future source candidate | Confidence | Evidence IDs | Evidence conflict | Blocking severity | Gate B requirement | Missing-input handling |
| ---------- | ----------------------- | ------------------- | -------------- | ----------------------- | ---------- | ------------ | ----------------- | ----------------- | ------------------ | ---------------------- |
| `preferenceProfile` | Required | Required; profile fields are read by scoring | Not available | Preference Diagnosis profile adapter | Unresolved source | E-002, E-004, E-007, E-020 | No | Blocking | Required | blocked |
| `candidates` | Required | Required; iterated by `recommendSneakers` | Partial candidate draft only | Candidate Core input assembler after adapter outputs exist | Unresolved complete source | E-002, E-003, E-014, E-016 | No | Blocking | Required | blocked |
| `candidates[].sneakerId` | Required | Required; copied to result and overlap references use IDs elsewhere | Not available | Candidate identity adapter | Unresolved source | E-005, E-016, E-025 | No | Blocking | Required | blocked |
| `candidates[].name` | Required | Required; copied to result | `safeCandidateDraft.name` from trimmed UI name | Existing mapper output | Confirmed | E-005, E-014, E-015, E-019 | No | Non-blocking | Required | blocked until assembled with other candidate fields |
| `candidates[].vector` | Required | Required; all dimensions are read by scoring | Not available | Candidate vector adapter or explicit data source | Unresolved source | E-005, E-007, E-008, E-009, E-016 | No | Blocking | Required | blocked |
| `candidates[].tags` | Required | Required for tag bonus and overlap penalty | UI tag IDs available, Core tag conversion not yet implemented | Candidate tag adapter | Proposed | E-005, E-006, E-010, E-011, E-014, E-018 | No | Blocking until adapter exists | Required | blocked |
| `candidates[].budgetFit` | Required | Required by price score | Not available | Budget fit adapter after numeric policy decision | Unresolved source | E-005, E-009, E-016, E-019 | No | Blocking | Required | blocked |
| `ownedSneakers` | Optional | Defaults to `[]` | Not available | Closet adapter or safe omission | Confirmed optional | E-002, E-003, E-011 | No | Non-blocking | Not required | safe omission |
| `preferredTags` | Optional | Defaults to `[]` | Not available | Preference Diagnosis tag adapter or safe omission | Confirmed optional, unresolved source | E-002, E-003, E-010, E-020 | No | Non-blocking | Not required | safe omission |

## 11. Field Details

### `preferenceProfile`

- Type-level requiredness: Required.
- Runtime requirement: Required. `calculateBalancedScore` reads
  `profile.vector`, `profile.policy`, and `profile.axisImportance`.
- Semantic / quality requirement: High. A dummy or default profile would
  dominate recommendation results and falsely imply personalization.
- Omission / default behavior: None.
- Current source: None. Preference Diagnosis stores answer IDs and UI progress,
  not Core numeric profile fields.
- Future source candidate: Preference Diagnosis profile adapter.
- Responsible layer: Adapter / Core input preparation.
- Validation: Must validate the full `PreferenceProfile` shape, numeric value
  domains, `profileVersion`, and `updatedAt` policy before Core assembly.
- Transformation: Unresolved answer-to-profile rules.
- Evidence IDs: E-002, E-004, E-007, E-020.
- Confidence: Requirement Confirmed; source Unresolved.
- Evidence conflict: No.
- Blocking severity: Blocking.
- Gate B requirement: Required.
- Decision owner: Project owner.
- Assignment status: unresolved.
- Resolution mechanism: Project decision plus formal specification update.
- Open issue: Diagnosis answers do not define numeric vector, policy,
  axisImportance, sourceConfidence, profileVersion, or updatedAt.
- Missing-input handling: blocked.

### `candidates`

- Type-level requiredness: Required.
- Runtime requirement: Required. `recommendSneakers` calls `.map` and `.sort` on
  `input.candidates`.
- Semantic / quality requirement: Candidate array must contain complete
  `SneakerCandidate` objects. A safe draft is not enough.
- Omission / default behavior: None.
- Current source: No complete source. WEB-08 provides only name and UI tag IDs.
- Future source candidate: Core input assembler after identity, tag, vector, and
  budget-fit adapters exist.
- Responsible layer: Core input assembly.
- Validation: Must reject empty or incomplete candidates before Core execution.
- Transformation: Depends on each candidate field below.
- Evidence IDs: E-002, E-003, E-014, E-016.
- Confidence: Requirement Confirmed; complete source Unresolved.
- Evidence conflict: No.
- Blocking severity: Blocking.
- Gate B requirement: Required.
- Decision owner: Implementation owner.
- Assignment status: unresolved.
- Resolution mechanism: Design spike after the candidate tag adapter conditions
  are settled.
- Open issue: No assembler may claim readiness while required candidate fields
  remain missing.
- Missing-input handling: blocked.

### `candidates[].sneakerId`

- Type-level requiredness: Required.
- Runtime requirement: Required. It is returned in `RecommendationResult`.
- Semantic / quality requirement: Must be stable enough for result identity and
  duplicate handling. A display name is not a safe ID by itself.
- Omission / default behavior: None.
- Current source: None.
- Future source candidate: Candidate identity adapter.
- Responsible layer: Adapter.
- Validation: Non-empty string and uniqueness within the candidate set.
- Transformation: Unresolved; possible mechanisms include caller-provided ID or
  deterministic local ID policy, but no decision is made in WEB-10A.
- Evidence IDs: E-005, E-016, E-025.
- Confidence: Requirement Confirmed; source Unresolved.
- Evidence conflict: No.
- Blocking severity: Blocking.
- Gate B requirement: Required.
- Decision owner: Project owner.
- Assignment status: unresolved.
- Resolution mechanism: Project decision.
- Open issue: Whether one-off UI-entered candidates need generated stable IDs or
  explicit caller IDs.
- Missing-input handling: blocked.

### `candidates[].name`

- Type-level requiredness: Required.
- Runtime requirement: Required for the result display field.
- Semantic / quality requirement: Trimmed non-empty user text is sufficient as a
  display name but not sufficient as candidate identity.
- Omission / default behavior: None.
- Current source: `safeCandidateDraft.name`.
- Future source candidate: Existing WEB-08 mapper output.
- Responsible layer: Existing safe mapper, later assembler.
- Validation: Existing mapper marks empty trimmed `sneakerName` invalid.
- Transformation: Trim UI `sneakerName` to `name`.
- Evidence IDs: E-005, E-014, E-015, E-019.
- Confidence: Confirmed.
- Evidence conflict: No.
- Blocking severity: Non-blocking by itself; blocked at candidate object level
  until other required fields exist.
- Gate B requirement: Required.
- Decision owner: Implementation owner.
- Resolution mechanism: Runtime verification.
- Open issue: None for name mapping.
- Missing-input handling: blocked if absent.

### `candidates[].vector`

- Type-level requiredness: Required.
- Runtime requirement: Required. Scoring reads `culture`, `styleFit`,
  `simplicity`, `street`, `volume`, `comfort`, `durability`, and `priceLevel`.
- Semantic / quality requirement: Very high. Vector values directly determine
  scores and price penalty.
- Omission / default behavior: None.
- Current source: None. UI tags and text do not produce numeric vector values.
- Future source candidate: Candidate vector adapter or explicit data source.
- Responsible layer: Data sourcing owner and adapter owner.
- Validation: Full 8-dimensional shape and numeric value domain. The current
  runtime clamps output scores, but does not validate raw input.
- Transformation: Unresolved.
- Evidence IDs: E-005, E-007, E-008, E-009, E-016, E-022, E-024.
- Confidence: Requirement Confirmed; generation Unresolved.
- Evidence conflict: No.
- Blocking severity: Blocking.
- Gate B requirement: Required.
- Decision owner: Data sourcing owner.
- Assignment status: unresolved.
- Resolution mechanism: Design spike plus formal specification update.
- Open issue: Whether numeric vector values come from explicit user input,
  curated data, a model, or another trusted source.
- Missing-input handling: blocked.

### `candidates[].tags`

- Type-level requiredness: Required.
- Runtime requirement: Required for `tagBonus` and `overlapPenalty`.
- Semantic / quality requirement: Medium to high. Tags influence scoring and
  closet overlap but are less granular than vector dimensions.
- Omission / default behavior: None for candidate tags.
- Current source: UI has candidate tag IDs; WEB-08 keeps them as
  `candidateTagIds`.
- Future source candidate: Candidate tag adapter.
- Responsible layer: Adapter.
- Validation: Every UI tag ID must be proven to map to a Core `SneakerTag`.
  Unsupported tags must warn or block.
- Transformation: Proposed direct mapping for the 12 overlapping IDs only.
- Evidence IDs: E-005, E-006, E-010, E-011, E-014, E-018.
- Confidence: Proposed adapter; requirement Confirmed.
- Evidence conflict: No.
- Blocking severity: Blocking until adapter exists.
- Gate B requirement: Required.
- Decision owner: Implementation owner.
- Resolution mechanism: Runtime verification plus unit tests.
- Open issue: Core has `canvas`, `collab`, `trail`, and `outdoor` tags that are
  not currently exposed in Candidate UI.
- Missing-input handling: blocked.

### `candidates[].budgetFit`

- Type-level requiredness: Required.
- Runtime requirement: Required by `calculatePriceScore`.
- Semantic / quality requirement: High. It directly affects `priceScore`.
- Omission / default behavior: None.
- Current source: None. `budgetText` is a UI string and is not Core `budgetFit`.
- Future source candidate: Budget fit adapter after a numeric rule is decided.
- Responsible layer: Project owner and adapter owner.
- Validation: Numeric score policy and accepted range must be specified before
  implementation.
- Transformation: Unresolved. No formula may be inferred from samples or raw
  text in WEB-10A.
- Evidence IDs: E-005, E-009, E-013, E-016, E-019.
- Confidence: Requirement Confirmed; generation Unresolved.
- Evidence conflict: No.
- Blocking severity: Blocking.
- Gate B requirement: Required.
- Decision owner: Project owner.
- Assignment status: unresolved.
- Resolution mechanism: Project decision plus formal specification update.
- Open issue: Whether `budgetText` is display-only, a raw amount, a range, or
  input to a later normalized score.
- Missing-input handling: blocked.

### `ownedSneakers`

- Type-level requiredness: Optional.
- Runtime requirement: Optional. `recommendSneakers` defaults missing
  `ownedSneakers` to `[]`.
- Semantic / quality requirement: Missing closet data reduces overlap
  personalization, but Core can run.
- Omission / default behavior: `[]`.
- Current source: None in current UI.
- Future source candidate: Closet adapter or safe omission.
- Responsible layer: Core input assembly.
- Validation: If provided, validate each `OwnedSneakerSummary`.
- Transformation: Not required for minimal Core run.
- Evidence IDs: E-002, E-003, E-011.
- Confidence: Confirmed optional.
- Evidence conflict: No.
- Blocking severity: Non-blocking.
- Gate B requirement: Not required.
- Decision owner: Implementation owner.
- Resolution mechanism: Runtime verification.
- Open issue: Later closet features may improve quality.
- Missing-input handling: safe omission.

### `preferredTags`

- Type-level requiredness: Optional.
- Runtime requirement: Optional. `recommendSneakers` defaults missing
  `preferredTags` to `[]`.
- Semantic / quality requirement: Missing preferred tags disables tag bonus but
  does not prevent Core execution.
- Omission / default behavior: `[]`.
- Current source: None. Preference Diagnosis answers may eventually generate
  preferred tags, but no rule exists yet.
- Future source candidate: Preference Diagnosis tag adapter or safe omission.
- Responsible layer: Adapter or assembler.
- Validation: If provided, every tag must be a Core `SneakerTag`.
- Transformation: Unresolved, but not required for minimal run.
- Evidence IDs: E-002, E-003, E-010, E-020.
- Confidence: Confirmed optional; source unresolved.
- Evidence conflict: No.
- Blocking severity: Non-blocking.
- Gate B requirement: Not required.
- Decision owner: UI/UX design owner.
- Assignment status: unresolved for future enhancement.
- Resolution mechanism: UI/UX decision plus formal specification update.
- Open issue: Whether diagnosis answers should create preferred tags, profile
  vector values, or both.
- Missing-input handling: safe omission.

## 12. Candidate Vector Dimension Investigation

`candidates[].vector` is an 8-dimensional `SneakerVector`.

| Dimension | Type-level requiredness | Runtime usage | Declared value range | Observed examples | Current source | Computable from current UI? | Required transformation rule | Omission / default behavior | External data potentially required? | Recommendation quality impact | Confidence | Evidence IDs | Evidence conflict | Blocking severity | Gate B requirement | Decision owner | Resolution mechanism | Open issue |
| --------- | ----------------------- | ------------- | -------------------- | ----------------- | -------------- | --------------------------- | ---------------------------- | --------------------------- | ------------------------------ | ----------------------------- | ---------- | ------------ | ----------------- | ----------------- | ------------------ | -------------- | -------------------- | ---------- |
| `culture` | Required | Taste distance against `profile.vector.culture` | Not formally validated in runtime; scoring formulas imply score scale around 0-100 | Samples contain values such as 46-84 | None | No | Unresolved numeric vector source | None | Possibly | High | Requirement Confirmed; source Unresolved | E-005, E-007, E-008, E-022, E-024 | No | Blocking | Required | Data sourcing owner | Design spike | Need trusted candidate culture score |
| `styleFit` | Required | Taste distance against `profile.vector.styleFit` | Not formally validated in runtime; scoring formulas imply score scale around 0-100 | Samples contain values such as 60-86 | None | No | Unresolved numeric vector source | None | Possibly | High | Requirement Confirmed; source Unresolved | E-005, E-007, E-008, E-022, E-024 | No | Blocking | Required | Data sourcing owner | Design spike | Need trusted style-fit score |
| `simplicity` | Required | Taste distance against `profile.vector.simplicity` | Not formally validated in runtime; scoring formulas imply score scale around 0-100 | Samples contain values such as 22-96 | None | No | Unresolved numeric vector source | None | Possibly | High | Requirement Confirmed; source Unresolved | E-005, E-007, E-008, E-022, E-024 | No | Blocking | Required | Data sourcing owner | Design spike | Tags alone cannot safely assign numeric value |
| `street` | Required | Taste distance against `profile.vector.street` | Not formally validated in runtime; scoring formulas imply score scale around 0-100 | Samples contain values such as 22-92 | None | No | Unresolved numeric vector source | None | Possibly | High | Requirement Confirmed; source Unresolved | E-005, E-007, E-008, E-022, E-024 | No | Blocking | Required | Data sourcing owner | Design spike | Need numeric street score |
| `volume` | Required | Taste distance against `profile.vector.volume` | Not formally validated in runtime; scoring formulas imply score scale around 0-100 | Samples contain values such as 16-92 | None | No | Unresolved numeric vector source | None | Possibly | High | Requirement Confirmed; source Unresolved | E-005, E-007, E-008, E-022, E-024 | No | Blocking | Required | Data sourcing owner | Design spike | Need numeric volume score |
| `comfort` | Required | Quality score uses candidate value directly | Not formally validated in runtime; output clamped to 0-100 | Samples contain values such as 54-90 | None | No | Unresolved numeric vector source | None | Possibly | High | Requirement Confirmed; source Unresolved | E-005, E-007, E-008, E-022, E-024 | No | Blocking | Required | Data sourcing owner | Design spike | UI tag `comfortable` is not numeric comfort |
| `durability` | Required | Quality score uses candidate value directly | Not formally validated in runtime; output clamped to 0-100 | Samples contain values such as 56-88 | None | No | Unresolved numeric vector source | None | Possibly | High | Requirement Confirmed; source Unresolved | E-005, E-007, E-008, E-022, E-024 | No | Blocking | Required | Data sourcing owner | Design spike | UI tag `durable` is not numeric durability |
| `priceLevel` | Required | Price sensitivity penalty input | Not formally validated in runtime; formula divides by 100 | Samples contain values such as 38-84, fixtures include 100 | None | No | Unresolved price-level normalization | None | Possibly | High | Requirement Confirmed; source Unresolved | E-005, E-009, E-016, E-022, E-024 | No | Blocking | Required | Data sourcing owner | Project decision | `seenPriceText` must not be treated as market price |

Declared value range is not marked Confirmed from samples alone. Runtime
formulas consistently use `100` as a scale reference and clamp output scores,
but raw input guards are not present. Therefore the future adapter must define
and validate numeric domains explicitly instead of relying on clamped output.

## 13. Declared Range Versus Observed Examples

Declared range:

- Core types declare numeric fields as `number`.
- Runtime formulas use 100-based scoring assumptions.
- No runtime guard currently rejects negative values, values over 100, `NaN`, or
  non-finite numbers before scoring.

Observed examples:

- `src/data/sampleProfiles.ts` and `src/data/sampleSneakers.ts` use values that
  look like 0-100 scores.
- Fixture documents and tests contain similar values.

Decision:

- Observed examples may inform adapter validation design.
- Observed examples do not by themselves Confirm the declared input value range.
- Gate B must include explicit numeric validation before Core assembly.

Evidence IDs: E-008, E-009, E-021, E-022, E-024.

## 14. Validation Conditions

Minimum validation before Core input assembly:

- `preferenceProfile` exists and all required nested fields exist.
- Every numeric profile field and candidate vector field is finite.
- Numeric domains are explicitly defined before enforcement.
- `candidates` is non-empty.
- Every candidate has a non-empty `sneakerId`.
- Candidate IDs are unique within the input.
- Every candidate has a non-empty `name`.
- Every candidate has a full 8-dimensional `vector`.
- Every candidate tag is a valid Core `SneakerTag`.
- Every candidate has `budgetFit`.
- Optional `ownedSneakers`, when provided, use valid tags and wear frequency.
- Optional `preferredTags`, when provided, use valid Core tags.

Current implementation does not provide this validation layer. WEB-10A does not
add it.

## 15. Transformation Policy

Allowed to design as later adapter transformations:

- `safeCandidateDraft.name` -> `SneakerCandidate.name`.
- Supported UI `candidateTagIds` -> matching Core `SneakerTag` values, after
  explicit adapter implementation and tests.
- Missing optional `ownedSneakers` -> safe omission by relying on
  `recommendSneakers` default `[]`.
- Missing optional `preferredTags` -> safe omission by relying on
  `recommendSneakers` default `[]`.

Not allowed without further decision:

- Diagnosis answers -> `PreferenceProfile`.
- UI tags -> numeric candidate vector.
- `seenPriceText` -> `priceLevel`.
- `budgetText` -> `budgetFit`.
- `premium` tag -> price, resale value, or high price.
- Dummy object, zero vector, neutral profile, empty required candidate tags, or
  default IDs to hide missing required Core input.

## 16. Responsible Layers

| Responsibility | Layer | Notes |
| -------------- | ----- | ----- |
| Trim candidate name | Existing safe mapper | Already implemented by WEB-08. |
| Resolve supported candidate UI tag IDs to Core tag rules | Candidate tag mapping resolution | Candidate for WEB-10A.1 only; Gate A eligibility depends on confirmed conversion and validation rules. |
| Create candidate identity | Candidate identity adapter | Needs project decision for ID policy. |
| Create candidate vector | Data sourcing / candidate vector adapter | Needs explicit numeric source and validation. |
| Create budget fit | Budget fit adapter | Needs numeric conversion policy. |
| Create preference profile | Preference profile adapter | Needs diagnosis-to-profile specification. |
| Assemble `RecommendSneakersInput` | Core input assembler | Gate B only, after blocking fields are resolved. |
| Call `recommendSneakers` | Integration layer | Gate B only, after assembler and validation exist. |

## 17. Classification Summary

Confirmed:

- Core public entry point and type shape.
- `preferenceProfile` and `candidates` are required.
- `ownedSneakers` and `preferredTags` are optional and default to `[]`.
- Candidate `name` can come from the existing safe draft.
- Core runtime reads candidate vector, tags, and budgetFit.
- Current safe draft is not complete Core input.

Proposed:

- Candidate tag adapter for the 12 UI tag IDs that overlap with Core tags,
  pending explicit conversion and validation rules.
- Candidate identity adapter as a standalone next investigation.
- Safe omission of optional `ownedSneakers` and `preferredTags` for a minimal
  Core run.

Unresolved:

- Diagnosis answers to `PreferenceProfile`.
- Candidate ID generation or sourcing.
- Candidate vector generation and value domain validation.
- `priceLevel` generation.
- `budgetFit` generation.
- Whether diagnosis should produce `preferredTags`.

Out of scope:

- Result UI.
- API routes or backend server.
- DB, persistence, login, localStorage, sessionStorage.
- Gemini, OpenAI, price APIs, scraping, inventory, authenticity, purchase links.
- Changes to existing `app/**`, `src/**`, package files, or old docs.

Blocking:

- `preferenceProfile`.
- Complete `candidates`.
- `candidates[].sneakerId`.
- `candidates[].vector`.
- `candidates[].tags` until converted to Core tags.
- `candidates[].budgetFit`.

Non-blocking:

- `candidates[].name` by itself.
- `ownedSneakers` omission.
- `preferredTags` omission.
- Candidate `brand`, `seenPriceText`, `budgetText`, and `memo` as UI-only
  display data.

Safe omission:

- `ownedSneakers` when absent.
- `preferredTags` when absent.

No Core-required field is classified as safe omission.

## 18. Adapter Candidates

| Adapter candidate | Scope | Inputs | Output | Gate A status | Blocking dependency | Reason |
| ----------------- | ----- | ------ | ------ | ------------- | ------------------- | ------ |
| Candidate Draft Field Pass-through | Pass already-normalized draft fields forward without another semantic transformation | `safeCandidateDraft.name` | candidate `name` | Not applicable | None | WEB-08 already trims and validates the name; an independent name adapter would duplicate responsibility. |
| Candidate Tag Adapter | Convert supported candidate UI tag IDs to Core tags | `safeCandidateDraft.candidateTagIds` plus supported ID set | `SneakerTag[]` | Not yet eligible | Conversion and validation conditions must be Confirmed in WEB-10A.1 before WEB-10B1 implementation | UI IDs overlap with Core tag literals, but adapter output type, unknown handling, empty-array policy, duplicate handling, and unsupported-tag behavior still need explicit rules. |
| Candidate Identity Adapter | Create or require candidate ID | candidate draft and chosen ID policy | `sneakerId` | Not yet | ID policy decision | Stable ID semantics are not decided. |
| Budget Fit Adapter | Convert budget-related input to score | `budgetText` and/or other budget source | `budgetFit` | Not yet | Numeric policy decision | Raw text is not Core score. |
| Candidate Vector Adapter | Produce full vector | curated data, explicit inputs, or later source | `SneakerVector` | Not yet | Data source and value-domain decision | Tags alone cannot safely produce numeric vector. |
| Preference Profile Adapter | Produce profile | diagnosis answers and policy | `PreferenceProfile` | Not yet | Diagnosis-to-profile specification | UI answers do not define profile fields. |

Gate A is limited to individual adapters. It does not mean Core input assembly
or `recommendSneakers` integration is safe.

## 19. Gate A Decision

Gate A Eligible:

- None at WEB-10A completion.

Gate A Not Applicable:

- Candidate Draft Field Pass-through for `safeCandidateDraft.name`. The name has
  already been normalized by WEB-08 and can be passed to a future assembler
  without an additional semantic adapter.

Gate A Not Eligible:

- Candidate Tag Adapter, until all WEB-10A.1 conversion and validation
  conditions are Confirmed.
- Candidate Identity Adapter.
- Budget Fit Adapter.
- Candidate Vector Adapter.
- Preference Profile Adapter.

Candidate Tag Adapter can become Gate A Eligible only after WEB-10A.1 confirms:

- every currently selectable UI tag ID has a corresponding Core tag;
- the output shape is `SneakerTag[]`;
- unknown tag handling is defined;
- empty-array behavior is defined;
- duplicate handling is defined;
- unsupported Core tags are intentionally out of adapter scope;
- the adapter does not rely on type assertions for raw `candidateTagIds`.

Gate A prohibited:

- Core input assembly.
- `recommendSneakers` execution.
- UI integration to results.
- Dummy implementations for missing adapters.
- Any claim that a complete Core input can be built.

## 20. Gate B Requirements

Do not start `coreInputAssembler`, `RecommendSneakersInput` construction, or
`recommendSneakers` integration until all of these are true:

1. Every Core-public or runtime-required field for the planned minimal input has
   no Blocking `Unresolved` dependency.
2. Every vector dimension has a Confirmed generation rule, validation rule, and
   value-domain rule.
3. If `preferenceProfile` is required for the planned run, its generation rule is
   Confirmed.
4. If candidate tags are required for the planned run, UI-to-Core tag conversion
   is Confirmed.
5. `budgetFit` generation is Confirmed.
6. `sneakerId` generation or sourcing is Confirmed.
7. Optional field omission behavior is Confirmed by runtime and intentionally
   chosen.
8. Evidence conflicts do not remain in Core execution prerequisites.
9. No dummy values, false assertions, or default objects hide missing Core input.
10. Adapter output ownership and assembler responsibility are separated.

Gate B current result: Not ready.

## 21. Minimum Core Execution Requirements

The minimum Core execution input still needs:

- `preferenceProfile`
- at least one complete candidate
- `candidates[].sneakerId`
- `candidates[].name`
- complete `candidates[].vector`
- `candidates[].tags`
- `candidates[].budgetFit`

`ownedSneakers` and `preferredTags` may be omitted for a minimal run because
runtime defaults them to `[]`. This reduces recommendation quality but does not
block Core execution.

## 22. Decision Items

| Decision | Evidence IDs | Source symbol | Impact |
| -------- | ------------ | ------------- | ------ |
| Use the actual HEAD `58326e0db14780ed7d647e886247b5908158d6ed` as the investigation baseline. | E-001, E-016 | Git HEAD | Evidence and conclusions are pinned to the expected WEB-09 baseline. |
| Treat `ownedSneakers` omission as safe for minimal Core execution. | E-002, E-003, E-011 | `recommendSneakers` | Allows Gate B to avoid closet adapter as a blocker. |
| Treat `preferredTags` omission as safe for minimal Core execution. | E-002, E-003, E-010 | `recommendSneakers` | Allows Gate B to avoid preferred-tag adapter as a blocker. |
| Treat candidate `name` mapping as Confirmed but insufficient by itself. | E-005, E-014, E-015 | `safeCandidateDraft.name`, `SneakerCandidate.name` | No independent name adapter is required; a future assembler may pass the already-normalized value through. |
| Keep current required missing fields Blocking. | E-002, E-005, E-007, E-016 | `requiredMissingCoreFields` | Prevents premature Core execution. |

## 23. Unresolved Items

| Open question | Why unresolved | Evidence IDs | Evidence conflict | Blocking severity | Gate B requirement | Decision owner | Assignment status | Resolution mechanism | Required evidence / next action | Blocks Gate A? | Blocks Gate B? |
| ------------- | -------------- | ------------ | ----------------- | ----------------- | ------------------ | -------------- | ----------------- | -------------------- | ------------------------------- | -------------- | -------------- |
| How should Preference Diagnosis answers become `PreferenceProfile`? | UI answers are categorical and incomplete; Core needs numeric profile, policy, confidence, version, timestamp. | E-004, E-007, E-020 | No | Blocking | Required | Project owner | unresolved | Formal specification update | Define answer-to-profile rules and validation. | No for tag/name adapters | Yes |
| How should `sneakerId` be sourced or generated? | Name is not identity and no UI field exists. | E-005, E-016, E-025 | No | Blocking | Required | Project owner | unresolved | Project decision | Decide explicit ID input, deterministic local ID, or other policy. | Yes for identity adapter | Yes |
| What source creates the 8-dimensional candidate vector? | Current UI tags and text do not define numeric vector dimensions. | E-005, E-007, E-008, E-022 | No | Blocking | Required | Data sourcing owner | unresolved | Design spike | Choose trusted data source and validation. | Yes for vector adapter | Yes |
| What is the declared numeric value domain for profile and candidate scores? | Runtime uses 100-based formulas but no input guard declares range. | E-008, E-009, E-021, E-022, E-024 | No | Blocking | Required | Core design owner | unresolved | Formal specification update | Declare range, finite-number policy, and invalid-value handling. | Yes for numeric adapters | Yes |
| How should `budgetFit` be created? | `budgetText` is raw UI text, not a normalized Core score. | E-005, E-009, E-013, E-019 | No | Blocking | Required | Project owner | unresolved | Project decision | Define source and formula or require explicit score. | Yes for budget adapter | Yes |
| Should diagnosis generate `preferredTags`? | Optional for Core, but product semantics are not decided. | E-002, E-003, E-010, E-020 | No | Non-blocking | Not required | UI/UX design owner | unresolved | UI/UX decision | Decide whether tags are omitted or generated later. | No | No |
| Should `ownedSneakers` be omitted in the first Core run? | Runtime allows omission; quality trade-off remains. | E-002, E-003, E-011 | No | Non-blocking | Not required | Project owner | unresolved for product quality | Project decision | Decide whether first integration includes closet data. | No | No |

## 24. API Trust Boundary Consideration

WEB-10A does not decide API endpoints, backend framework, route handlers, JSON
schemas, or server implementation.

Three possible future approaches:

| Approach | Trust boundary | Server-side revalidation | Structural validation | Semantic validation | Risk if client values are trusted | Responsibility split | Core integration depth |
| -------- | -------------- | ------------------------ | --------------------- | ------------------- | -------------------------------- | -------------------- | ---------------------- |
| Send UI raw input | Server receives diagnosis answers and candidate form fields | High; server must repeat all adapter rules | Required | Required | Raw text and IDs may be incomplete or misleading | Server owns adapter and validation | Lower client coupling, more server work |
| Send mapper draft | Server receives `safeCandidateDraft` and warnings | High; server still must create missing Core values | Required | Required | Draft may be mistaken for complete Core input | Client owns basic safe mapping; server owns Core assembly | Medium |
| Send adapter-ready Core input | Server receives already transformed Core-like values | Highest; server must distrust and revalidate all values | Required | Required | Client could spoof profile/vector/budget scores | Shared, but server remains final authority | Highest client coupling |

Non-blocking recommendation:

- Treat any future client-provided Core-like values as untrusted.
- Revalidate structure and semantics before `recommendSneakers`.
- Do not implement an API merely because a future boundary exists.
- Do not use generic security material as SOLE//MATRIX Core field evidence.

## 25. User-Facing Display Compatibility

Current UI can continue to display:

- Candidate name.
- Brand.
- Seen price text.
- Budget text.
- Memo.
- Selected UI tags.
- Preference Diagnosis answers.

These display fields must not imply that Core can run. User-facing readiness
messages should distinguish:

- `blocked`: required Core inputs are missing.
- `warning`: value can be displayed but not used for Core judgment.
- `safe omission`: optional Core field is intentionally omitted.

Current safe omissions are only `ownedSneakers` and `preferredTags`.

## 26. Next Individual Work

Recommended next design-resolution phase:

1. WEB-10A.1: Candidate Tag Mapping Resolution
   - Confirm exact mapping for the 12 current UI tag IDs.
   - Block or warn unsupported IDs.
   - Define empty-array and duplicate handling.
   - Confirm that candidate tags are not preferred tags, price signals, resale
     signals, or authenticity signals.

Conditional implementation phase:

2. WEB-10B1: Candidate Tag Adapter
   - Implement only after WEB-10A.1 confirms all Gate A conditions.
   - Add unit tests proving the confirmed mapping and validation behavior.

Later unresolved adapter investigations:

3. Candidate Identity Adapter
   - Decide whether ID is caller-provided or generated.
   - Define uniqueness and stability rules.
   - Keep it separate from name mapping.

4. Budget Fit Adapter
   - Decide whether raw budget text is display-only or a score source.
   - If it becomes a score source, define parsing, normalization, value domain,
     invalid-value behavior, and tests.

## 27. Work Not To Start Next

Do not start:

- `coreInputAssembler`.
- `RecommendSneakersInput` construction.
- `recommendSneakers` integration.
- Result List or Result Detail UI.
- API route or backend server.
- DB, persistence, login, storage.
- Gemini, OpenAI, price API, inventory API, authenticity service, scraping, or
  purchase links.
- Candidate vector generation from tags alone.
- Preference profile generation from diagnosis answers without a formal rule.

## 28. Files Not Changed By WEB-10A

WEB-10A intentionally changes none of these:

- `app/**`
- `src/**`
- `package.json`
- `pnpm-lock.yaml`
- `vitest.config.ts`
- `README.md`
- `.github/**`
- `docs/web/07_CORE_INPUT_MAPPING_PLAN.md`
- `docs/web/08_CORE_INPUT_MAPPER_SUMMARY.md`
- `docs/web/08_5_TEST_COVERAGE_SUMMARY.md`
- `docs/web/09_CORE_RECOMMENDATION_DRY_RUN_SUMMARY.md`
- `docs/agent-prompts/**`

No deprecated WEB-10 output file was created, edited, or referenced as a target.

## 29. Consistency Audit

- Confirmed items without Evidence ID: none.
- Evidence ID references missing from Evidence Register: none.
- Duplicate Evidence IDs: none.
- Unresolved items without Decision owner: none.
- Unresolved items without Resolution mechanism: none.
- Unresolved items without next action: none.
- Items with Evidence conflict marked Confirmed: none.
- Declared value range based only on sample / fixture / test: none.
- Declared value range inferred from observed examples: none.
- Gate A Eligible adapter with Blocking dependency: none; no adapter is Gate A
  Eligible at WEB-10A completion.
- Gate A Eligible described as Core integration capable: none.
- Gate B requirement based only on type-level optionality: none.
- Runtime-required field excluded because of type optionality: none.
- Core required field classified as safe omission: none.
- Figma unverified content treated as Confirmed: none.
- Deprecated file name used as output: none.

Consistency audit result: Passed.

Remaining inconsistencies: none.

## 30. Final Conclusion

Candidate name does not need an independent adapter. `safeCandidateDraft.name`
is already normalized by the WEB-08 mapper and can be passed through by a future
assembler when the other required candidate fields are ready.

Current Gate A eligible adapters: none.

Next design-resolution phase: `WEB-10A.1: Candidate Tag Mapping Resolution`.
This phase should confirm the complete UI-to-Core tag mapping, output type,
unknown handling, empty-array policy, duplicate handling, and unsupported-tag
behavior before claiming Gate A eligibility.

Conditional implementation phase: `WEB-10B1: Candidate Tag Adapter`. Start this
only after WEB-10A.1 confirms all Gate A conditions.

Core input assembly is not ready. `recommendSneakers` integration is not ready.
The blockers are `preferenceProfile`, `sneakerId`, full candidate vector,
candidate Core tags until an adapter exists, and `budgetFit`.

WEB-10A therefore recommends proceeding to the narrowly scoped WEB-10A.1 mapping
resolution, not to Core input assembly or recommendation execution.
