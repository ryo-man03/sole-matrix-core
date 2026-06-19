# WEB-10A.1: Candidate Tag Mapping Resolution

## 1. Purpose

This document resolves the Candidate Check UI `candidateTagIds` boundary in two
separate gates:

- Gate A1: Candidate tag validation / normalization adapter.
- Gate A2: UI tag to Core tag mapping adapter.

This is a design and evidence-resolution document only. It does not implement a
Candidate Tag Adapter, change TypeScript types, add mapping constants, assemble
Core input, call `recommendSneakers`, or change UI behavior.

Core input assembly remains Not ready. `recommendSneakers` integration remains
Not ready.

## 2. Scope And Non-Scope

In scope:

- Enumerate every currently selectable Candidate UI tag.
- Enumerate the complete explicit Core tag universe.
- Resolve UI-to-Core mapping confidence and cardinality.
- Define validation, normalization, duplicate, empty-selection, and ordering
  contracts for a future adapter.
- Evaluate Gate A1 and Gate A2 independently.
- Record decisions that still require a project or UI/UX owner.

Out of scope:

- Candidate Tag Adapter implementation.
- TypeScript type or constant changes.
- Changes to WEB-08 mapper behavior.
- Core input assembly.
- `recommendSneakers` execution.
- Result UI, API, backend, DB, persistence, or external data.
- Candidate vector, `sneakerId`, `budgetFit`, or `PreferenceProfile`
  generation.

## 3. Evidence Snapshot

```txt
Expected baseline revision: 762e064
Actual repository revision: 762e0646bb029f774cabbb117c0b4c4df7acf323
Repository branch: main
Investigation timestamp: 2026-06-19T16:21:53+09:00
Working tree status at investigation start: clean; git status --short --untracked-files=all returned no output
UI tag source: app/_data/candidateSneakerOptions.ts (CandidateTagId, candidateSneakerTagOptions, maxCandidateTagSelection)
Core tag source: src/domain/sneaker/sneakerTag.ts (SneakerTag)
Documents reviewed: docs/web/07_CORE_INPUT_MAPPING_PLAN.md; docs/web/08_CORE_INPUT_MAPPER_SUMMARY.md; docs/web/09_CORE_RECOMMENDATION_DRY_RUN_SUMMARY.md; docs/web/10A_CORE_INPUT_RESOLUTION_READINESS_PLAN.md; docs/web/06_CANDIDATE_SNEAKER_CHECK_FLOW_SUMMARY.md; docs/ui/02_CANDIDATE_SNEAKER_CHECK_SPEC.md
Implementation files reviewed: app/_lib/core-input/types.ts; app/_lib/core-input/candidateInputMapper.ts; app/_lib/core-input/candidateInputMapper.test.ts; app/_lib/core-input/coreRecommendationDryRun.ts; app/_components/CandidateSneakerCheckFlow.tsx; app/_components/CandidateTagStep.tsx; app/_components/CandidateTagChip.tsx; app/_data/candidateSneakerOptions.ts; src/core/index.ts; src/core/types.ts; src/core/recommendSneakers.ts; src/domain/sneaker/sneakerTag.ts; src/domain/sneaker/sneakerVector.ts; src/domain/recommendation/tagBonus.ts; src/domain/recommendation/overlapPenalty.ts; src/domain/recommendation/balancedScore.ts; src/data/**
Figma direct access: Not available
```

The actual revision matches the expected baseline. No baseline exception is
required.

## 4. Confidence Definitions

`Confirmed`:

- Supported by the target revision's exported type, constant, runtime behavior,
  formal project document, or an owner-approved specification.

`Proposed`:

- A reasonable design choice that is not yet an approved mapping or formal
  product rule.

`Unresolved`:

- Evidence conflicts, a required mapping basis is missing, or an owner decision
  is still required.

`Rejected`:

- The mapping changes meaning, has no Core counterpart, or is unsafe for this
  adapter.

`Out of scope`:

- Valid information that is not part of the Candidate Tag Adapter.

## 5. Evidence Register

| Evidence ID | Claim | Evidence type | File path | Symbol / section | Summary | Conflict | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E-001 | Investigation baseline | Git revision | repository | `HEAD`, branch, status | HEAD is the expected `762e064` baseline on `main`; the working tree was clean. | No | Confirmed |
| E-002 | Current UI tag universe | UI type and constant | `app/_data/candidateSneakerOptions.ts` | `CandidateTagId`, `candidateSneakerTagOptions` | The current Candidate UI defines exactly 12 fixed tag IDs and their labels/helpers. | No | Confirmed |
| E-003 | UI selection rules | UI runtime | `app/_components/CandidateSneakerCheckFlow.tsx` | `handleNextFromTags`, `handleToggleTag` | The UI requires at least one tag, prevents duplicates through toggle semantics, preserves selection order, and limits selection to five. | No | Confirmed |
| E-004 | UI tag presentation | UI runtime | `app/_components/CandidateTagStep.tsx`, `app/_components/CandidateTagChip.tsx` | tag option rendering | Every option is selectable until the five-tag limit; selected state can be removed. | No | Confirmed |
| E-005 | Formal UI-to-internal tag table | Formal project document | `docs/ui/02_CANDIDATE_SNEAKER_CHECK_SPEC.md` | Section 6, tag display table | The specification says fixed UI tags are converted internally to `SneakerTag` and lists all 12 UI/internal values. | Label wording only | Confirmed for ID mapping |
| E-006 | Current UI label list | Formal implementation summary | `docs/web/06_CANDIDATE_SNEAKER_CHECK_FLOW_SUMMARY.md` | Section 8 | Records the 12 labels currently presented by the implemented Candidate UI. | Label wording only | Confirmed |
| E-007 | WEB-07 mapping conclusion | Formal project document | `docs/web/07_CORE_INPUT_MAPPING_PLAN.md` | Sections 9 and 11 | Records `selectedTagIds` to candidate `tags` and all 12 same-literal mappings as Confirmed feature-tag mappings. | No | Confirmed |
| E-008 | WEB-08 safe-draft boundary | Exported app type | `app/_lib/core-input/types.ts` | `CandidateInputMappingResult` | Gate input is `safeCandidateDraft.candidateTagIds: string[]`, not `SneakerTag[]`. | No | Confirmed |
| E-009 | WEB-08 filtering and order | Runtime implementation | `app/_lib/core-input/candidateInputMapper.ts` | `mapCandidateUiInputToSafeDraft` | Supported IDs are copied in input order; unsupported IDs are omitted and recorded as warnings/unsupported fields. | No | Confirmed |
| E-010 | WEB-08 behavior tests | Test | `app/_lib/core-input/candidateInputMapper.test.ts` | supported/unsupported tag tests | Tests prove supported-order preservation and unsupported-tag reporting; they do not independently define Core mapping. | No | Confirmed for mapper behavior |
| E-011 | WEB-09 boundary | Formal project document and guard | `docs/web/09_CORE_RECOMMENDATION_DRY_RUN_SUMMARY.md`, `app/_lib/core-input/coreRecommendationDryRun.ts` | safe draft / blocked reasons | UI-derived tag IDs are not yet Core tags and Core execution remains blocked. | No | Confirmed |
| E-012 | WEB-10A Gate requirements | Formal project document | `docs/web/10A_CORE_INPUT_RESOLUTION_READINESS_PLAN.md` | Sections 18, 19, and 26 | Requires exact mapping, output type, unknown, empty, duplicate, order, and unsupported-tag rules before implementation. | No | Confirmed |
| E-013 | Explicit Core tag universe | Exported domain type | `src/domain/sneaker/sneakerTag.ts` | `SneakerTag` | Core defines an explicit 16-value string-literal union. | No | Confirmed |
| E-014 | Candidate Core tag field | Exported domain type | `src/domain/sneaker/sneakerVector.ts` | `SneakerCandidate.tags` | Candidate Core input requires `tags: SneakerTag[]`. | No | Confirmed |
| E-015 | Candidate tag score usage | Runtime implementation | `src/domain/recommendation/tagBonus.ts` | `calculateTagBonus` | Each matching candidate-tag array entry contributes to match count. Duplicate entries can inflate tag bonus. | No | Confirmed |
| E-016 | Candidate tag overlap usage | Runtime implementation | `src/domain/recommendation/overlapPenalty.ts` | `calculateOverlapPenalty` | Each overlapping candidate-tag array entry contributes to overlap count. Duplicate entries can inflate overlap penalty. | No | Confirmed |
| E-017 | Core input remains incomplete | Runtime guard | `app/_lib/core-input/coreRecommendationDryRun.ts` | `requiredMissingCoreFields` | Even after tag resolution, profile, identity, vector, and budget fit remain missing. | No | Confirmed |

Evidence IDs are unique. Tests, fixtures, samples, naming similarity, and labels
are not used as the sole basis for a Confirmed mapping.

## 6. Candidate UI Tag Inventory

The current selectable implementation contains 12 tags. Selection is fixed-list,
not free text. A user may select one through five tags. The current UI toggle
logic prevents duplicate selections.

| UI tag ID | Label | Description | Selectable | Selection rule | Evidence IDs |
| --- | --- | --- | --- | --- | --- |
| `classic` | クラシック | 長く親しまれてきた雰囲気 | Yes | One of 12 fixed options; total selection 1-5 | E-002, E-003, E-004, E-006 |
| `low_tech` | シンプルな作り | 低めで飾りすぎない形 | Yes | One of 12 fixed options; total selection 1-5 | E-002, E-003, E-004, E-006 |
| `street` | ストリート感 | 街の服装になじむ存在感 | Yes | One of 12 fixed options; total selection 1-5 | E-002, E-003, E-004, E-006 |
| `minimal` | 合わせやすい | 普段の服に入れやすい | Yes | One of 12 fixed options; total selection 1-5 | E-002, E-003, E-004, E-006 |
| `chunky` | ボリューム感 | 足元にほどよい厚みがある | Yes | One of 12 fixed options; total selection 1-5 | E-002, E-003, E-004, E-006 |
| `running` | ランニング系 | 軽快でスポーティーな印象 | Yes | One of 12 fixed options; total selection 1-5 | E-002, E-003, E-004, E-006 |
| `basketball` | バスケット系 | 少し力強いスポーツ感 | Yes | One of 12 fixed options; total selection 1-5 | E-002, E-003, E-004, E-006 |
| `comfortable` | 履きやすい | 歩きやすさを期待したい | Yes | One of 12 fixed options; total selection 1-5 | E-002, E-003, E-004, E-006 |
| `durable` | 長く履けそう | 扱いやすく長く使えそう | Yes | One of 12 fixed options; total selection 1-5 | E-002, E-003, E-004, E-006 |
| `retro` | 昔っぽい雰囲気 | どこか懐かしい形や色 | Yes | One of 12 fixed options; total selection 1-5 | E-002, E-003, E-004, E-006 |
| `heritage` | 定番・歴史がある | 背景を知ると楽しい一足 | Yes | One of 12 fixed options; total selection 1-5 | E-002, E-003, E-004, E-006 |
| `premium` | 上質・高級感 | 素材や細部に特別感がある | Yes | One of 12 fixed options; total selection 1-5 | E-002, E-003, E-004, E-006 |

### 6.1 Label Evidence Conflict

The current repository labels and the older formal UI-02 display examples use
different wording for five IDs:

| UI tag ID | Current repository label | UI-02 specification label | Mapping impact | Confidence | Decision owner | Resolution mechanism |
| --- | --- | --- | --- | --- | --- | --- |
| `low_tech` | シンプルな作り | ローテク | None; internal ID is identical | Unresolved label wording | UI/UX design owner | UI/UX decision |
| `street` | ストリート感 | ストリート | None; internal ID is identical | Unresolved label wording | UI/UX design owner | UI/UX decision |
| `minimal` | 合わせやすい | シンプル | None; internal ID is identical | Unresolved label wording | UI/UX design owner | UI/UX decision |
| `retro` | 昔っぽい雰囲気 | レトロ | None; internal ID is identical | Unresolved label wording | UI/UX design owner | UI/UX decision |
| `heritage` | 定番・歴史がある | 文化背景あり | None; internal ID is identical | Unresolved label wording | UI/UX design owner | UI/UX decision |

Evidence conflict: Yes, for display wording only.

The repository is not silently harmonized with the older UI-02 document.
Because both sources use the same internal IDs, this conflict does not block
Gate A1 or Gate A2.

## 7. Core Tag Inventory

Core tag universe:

```txt
Confirmed
```

Reason:

`src/domain/sneaker/sneakerTag.ts` exports an explicit `SneakerTag` union with
16 values. This is a domain definition, not a sample, fixture, or inferred list.

| Core tag | Type source | Runtime usage | Quality impact | Omission behavior | Duplicate behavior | Evidence IDs |
| --- | --- | --- | --- | --- | --- | --- |
| `classic` | `SneakerTag` union | Tag bonus and owned-sneaker overlap matching | May change score and overlap penalty when matching data exists | No default per candidate; omission removes this match signal | Duplicate entries can be counted repeatedly | E-013, E-014, E-015, E-016 |
| `low_tech` | `SneakerTag` union | Same | Same | Same | Same | E-013, E-014, E-015, E-016 |
| `canvas` | `SneakerTag` union | Same | Same | Same | Same | E-013, E-014, E-015, E-016 |
| `minimal` | `SneakerTag` union | Same | Same | Same | Same | E-013, E-014, E-015, E-016 |
| `street` | `SneakerTag` union | Same | Same | Same | Same | E-013, E-014, E-015, E-016 |
| `chunky` | `SneakerTag` union | Same | Same | Same | Same | E-013, E-014, E-015, E-016 |
| `basketball` | `SneakerTag` union | Same | Same | Same | Same | E-013, E-014, E-015, E-016 |
| `running` | `SneakerTag` union | Same | Same | Same | Same | E-013, E-014, E-015, E-016 |
| `comfortable` | `SneakerTag` union | Same | Same | Same | Same | E-013, E-014, E-015, E-016 |
| `durable` | `SneakerTag` union | Same | Same | Same | Same | E-013, E-014, E-015, E-016 |
| `retro` | `SneakerTag` union | Same | Same | Same | Same | E-013, E-014, E-015, E-016 |
| `collab` | `SneakerTag` union | Same | Same | Same | Same | E-013, E-014, E-015, E-016 |
| `trail` | `SneakerTag` union | Same | Same | Same | Same | E-013, E-014, E-015, E-016 |
| `outdoor` | `SneakerTag` union | Same | Same | Same | Same | E-013, E-014, E-015, E-016 |
| `premium` | `SneakerTag` union | Same | Same; feature signal only, not a price signal | Same | Same | E-007, E-013, E-014, E-015, E-016 |
| `heritage` | `SneakerTag` union | Same | Same | Same | Same | E-013, E-014, E-015, E-016 |

Core-only tags not selectable in the current Candidate UI:

```txt
canvas
collab
trail
outdoor
```

Their absence from Candidate UI is intentional adapter scope, not evidence that
they are invalid Core tags.

## 8. UI Tag To Core Tag Mapping

All 12 mappings are Confirmed by the explicit UI/internal tag table, WEB-07's
formal mapping list, and the exported Core union. Mapping is based on stable IDs,
not on label similarity.

| UI tag ID | UI label | Proposed Core tag(s) | Cardinality | Evidence IDs | Rationale | Confidence | Decision owner | Resolution mechanism | Blocking issue |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `classic` | クラシック | `classic` | 1:1 | E-005, E-007, E-013 | Formal internal-tag table and Core union use the same value | Confirmed | None | None | None |
| `low_tech` | シンプルな作り | `low_tech` | 1:1 | E-005, E-007, E-013 | Formal internal-tag table and Core union use the same value | Confirmed | None | None | Label wording decision is non-blocking |
| `street` | ストリート感 | `street` | 1:1 | E-005, E-007, E-013 | Formal internal-tag table and Core union use the same value | Confirmed | None | None | Label wording decision is non-blocking |
| `minimal` | 合わせやすい | `minimal` | 1:1 | E-005, E-007, E-013 | Formal internal-tag table and Core union use the same value | Confirmed | None | None | Label wording decision is non-blocking |
| `chunky` | ボリューム感 | `chunky` | 1:1 | E-005, E-007, E-013 | Formal internal-tag table and Core union use the same value | Confirmed | None | None | None |
| `running` | ランニング系 | `running` | 1:1 | E-005, E-007, E-013 | Formal internal-tag table and Core union use the same value | Confirmed | None | None | None |
| `basketball` | バスケット系 | `basketball` | 1:1 | E-005, E-007, E-013 | Formal internal-tag table and Core union use the same value | Confirmed | None | None | None |
| `comfortable` | 履きやすい | `comfortable` | 1:1 | E-005, E-007, E-013 | Formal internal-tag table and Core union use the same value | Confirmed | None | None | None |
| `durable` | 長く履けそう | `durable` | 1:1 | E-005, E-007, E-013 | Formal internal-tag table and Core union use the same value | Confirmed | None | None | None |
| `retro` | 昔っぽい雰囲気 | `retro` | 1:1 | E-005, E-007, E-013 | Formal internal-tag table and Core union use the same value | Confirmed | None | None | Label wording decision is non-blocking |
| `heritage` | 定番・歴史がある | `heritage` | 1:1 | E-005, E-007, E-013 | Formal internal-tag table and Core union use the same value | Confirmed | None | None | Label wording decision is non-blocking |
| `premium` | 上質・高級感 | `premium` | 1:1 | E-005, E-007, E-013 | Formal internal-tag table and Core union use the same value; feature meaning is explicitly non-price | Confirmed | None | None | None |

### 8.1 Mapping Classification Summary

Confirmed mappings:

- 12.

Proposed mappings:

- 0.

Unresolved mappings:

- 0.

Rejected UI mappings:

- 0 among currently selectable UI tags.

No mapping / out of current UI scope:

- Core `canvas`, `collab`, `trail`, and `outdoor` have no Candidate UI source.
- Unknown strings have no mapping and must not be converted.

Cardinality:

- 1:1: 12.
- 1:many: 0.
- many:1: 0.
- no mapping: unknown/outside-current-UI values only.
- unresolved: 0 current UI mappings.

No one-to-many quality amplification is introduced by the resolved mapping.
Future one-to-many mapping proposals require a new evidence and score-impact
review.

## 9. Project Owner Decision Packet

No Project owner decision is required for the 12 ID mappings. They are already
Confirmed.

One non-blocking presentation decision remains:

| Decision ID | UI tag | Option A | Option B | Option C | Recommended option | Trade-off | Decision owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D-001 | `low_tech`, `street`, `minimal`, `retro`, `heritage` display wording | Keep current repository labels | Restore UI-02 specification labels | Revise both sources to a newly approved label set | No recommendation without Project owner decision | Repository labels match current implementation; UI-02 labels preserve the older design vocabulary; a new set requires coordinated copy review | UI/UX design owner | Pending |

Pending mapping decisions:

```txt
None
```

D-001 does not authorize changing UI or old documents in this task and does not
block Gate A1 or Gate A2.

## 10. WEB-08 Mapper And Candidate Tag Adapter Responsibilities

| Layer | Responsibility | Must not do |
| --- | --- | --- |
| WEB-08 mapper | Accept raw Candidate UI values; keep only IDs present in the supplied supported UI set; produce `safeCandidateDraft.candidateTagIds`; record unsupported raw IDs in warnings and unsupported fields; preserve accepted input order | Must not claim `candidateTagIds` are Core tags; must not call Core |
| Gate A1 validation / normalization adapter | Defensively verify that the safe-draft IDs still belong to the Candidate UI universe; reject invalid boundary data; remove duplicates; enforce non-empty normalized output; preserve first-occurrence order | Must not decide or perform Core mapping; must not use `known but unmapped` terminology |
| Gate A2 mapping adapter | Convert every normalized Candidate UI ID through the Confirmed 1:1 mapping; reject missing or unconfirmed mappings; produce a unique deterministic `SneakerTag[]` | Must not create vectors, budget fit, identity, profile, or complete Core input |

If an unsupported ID reaches Gate A1 after WEB-08, Gate A1 treats it as
defensive validation failure. This does not transfer WEB-08's primary raw-input
filtering responsibility to the adapter.

## 11. Gate A1: Candidate Tag Validation / Normalization Adapter

### 11.1 Contract

Input:

```txt
safeCandidateDraft.candidateTagIds
```

Output candidate:

```txt
normalized candidate UI tag IDs
```

Resolved validation policy:

- The input must be an array of Candidate UI-origin string IDs.
- Every ID must be in the 12-value supported Candidate UI set.
- A malformed value is an `invalid candidateTagId`.
- A well-formed string not recognized by the adapter is an
  `unknown candidateTagId`.
- A known Core tag that is not part of Candidate UI, such as `canvas`, is
  `candidateTagIds outside supported UI tag set`.
- Any such value at this boundary is blocked; it is not silently omitted.
- Duplicate Candidate UI IDs are removed by keeping the first occurrence.
- Output order is the first-occurrence input order.
- Empty input or an empty normalized result is blocked because Candidate UI
  requires at least one tag.
- The output remains Candidate UI tag IDs.
- No Core tag mapping or Core mapping availability decision occurs in Gate A1.

The distinction from WEB-08 is deliberate: WEB-08 warns and filters raw UI
input; Gate A1 blocks if the safe-draft invariant has already been violated.

### 11.2 Gate A1 Condition Table

| Gate A1 condition | Result | Evidence IDs | Blocking issue | Next action |
| --- | --- | --- | --- | --- |
| Input is `safeCandidateDraft.candidateTagIds` | Passed | E-008, E-011, E-012 | None | Future adapter accepts this field only |
| Values are Candidate UI-origin IDs, not Core tags | Passed | E-008, E-009, E-011 | None | Preserve boundary naming and output type |
| Unknown ID handling is defined | Passed | E-009, E-010, E-012 | None | Block at Gate A1 boundary; retain WEB-08 warning upstream |
| Invalid ID handling is defined | Passed | E-008, E-012, E-013 | None | Block malformed runtime values |
| Outside-supported-UI handling is defined | Passed | E-002, E-005, E-013 | None | Block Core-only or other non-UI IDs |
| Duplicate handling is defined | Passed | E-003, E-015, E-016 | None | Keep first occurrence and remove later duplicates |
| Output order is defined | Passed | E-003, E-009, E-010 | None | Preserve first-occurrence input order |
| Empty selection handling is defined | Passed | E-003, E-005, E-012 | None | Block empty normalized output |
| Core mapping is excluded | Passed | E-011, E-012 | None | Keep Gate A1 validation-only |
| Unit testing is possible without Core | Passed | E-008, E-009, E-010, E-012 | None | Test pure validation/normalization behavior |
| WEB-08 responsibility remains separate | Passed | E-009, E-010, E-011 | None | Treat leakage as defensive validation |

Gate A1 result:

```txt
Eligible
```

Candidate tag validation-only implementation may be possible.

This does not mean Core tag mapping is possible by Gate A1 alone. This does not
mean Core input assembly is ready. This does not mean `recommendSneakers`
integration is ready.

## 12. Gate A2: UI Tag To Core Tag Mapping Adapter

### 12.1 Contract

Input:

```txt
normalized candidate UI tag IDs
```

Output candidate:

```txt
SneakerTag[]
```

Resolved mapping policy:

- Use an explicit 12-entry mapping defined from the Confirmed table in Section
  8.
- Do not use a type assertion on raw `string[]`.
- Every normalized input ID must have a Confirmed mapping.
- `known but unmapped UI tag` is blocked.
- `UI tag with no confirmed Core tag mapping` is blocked.
- `UI tag requiring Project owner decision` is blocked.
- Current mappings are all 1:1.
- Duplicate Core outputs are removed defensively, preserving first occurrence.
- Output order follows normalized Candidate UI order.
- Core-only tags are not inserted.
- Empty output is blocked.

### 12.2 Gate A2 Condition Table

| Gate A2 condition | Result | Evidence IDs | Blocking issue | Next action |
| --- | --- | --- | --- | --- |
| Core tag universe is Confirmed | Passed | E-013 | None | Type future output as `SneakerTag[]` |
| All current UI mappings are Confirmed | Passed | E-005, E-007, E-013 | None | Implement explicit 12-entry map |
| Cardinality is Confirmed | Passed | E-005, E-007, E-013 | None | Keep all current mappings 1:1 |
| No mapping requires Project owner approval | Passed | E-005, E-007 | None | Keep D-001 label-only and non-blocking |
| Known-but-unmapped handling is defined | Passed | E-012, E-013 | None | Block |
| No-confirmed-mapping handling is defined | Passed | E-012, E-013 | None | Block |
| Duplicate Core output handling is defined | Passed | E-015, E-016 | None | De-duplicate defensively |
| Output ordering is defined | Passed | E-003, E-009 | None | Preserve normalized order |
| One-to-many score impact is evaluated | Passed | E-015, E-016 | None for current table | Current mapping has no 1:many rows |
| Mapping is not based only on naming similarity | Passed | E-005, E-007, E-013 | None | Retain formal evidence references |
| Mapping is not based only on samples/fixtures/tests | Passed | E-005, E-007, E-013 | None | Do not use `src/data/**` as authority |

Gate A2 result:

```txt
Eligible
```

## 13. Validation And Transformation Policy

### 13.1 Unknown / Invalid Candidate Tag ID

- WEB-08 raw-input behavior: unsupported strings are omitted from the safe draft
  and recorded as warnings/unsupported fields.
- Gate A1 defensive behavior: if an unsupported or malformed value is present
  in the safe draft anyway, block normalization.
- Gate A2 behavior: it must never receive such a value after successful Gate
  A1; if it does, block.

### 13.2 Empty Tag Selection

- Current UI does not allow progress with zero selected tags.
- Gate A1 blocks empty input and empty normalized output.
- Gate A2 blocks empty output.
- Empty Candidate Core tags are not treated as a safe omission.
- The likely quality effect is loss of candidate tag-bonus and overlap signals,
  but the blocking decision is grounded in the formal Candidate UI requirement,
  not in a guessed score threshold.

### 13.3 Known But Unmapped UI Tag

This term is used only in Gate A2.

Policy:

- Do not silently drop it.
- Do not continue with a warning.
- Block output until a Confirmed mapping or explicit no-mapping product decision
  exists.

There are currently no known-but-unmapped IDs among the 12 selectable UI tags.

### 13.4 One-To-Many Mapping

There are no current one-to-many mappings.

Future one-to-many mapping must not be added without:

- Formal rationale.
- Duplicate-output policy.
- Ordering policy.
- `tagBonus` and `overlapPenalty` quality-impact review.
- Project owner approval when the semantic choice is not uniquely determined.

### 13.5 Duplicate Policy

Candidate UI duplicates:

- Current UI toggle behavior prevents duplicates.
- Gate A1 still removes duplicates defensively.
- First occurrence wins.

Core output duplicates:

- Gate A2 removes duplicates defensively.
- This is required because Core counts matching array entries; duplicates can
  inflate both tag bonus and overlap penalty.

### 13.6 Output Order Policy

- Gate A1 preserves the first-occurrence order from
  `safeCandidateDraft.candidateTagIds`.
- Gate A2 preserves normalized input order.
- No alphabetical or Core-union-order sorting is introduced.
- This is deterministic and preserves the existing WEB-08/input-selection
  behavior.
- Current Core score formulas are match-count based, but deterministic ordering
  is still required for stable adapter output and tests.

## 14. Validation Contracts For Future Implementation

### 14.1 Gate A1 Validation-Only Adapter

```txt
Input:
safeCandidateDraft.candidateTagIds

Output:
normalized candidate UI tag IDs

Validation:
- input is an array
- each value is a non-empty string
- each value belongs to the supported Candidate UI tag set
- unknown, invalid, or outside-supported-UI values block
- duplicates are removed, keeping first occurrence
- output order is deterministic and preserves first occurrence
- empty input/output blocks
- no Core tag mapping occurs
- no Core input is created
```

### 14.2 Gate A2 Mapping Adapter

```txt
Input:
normalized candidate UI tag IDs

Output:
SneakerTag[]

Validation:
- Core tag universe is the exported SneakerTag union
- every input has a Confirmed 1:1 mapping
- every output is a valid Core tag
- known-but-unmapped or unconfirmed mapping blocks
- duplicate Core output is removed
- output order is deterministic and preserves normalized input order
- empty output blocks
- Core-only tags are never invented or appended
```

## 15. Blocked / Warning Policy

| Condition | Severity | Evidence IDs | Runtime effect | Quality effect | User-facing handling | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| unknown candidateTagId in raw UI input | warning at WEB-08; blocked if leaked to Gate A1 | E-009, E-010, E-012 | Raw value omitted upstream; boundary violation blocks adapter | Prevents unknown values entering Core | Generic input correction message; do not expose internal ID | Confirmed |
| invalid candidateTagId | blocked | E-008, E-012, E-013 | No normalized output | Prevents malformed data and false assertions | Ask user to reselect tags | Confirmed |
| candidateTagIds outside supported UI tag set | blocked | E-002, E-005, E-013 | No normalized output | Prevents Core-only or unapproved UI values from bypassing UI scope | Ask user to reselect supported tags | Confirmed |
| empty tag selection | blocked | E-003, E-005, E-012 | No normalized or mapped output | Candidate tag signals are absent | `特徴タグを1つ以上選択してください。` | Confirmed |
| known but unmapped UI tag | blocked | E-012, E-013 | No Core tag output | Prevents silent feature loss | Explain that the selected feature is not currently supported | Confirmed policy; no current occurrence |
| duplicate candidateTagId | warning / normalized | E-003, E-015, E-016 | Later occurrences removed | Prevents duplicate score influence | Usually no user-facing message needed; telemetry/log may record normalization | Confirmed |
| duplicate Core tag output | warning / normalized | E-015, E-016 | Later occurrences removed | Prevents tag bonus and overlap inflation | No direct user-facing message required | Confirmed |
| one-to-many mapping | unresolved for future use | E-015, E-016 | Not accepted without a new resolution | May amplify score/overlap effects | Do not expose as supported until approved | Confirmed for current absence |
| non-deterministic output order | blocked implementation defect | E-003, E-009, E-010 | Adapter output is not accepted | Score is currently count-based, but unstable output harms reproducibility | Generic retry/error handling | Confirmed |

## 16. User-Facing Wording

Internal adapter names, evidence IDs, and Gate names must not be shown directly
to users.

Confirmed existing wording:

```txt
特徴タグを1つ以上選択してください。
```

Proposed wording for future unsupported mapping states:

```txt
一部の特徴タグは現在の推薦基準に対応していません。タグを選び直してください。
特徴タグと推薦基準の対応を確認できませんでした。
```

The proposed wording is not a Figma-confirmed UI specification.

## 17. Final Gate Conclusion

```txt
Gate A1 result:
Eligible

Gate A2 result:
Eligible

Candidate Tag Adapter overall:
Mapping implementation possible

Core input assembly:
Not ready

recommendSneakers integration:
Not ready
```

Interpretation:

- A future WEB-10B1 may implement the validation/normalization and mapping
  adapter described here.
- Gate A1 eligibility alone would only permit validation-only implementation.
- Gate A2 eligibility permits mapping implementation because all 12 mappings
  and their boundary policies are resolved.
- Neither result authorizes complete `SneakerCandidate` construction.
- Required unresolved Core fields still include `preferenceProfile`,
  `sneakerId`, complete candidate vector including `priceLevel`, and
  `budgetFit`.
- No `recommendSneakers` call is authorized.

## 18. Consistency Audit

- Every current UI tag appears exactly once in the UI inventory: passed.
- Every current UI tag appears exactly once in the mapping table: passed.
- Core tag universe existence is explicitly stated: passed.
- Core tag universe is based on an exported union, not inference: passed.
- Every Confirmed mapping has Evidence IDs: passed.
- No mapping is Confirmed from naming similarity alone: passed.
- No mapping is Confirmed from sample, fixture, or test alone: passed.
- Evidence Register references are complete: passed.
- Evidence IDs are unique: passed.
- Label conflict is recorded and not silently harmonized: passed.
- Pending D-001 is not marked Approved: passed.
- D-001 does not block ID mapping eligibility: passed.
- Gate A1 and Gate A2 are separate: passed.
- Gate A1 does not use `known but unmapped` terminology: passed.
- Gate A1 does not decide Core mapping availability: passed.
- Gate A1 eligibility is not described as Core mapping, assembly, or execution
  readiness: passed.
- WEB-08 raw-input filtering and Gate A1 defensive validation are not merged:
  passed.
- Unknown, invalid, outside-supported, empty, unmapped, duplicate, one-to-many,
  and order policies are evaluated: passed.
- Duplicate score impact is evaluated against runtime: passed.
- Current one-to-many mapping count is zero: passed.
- Candidate Tag Adapter is not implemented: passed.
- Existing code and existing documents are not changed: passed.
- Core input assembly remains Not ready: passed.
- `recommendSneakers` integration remains Not ready: passed.

Consistency audit result:

```txt
Passed
```

Remaining inconsistencies:

```txt
Current repository display labels differ from the older UI-02 specification for
low_tech, street, minimal, retro, and heritage. D-001 remains Pending. The
internal IDs and Core mappings are identical, so this does not block Gate A1 or
Gate A2.
```

## 19. Files Intentionally Not Changed

- `app/**`
- `src/**`
- `package.json`
- `pnpm-lock.yaml`
- `vitest.config.ts`
- `README.md`
- `.github/**`
- `docs/web/07_CORE_INPUT_MAPPING_PLAN.md`
- `docs/web/08_CORE_INPUT_MAPPER_SUMMARY.md`
- `docs/web/09_CORE_RECOMMENDATION_DRY_RUN_SUMMARY.md`
- `docs/web/10A_CORE_INPUT_RESOLUTION_READINESS_PLAN.md`
- `docs/agent-prompts/**`

Only this document is expected in the final diff:

```txt
docs/web/10A_1_CANDIDATE_TAG_MAPPING_RESOLUTION.md
```
