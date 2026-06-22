# WEB-10C: Remaining Core Input Fields Readiness Check

## 1. Purpose

WEB-10C checks whether the four remaining Core input fields are ready for a
later limited Core input adapter design:

```txt
preferenceProfile
sneakerId
candidateVector
budgetFit
```

This is a docs-only investigation. It does not implement an adapter, assemble
`RecommendSneakersInput`, import or call `recommendSneakers`, change UI, or
change Core behavior.

## 2. Evidence Snapshot

```txt
Repository revision: 8085e0251aae7fe28f0eb12449aab00006df11a3
Investigation date: 2026-06-22
Branch: main
Working tree status: clean at investigation start
Core public entry point: src/core/index.ts
Documents reviewed:
- docs/web/10A_CORE_INPUT_RESOLUTION_READINESS_PLAN.md
- docs/web/10A_1_CANDIDATE_TAG_MAPPING_RESOLUTION.md
- docs/web/10B1_CANDIDATE_TAG_ADAPTER_SUMMARY.md
- docs/web/09_CORE_RECOMMENDATION_DRY_RUN_SUMMARY.md
- docs/web/08_CORE_INPUT_MAPPER_SUMMARY.md
- docs/web/07_CORE_INPUT_MAPPING_PLAN.md
- docs/final-spec/SOLE_MATRIX_Final_Specification_Set_Core_v0_1/04_FINAL_TYPES.md
- docs/final-spec/SOLE_MATRIX_Final_Specification_Set_Core_v0_1/05_AXIS_AND_SCORE_RULES.md
Core files reviewed:
- src/core/index.ts
- src/core/types.ts
- src/core/recommendSneakers.ts
- src/domain/**/*.ts
- src/data/**/*.ts
- remaining src/**/*.ts
App mapper files reviewed:
- app/_lib/core-input/types.ts
- app/_lib/core-input/candidateInputMapper.ts
- app/_lib/core-input/candidateTagAdapter.ts
- app/_lib/core-input/coreRecommendationDryRun.ts
Additional current UI files reviewed:
- app/_data/preferenceDiagnosisQuestions.ts
- app/_components/PreferenceDiagnosisFlow.tsx
- app/_data/candidateSneakerOptions.ts
- app/_components/CandidateSneakerCheckFlow.tsx
```

The baseline matched the requested WEB-10B1 commit and the working tree was
clean, so investigation proceeded.

## 3. Evidence Rules

Evidence strength is handled in this order:

1. public API / exported type
2. runtime implementation / explicit validation / constant
3. existing formal design document
4. app mapper implementation
5. test
6. fixture
7. sample
8. inferred behavior

A `Confirmed` conclusion in this document has at least one evidence item from
level 1 or 2. Tests, fixtures, samples, and inferred behavior are not used alone
to confirm a Core contract or value range.

Confidence labels:

- `Confirmed`: supported by public API, exported type, runtime implementation,
  explicit validation, or a constant.
- `Proposed`: a plausible future design exists but still requires an owner
  decision or additional specification.
- `Unresolved`: a required source, transformation, validation rule, or contract
  is missing.
- `Not currently supported`: the current project scope has no supported source
  or conversion for the field.

Blocking labels:

- `Blocking`: safe Core input assembly cannot proceed without resolution.
- `Non-blocking`: quality may be reduced, but Core type and runtime permit
  omission with Confirmed behavior.
- `Research-only`: future investigation that does not block the current stage.

## 4. Evidence Register

| Evidence ID | Field | Claim | Evidence kind | File path | Symbol / type / property | Summary | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E-001 | Core API | Core publicly exports recommendation input types and `recommendSneakers`. | public API | `src/core/index.ts` | exports | Establishes the public Core boundary. | Confirmed |
| E-002 | all | `preferenceProfile` and `candidates` are required Core input properties. | exported type | `src/core/types.ts` | `RecommendSneakersInput` | Neither property is optional and neither has a type-level default. | Confirmed |
| E-003 | preferenceProfile | The profile requires identity, vectors, policies, importance, confidence, version, and timestamp fields. | exported type | `src/domain/profile/preferenceTypes.ts` | `PreferenceProfile` | Defines the complete required profile shape. | Confirmed |
| E-004 | sneakerId / candidateVector / budgetFit | Every candidate requires `sneakerId`, a complete `SneakerVector`, tags, and `budgetFit`. | exported type | `src/domain/sneaker/sneakerVector.ts` | `SneakerCandidate`, `SneakerVector` | Defines the required candidate shape and eight vector dimensions. | Confirmed |
| E-005 | preferenceProfile / sneakerId | Runtime passes `input.preferenceProfile` into scoring and copies `candidate.sneakerId` into each result. | runtime implementation | `src/core/recommendSneakers.ts` | `recommendSneakers` | There is no default for either field. | Confirmed |
| E-006 | preferenceProfile / candidateVector / budgetFit | Runtime reads profile vector, policy, axis importance, all candidate vector dimensions, and budget fit. | runtime implementation | `src/domain/recommendation/balancedScore.ts` | `calculateBalancedScore` | These values directly affect recommendation scores and decisions. | Confirmed |
| E-007 | candidateVector | Taste axes compare profile and candidate numbers; quality axes use candidate numbers directly. | runtime implementation | `src/domain/recommendation/axes.ts` | `calculateTasteAxisScore`, `calculateQualityAxisScore` | Output is clamped, but raw inputs are not validated. | Confirmed |
| E-008 | preferenceProfile | All seven `axisImportance` values affect normalized feature weights. | runtime implementation | `src/domain/recommendation/axisWeights.ts` | `calculateAxisWeights` | A partial profile is not sufficient. | Confirmed |
| E-009 | preferenceProfile / candidateVector / budgetFit | Price score reads `priceSensitivity`, `priceLevel`, and `budgetFit`. | runtime implementation | `src/domain/recommendation/priceScore.ts` | `calculatePriceScore` | Formula uses a 100-based scale but does not validate the input domain. | Confirmed |
| E-010 | numeric fields | Core clamps calculated score output to 0 through 100. | runtime implementation | `src/domain/recommendation/scoreUtils.ts` | `clampScore` | This is output clamping, not input validation. | Confirmed |
| E-011 | preferenceProfile | The current diagnosis exposes eight question IDs and `like`, `neutral`, `dislike` answers. | constant | `app/_data/preferenceDiagnosisQuestions.ts` | `preferenceDiagnosisQuestions`, `DiagnosisAnswerId` | No numeric Core mapping is defined. | Confirmed |
| E-012 | preferenceProfile | The current diagnosis stores an answer map and permits unanswered questions. | runtime implementation | `app/_components/PreferenceDiagnosisFlow.tsx` | `selectedAnswerByQuestionId`, `handleNext` | It does not create a Core profile. | Confirmed |
| E-013 | candidate inputs | Current candidate UI stores name, brand, seen-price text, budget text, memo, and selected tag IDs. | runtime implementation | `app/_components/CandidateSneakerCheckFlow.tsx` | component state | No ID, vector, or numeric budget fit is created. | Confirmed |
| E-014 | candidate inputs | Mapper input contains price and budget strings, but safe output contains only name and candidate tag IDs. | exported type | `app/_lib/core-input/types.ts` | `CandidateUiInput`, `CandidateInputMappingResult` | Confirms the existing safe adapter boundary. | Confirmed |
| E-015 | candidate inputs | Mapper trims name, preserves supported tag IDs, and records price/budget text as unsupported. | app mapper implementation | `app/_lib/core-input/candidateInputMapper.ts` | `mapCandidateUiInputToSafeDraft` | It performs no numeric conversion. | Confirmed |
| E-016 | candidate tags | Candidate tag IDs can now be mapped to Core `SneakerTag[]`. | app mapper implementation | `app/_lib/core-input/candidateTagAdapter.ts` | `mapCandidateTagsToCoreTags` | Resolves tags only; it does not create any of the four fields in WEB-10C. | Confirmed |
| E-017 | all | Existing dry-run guard records all four WEB-10C fields as missing and always blocks mapper-only execution. | app mapper implementation | `app/_lib/core-input/coreRecommendationDryRun.ts` | `requiredMissingCoreFields`, `requiredCoreFieldReasons` | Confirms the current app boundary remains incomplete. | Confirmed |
| E-018 | all | Previous readiness work classified the four fields as unresolved Core blockers. | design document | `docs/web/10A_CORE_INPUT_RESOLUTION_READINESS_PLAN.md` | field details and Gate B requirements | Provides prior design context, not independent runtime proof. | Confirmed |
| E-019 | candidate tags | Candidate tag mapping was resolved separately and does not authorize complete candidate assembly. | design document | `docs/web/10A_1_CANDIDATE_TAG_MAPPING_RESOLUTION.md` | final gate conclusion | Leaves the four WEB-10C fields unresolved. | Confirmed |
| E-020 | candidate tags | WEB-10B1 implemented only the candidate tag adapter. | design document | `docs/web/10B1_CANDIDATE_TAG_ADAPTER_SUMMARY.md` | explicit non-scope and next step | Confirms implementation scope at the target commit. | Confirmed |
| E-021 | budgetFit | Existing mapping plan says raw `budgetText` is not Core `budgetFit`. | design document | `docs/web/07_CORE_INPUT_MAPPING_PLAN.md` | candidate mapping table | A numeric conversion rule remains absent. | Confirmed |
| E-022 | numeric fields | Sample profiles show example numeric values and complete profile objects. | sample | `src/data/sampleProfiles.ts` | `sampleProfiles` | Observed examples only; not a confirmed range or production source. | Unresolved |
| E-023 | sneakerId / candidateVector / budgetFit | Sample candidates show example IDs, vectors, and budget-fit values. | sample | `src/data/sampleSneakers.ts` | `sampleSneakers` | Observed examples only; not a confirmed range or production source. | Unresolved |
| E-024 | types | Final type document matches current exported Core shapes. | design document | `docs/final-spec/SOLE_MATRIX_Final_Specification_Set_Core_v0_1/04_FINAL_TYPES.md` | final types | No additional input validation is declared. | Confirmed |
| E-025 | numeric fields | Final score document matches current 100-based formulas. | design document | `docs/final-spec/SOLE_MATRIX_Final_Specification_Set_Core_v0_1/05_AXIS_AND_SCORE_RULES.md` | axis and score rules | It does not add a raw-input guard or UI conversion rule. | Confirmed |

## 5. Required Field Readiness Table

| Field | Core symbol / property | Required by Core type? | Required at runtime? | Omission behavior | Current source | Can derive from current UI / adapters? | Proposed source | Transformation rule | Evidence / source symbol | Confidence | Blocking severity | Owner decision needed? | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `preferenceProfile` | `RecommendSneakersInput.preferenceProfile` / `PreferenceProfile` | Yes | Yes; scoring reads `vector`, `policy`, and `axisImportance` | No default. With a candidate present, omission or incomplete nested fields causes property access failure or invalid numeric output. | Eight optional categorical diagnosis answers only | No; the UI does not supply a complete profile or a Confirmed numeric mapping | A dedicated Preference Diagnosis profile contract and adapter | Unresolved. Must define all profile fields, unanswered handling, numeric domains, metadata policy, and validation | E-002, E-003, E-005, E-006, E-008, E-011, E-012 | Unresolved | Blocking | Yes: Project owner and Core design owner | Resolve SP-001 before adapter design; requiredness is Confirmed, but source and transformation remain unresolved |
| `sneakerId` | `SneakerCandidate.sneakerId` | Yes | Yes; copied into `RecommendationResult.sneakerId` | No default or validation. If the type boundary is bypassed, output identity can be missing or unstable. | None | No | Caller-provided stable ID or a formally approved identity service/policy | Unresolved. Name slug, brand/name hash, random ID, UUID, and temporary ID are not approved | E-004, E-005, E-013, E-014, E-017 | Unresolved | Blocking | Yes: Project owner | Resolve SP-002 before adapter design; requiredness is Confirmed, but source and identity policy remain unresolved |
| `candidateVector` | `SneakerCandidate.vector` / `SneakerVector` | Yes | Yes; all eight dimensions are read by scoring | No default. Missing vector causes property access failure; invalid numbers can propagate into `NaN` or distorted scores | None | No; text and tags do not define eight numeric dimensions | Trusted curated candidate data, explicit numeric input, or another approved source | Unresolved. Must define per-dimension source, range, normalization, validation, and failure behavior | E-004, E-006, E-007, E-009, E-013, E-014, E-017 | Unresolved | Blocking | Yes: Data sourcing owner, Core design owner, Project owner | Resolve SP-003 before adapter design; requiredness and runtime use are Confirmed, but source, range, and transformation remain unresolved |
| `budgetFit` | `SneakerCandidate.budgetFit` | Yes | Yes; directly used by `calculatePriceScore` | No default. Missing or nonnumeric input produces invalid price-score arithmetic | Raw `budgetText` and `seenPriceText` exist only as UI strings and are excluded by the safe mapper | No | Explicit normalized score, or a formally defined price/budget normalization adapter | Unresolved. Currency, parsing, tax/shipping, amount semantics, and score formula are undefined | E-004, E-006, E-009, E-013, E-014, E-015, E-017, E-021 | Unresolved | Blocking | Yes: Project owner and Core design owner | Resolve SP-004 before adapter design; requiredness and runtime use are Confirmed, but source and transformation remain unresolved |

None of the four fields has a Confirmed safe omission path. All four are
required by exported types, and all four are read or propagated by runtime.

## 6. `preferenceProfile` Readiness

### 6.1 Core structure

`PreferenceProfile` requires:

| Area | Required fields | Runtime significance | Current UI coverage | Evidence |
| --- | --- | --- | --- | --- |
| identity | `userId` | Stored in the profile shape; no Core default | None | E-003 |
| preference vector | `culture`, `styleFit`, `simplicity`, `street`, `volume`, `comfort`, `durability` | Taste matching uses the first five; the complete type is required | Questions provide possible semantic hints only | E-003, E-006, E-007, E-011 |
| policy | `priceSensitivity`, `overlapSensitivity`, `explorationTolerance` | Price and overlap scoring read two values; complete policy is required by type | No direct questions or values | E-003, E-006, E-009, E-011 |
| axis importance | seven axis values | All seven affect feature weights | Comfort and durability questions may indicate importance, but no numeric rule exists | E-003, E-008, E-011 |
| source confidence | `diagnosis`, `ownedSneakers`, `wantedSneakers`, `feedback` | Required by type; no current UI source | None | E-003, E-012 |
| metadata | `profileVersion`, `updatedAt` | Required by type; no current UI policy | None | E-003, E-012 |

### 6.2 WEB-05 answer coverage

| Diagnosis question | Possible Core relationship | Covered safely by WEB-05 alone? | Missing rule |
| --- | --- | --- | --- |
| `trusted-classic` | possibly `vector.culture` or optional preferred tags | No | Numeric direction, magnitude, and field ownership |
| `simple-daily` | possibly `vector.simplicity` and `vector.styleFit` | No | One answer may affect multiple fields; weights are undefined |
| `street-presence` | possibly `vector.street` | No | Answer-to-number mapping |
| `soft-volume` | possibly `vector.volume` | No | Answer-to-number mapping |
| `walking-comfort` | possibly `axisImportance.comfort` and/or `vector.comfort` | No | Preference versus importance semantics |
| `long-use` | possibly `axisImportance.durability` and/or `vector.durability` | No | Preference versus importance semantics |
| `sporty-mood` | no dedicated profile field; possibly optional preferred tags | No | Core destination and semantics |
| `premium-detail` | no dedicated profile field; possibly culture or optional preferred tags | No | Must not be interpreted as price without a decision |

Unanswered questions are allowed by the current UI. There is no Confirmed rule
for omission, neutral treatment, reduced confidence, or blocking. Therefore:

- unanswered is not automatically neutral;
- `like`, `neutral`, and `dislike` are not assigned numeric values;
- no provisional profile is permitted;
- WEB-05 alone cannot produce a complete `PreferenceProfile`.

Project owner decisions are required for field ownership, unanswered handling,
numeric conversion, and metadata policy. Core design owner approval is required
for numeric domains and validation.

Readiness:

```txt
Confidence: Unresolved
Blocking severity: Blocking
Implementation readiness: No
```

## 7. `sneakerId` Readiness

Confirmed behavior:

- `SneakerCandidate.sneakerId` is a required string. Evidence: E-004.
- `recommendSneakers` copies it into every result. Evidence: E-005.
- Current Candidate UI and safe mapper do not create it. Evidence: E-013,
  E-014, E-017.
- No runtime uniqueness, non-empty, format, or stability validation exists in
  the inspected Core path.

Unresolved questions:

- whether an ID must be stable across sessions;
- whether uniqueness is required only within one input or across persisted
  data;
- whether the caller must provide an external/catalog ID;
- whether one-off candidates may use a temporary ID;
- what happens when the same sneaker is entered with a different display name.

The following strategies are explicitly not approved by current evidence:

- slugging `name`;
- hashing `brand + name`;
- generating a random or cryptographic ID;
- introducing UUIDs;
- silently using the array index;
- using an empty or placeholder ID.

These could be future design options, but selecting one is a Project owner
decision.

Readiness:

```txt
Confidence: Unresolved
Blocking severity: Blocking
Implementation readiness: No
```

## 8. `candidateVector` Readiness

The vector must be evaluated per dimension. Candidate tags are not numeric
vector evidence, and one tag must not be expanded into several numeric axes
without a formal rule.

| Vector dimension | Declared value range | Observed examples | Evidence / source symbol | Current evidence source | Computable from current UI? | Required transformation rule | Omission / default behavior | External data potentially required? | Recommendation quality impact | Confidence | Blocking reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `culture` | `number`; no explicit raw-input range or guard | 45, 68, 95 | E-004: `SneakerVector.culture`; E-006/E-007 runtime; E-023 sample | Exported type, runtime, sample | No | Trusted source plus explicit numeric normalization and validation | None | Possibly | Direct taste-distance input | Unresolved | No current numeric source; requiredness is Confirmed, but range and source remain unresolved |
| `styleFit` | `number`; no explicit raw-input range or guard | 55, 75, 86 | E-004: `SneakerVector.styleFit`; E-006/E-007 runtime; E-023 sample | Exported type, runtime, sample | No | Same | None | Possibly | Direct taste-distance input | Unresolved | No current numeric source; requiredness is Confirmed, but range and source remain unresolved |
| `simplicity` | `number`; no explicit raw-input range or guard | 22, 76, 96 | E-004: `SneakerVector.simplicity`; E-006/E-007 runtime; E-023 sample | Exported type, runtime, sample | No | Same; tags such as `minimal` cannot set a score by themselves | None | Possibly | Direct taste-distance input | Unresolved | Tag-to-number rule absent; requiredness is Confirmed, but range and source remain unresolved |
| `street` | `number`; no explicit raw-input range or guard | 22, 66, 95 | E-004: `SneakerVector.street`; E-006/E-007 runtime; E-023 sample | Exported type, runtime, sample | No | Same; `street` tag cannot set a score by itself | None | Possibly | Direct taste-distance input | Unresolved | Tag-to-number rule absent; requiredness is Confirmed, but range and source remain unresolved |
| `volume` | `number`; no explicit raw-input range or guard | 16, 50, 92 | E-004: `SneakerVector.volume`; E-006/E-007 runtime; E-023 sample | Exported type, runtime, sample | No | Same; `chunky` tag cannot set a score by itself | None | Possibly | Direct taste-distance input | Unresolved | Tag-to-number rule absent; requiredness is Confirmed, but range and source remain unresolved |
| `comfort` | `number`; no explicit raw-input range or guard | 35, 70, 92 | E-004: `SneakerVector.comfort`; E-006/E-007 runtime; E-023 sample | Exported type, runtime, sample | No | Trusted quality source and numeric validation; `comfortable` is only a tag | None | Likely | Used directly as quality score before output clamp | Unresolved | UI tag is not a numeric measurement; requiredness is Confirmed, but range and source remain unresolved |
| `durability` | `number`; no explicit raw-input range or guard | 40, 72, 90 | E-004: `SneakerVector.durability`; E-006/E-007 runtime; E-023 sample | Exported type, runtime, sample | No | Trusted quality source and numeric validation; `durable` is only a tag | None | Likely | Used directly as quality score before output clamp | Unresolved | UI tag is not a numeric measurement; requiredness is Confirmed, but range and source remain unresolved |
| `priceLevel` | `number`; formula uses `/ 100`, but no explicit raw-input range or guard | 30, 58, 100 | E-004: `SneakerVector.priceLevel`; E-009 runtime; E-023 sample | Exported type, runtime, sample | No | Define price source, currency basis, normalization, range, and invalid-input policy | None | Likely | Directly changes price sensitivity penalty | Unresolved | `seenPriceText` is not a Confirmed price-level source; requiredness is Confirmed, but range and source remain unresolved |

Observed examples are illustrative only. They do not establish that every
dimension's accepted range is 0 through 100. Runtime formulas use a 100-based
scale and output clamping, but there is no inspected raw-input validation for:

- negative values;
- values above 100;
- `NaN`;
- positive or negative infinity;
- missing dimensions.

The complete vector is therefore not computable from the current UI and is
Blocking as a whole.

Readiness:

```txt
Confidence: Unresolved
Blocking severity: Blocking
Implementation readiness: No
```

## 9. `budgetFit` Readiness

Confirmed Core behavior:

- `budgetFit` is a required `number` on `SneakerCandidate`. Evidence: E-004.
- `calculatePriceScore` subtracts a price-sensitivity penalty from
  `budgetFit`, then clamps the calculated score. Evidence: E-009, E-010.
- Core does not provide a default or input guard for `budgetFit`.
- Missing or nonnumeric `budgetFit` can produce `NaN`, which output clamping
  does not repair.

Current UI behavior:

- `seenPriceText` and `budgetText` are arbitrary strings. Evidence: E-013,
  E-014.
- The safe mapper intentionally does not parse either field. Evidence: E-015.
- Existing design explicitly says `budgetText` is not Core `budgetFit`.
  Evidence: E-021.

Unresolved product and validation questions:

- Is `seenPriceText` an observed price, planned price, list price, or note?
- Is `budgetText` a single amount, range, free-form note, or spending ceiling?
- Which currency is supported?
- Are tax, shipping, discounts, and regional prices included?
- Is `budgetFit` an explicit user score or a computed score?
- If computed, what is the formula and accepted range?
- What happens when one or both text fields are blank or unparsable?

The following are not approved:

- passing price strings directly to Core;
- coercing strings with a generic number parser;
- treating missing values as zero;
- assigning `1`, `100`, or another favorable default;
- calculating a provisional ratio;
- assuming Japanese yen or any other currency.

Readiness:

```txt
Confidence: Unresolved
Blocking severity: Blocking
Implementation readiness: No
```

## 10. Core Omission Behavior

| Field | Type optional? | Runtime default? | Observed omission behavior | Safe omission confirmed? | Evidence |
| --- | --- | --- | --- | --- | --- |
| `preferenceProfile` | No | No | A non-empty candidate run dereferences missing profile fields | No | E-002, E-005, E-006 |
| `sneakerId` | No | No | Missing identity is propagated into result output if the type boundary is bypassed | No | E-004, E-005 |
| `candidateVector` | No | No | Scoring dereferences all dimensions; missing vector is not tolerated | No | E-004, E-006, E-007, E-009 |
| `budgetFit` | No | No | Missing value enters arithmetic and can produce invalid numeric output | No | E-004, E-009, E-010 |

Only `ownedSneakers` and `preferredTags` have Confirmed defaults in
`recommendSneakers`. They are outside the four WEB-10C target fields and do not
resolve any WEB-10C blocker.

## 11. Project Owner Decisions

| Decision ID | Field | Required decision | Owner | Blocking severity |
| --- | --- | --- | --- | --- |
| D-001 | `preferenceProfile` | Define which diagnosis answers populate which profile fields and whether one answer may populate multiple fields | Project owner / Core design owner | Blocking |
| D-002 | `preferenceProfile` | Define unanswered handling; neutral cannot be assumed | Project owner / UI/UX owner | Blocking |
| D-003 | `preferenceProfile` | Define numeric domains, mapping magnitudes, policy values, source confidence, `userId`, version, and timestamp policy | Project owner / Core design owner | Blocking |
| D-004 | `sneakerId` | Choose caller-provided, external, deterministic local, temporary, or other identity policy | Project owner | Blocking |
| D-005 | `sneakerId` | Define uniqueness, stability, format, and collision behavior | Project owner / implementation owner | Blocking |
| D-006 | `candidateVector` | Choose the trusted source for all eight dimensions | Project owner / data sourcing owner | Blocking |
| D-007 | `candidateVector` | Define per-dimension domains, validation, normalization, and unavailable-data behavior | Core design owner | Blocking |
| D-008 | `budgetFit` | Define the meaning and source of `budgetFit` | Project owner | Blocking |
| D-009 | `budgetFit` | Define parsing, currency, amount semantics, normalization formula, domain, and invalid-input behavior | Project owner / Core design owner | Blocking |

## 12. Design Spike Required

WEB-10C does not execute these spikes. They are the minimum evidence-producing
work needed before a limited adapter design can be approved.

### SP-001

```txt
Spike ID: SP-001
Target field: preferenceProfile
Blocking severity: Blocking
Hypothesis: WEB-05 answers can contribute to a profile only after an explicit full-profile contract is approved.
Minimum verification: Define every required PreferenceProfile field, answer destination, unanswered behavior, numeric domain, validation, and metadata policy.
Public API / symbol to inspect: PreferenceProfile; RecommendSneakersInput.preferenceProfile; calculateBalancedScore; calculateAxisWeights
Files that may need change later: a future docs resolution, then future app/_lib/core-input profile adapter files
Success criteria: Every required profile property has a Confirmed source or transformation and validation rule.
Failure decision: Keep preferenceProfile Blocking and do not design the assembler.
Required before WEB-10D?: Yes
```

### SP-002

```txt
Spike ID: SP-002
Target field: sneakerId
Blocking severity: Blocking
Hypothesis: A stable candidate identity policy can be defined without inventing identity from display text.
Minimum verification: Decide source, stability scope, uniqueness, format, collision handling, and temporary-candidate behavior.
Public API / symbol to inspect: SneakerCandidate.sneakerId; RecommendationResult.sneakerId; recommendSneakers
Files that may need change later: a future docs resolution, then future identity adapter files
Success criteria: A non-empty validated ID source and deterministic failure policy are Confirmed.
Failure decision: Keep sneakerId Blocking and do not construct SneakerCandidate.
Required before WEB-10D?: Yes
```

### SP-003

```txt
Spike ID: SP-003
Target field: candidateVector
Blocking severity: Blocking
Hypothesis: One approved source can provide all eight dimensions with explicit domains and validation.
Minimum verification: Select the source; define every dimension, domain, normalization rule, missing-data behavior, and trust boundary.
Public API / symbol to inspect: SneakerVector; calculateBalancedScore; calculateTasteAxisScore; calculateQualityAxisScore; calculatePriceScore
Files that may need change later: a future docs resolution, possible data source and future vector adapter files
Success criteria: All eight dimensions have Confirmed sources, transformations, and validation.
Failure decision: Keep candidateVector Blocking; do not infer dimensions from tags or text.
Required before WEB-10D?: Yes
```

### SP-004

```txt
Spike ID: SP-004
Target field: budgetFit
Blocking severity: Blocking
Hypothesis: Product owners can define either an explicit normalized score or a deterministic price/budget conversion.
Minimum verification: Define source fields, amount semantics, currency, parsing, normalization formula, domain, and invalid/missing behavior.
Public API / symbol to inspect: SneakerCandidate.budgetFit; calculatePriceScore
Files that may need change later: a future docs resolution, then future budget adapter files
Success criteria: budgetFit has a Confirmed numeric source, transformation, validation, and failure policy.
Failure decision: Keep budgetFit Blocking; do not parse current strings into Core.
Required before WEB-10D?: Yes
```

## 13. WEB-10D Decision

Decision:

```txt
Hold and resolve remaining Core input fields
```

Reason:

- all four target fields are required by exported Core types;
- all four are read or propagated by runtime;
- none has a Confirmed safe omission path;
- none has a complete Confirmed source and transformation from the current UI;
- numeric domain and validation rules remain incomplete;
- proceeding would require dummy values, unsupported assumptions, or unresolved
  required fields.

The existence of a working Candidate Tag Adapter does not change this decision.
Tags are a separate required candidate field and do not generate profile,
identity, vector, or budget fit.

Final capability statement:

```txt
Can design Core input adapter:
No

Can implement Core input adapter:
No

Can call recommendSneakers:
No
```

Field-resolution documents and the four design spikes may proceed. A complete
or limited Core input adapter design must wait until the blocking decisions have
evidence-backed outcomes.

## 14. Work Not Implemented

WEB-10C did not:

- create a Core input assembler;
- import or call `recommendSneakers`;
- create Result UI;
- connect UI to Core;
- change `app/**` or `src/**`;
- generate `preferenceProfile`;
- generate `sneakerId`;
- generate `candidateVector`;
- generate `budgetFit`;
- create dummy, zero, neutral, empty, placeholder, random, slug, hash, or UUID
  values;
- add an API, backend, DB, storage, external data, Gemini, or OpenAI integration;
- change packages, configuration, tests, fixtures, or expected files;
- perform normal `git add`, commit, or push.

## 15. Consistency Audit

- Every Confirmed claim in the readiness tables references an Evidence ID:
  passed.
- Every referenced Evidence ID exists in the Evidence Register: passed.
- No public contract or value range is Confirmed from sample, fixture, or test
  evidence alone: passed.
- Required-by-type fields are not treated as safely omittable: passed.
- Required-at-runtime fields are not treated as safely omittable: passed.
- Output clamping is not misrepresented as raw-input validation: passed.
- `preferenceProfile` unanswered values are not assigned neutral behavior:
  passed.
- `like`, `neutral`, and `dislike` are not assigned provisional numeric values:
  passed.
- `sneakerId` is not provisionally defined by slug, hash, UUID, random value,
  array index, or placeholder: passed.
- Candidate tags are not expanded into numeric vector dimensions: passed.
- `seenPriceText` and `budgetText` are not parsed or provisionally converted:
  passed.
- `budgetFit` is not assigned zero, one, 100, or a provisional ratio: passed.
- `recommendSneakers` was not imported or called: passed.
- A Core input assembler was not created: passed.
- `app/**` and `src/**` were not changed: passed.
- Normal `git add`, commit, and push were not performed: passed.
- Unresolved required fields are not classified as Proceed: passed.

Consistency audit result:

```txt
Passed
```

Remaining inconsistencies:

```txt
None within this document. The four target fields remain unresolved by design,
and the WEB-10D decision is Hold.
```

## 16. Expected Diff

Only this file is expected:

```txt
docs/web/10C_REMAINING_CORE_INPUT_FIELDS_READINESS_CHECK.md
```
