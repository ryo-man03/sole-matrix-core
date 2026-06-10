# WEB-07: Core Input Mapping Plan / UI State Mapping

## 1. Purpose

WEB-07 observes the WEB-05 Preference Diagnosis UI state and the WEB-06 Candidate Sneaker Check UI state, then documents how those states may map to future Core input.

This document is a mapping plan only. It does not implement an adapter, call `recommendSneakers`, render recommendation results, add routes, add persistence, or connect external data.

## 2. Scope

- Observe existing UI state from WEB-05 and WEB-06.
- Observe Core public API and input types.
- Create mapping tables from UI state to possible Core candidates.
- Classify mapping confidence as `Confirmed`, `Likely`, `Unclear`, or `Not mapped yet`.
- Explicitly keep unsafe or unsupported mappings out of Core input.
- Decide whether WEB-08 can move to Core input adapter design.

## 3. Out Of Scope

- Changing `app/**`.
- Changing `src/**`.
- Changing `package.json` or `pnpm-lock.yaml`.
- Changing `docs/agent-prompts/**`.
- Changing WEB-05 or WEB-06 summary documents.
- Adding UI, routes, Client Components, `next/link`, or `useRouter`.
- Implementing Core input conversion functions.
- Calling `recommendSneakers`.
- Rendering Result List or Result Detail.
- Showing Buy Score, Personal Fit Score, `finalScore`, `finalDecision`, `demotion`, or `overlapPenalty`.
- Adding API routes, DB, login, saved history, localStorage, or sessionStorage.
- Calling Gemini, OpenAI, price APIs, inventory APIs, authenticity services, or scrapers.
- Adding purchase links.

## 4. Files Read

- `docs/web/05_PREFERENCE_DIAGNOSIS_FLOW_SUMMARY.md`
- `docs/web/06_CANDIDATE_SNEAKER_CHECK_FLOW_SUMMARY.md`
- `app/_components/PreferenceDiagnosisFlow.tsx`
- `app/_data/preferenceDiagnosisQuestions.ts`
- `app/_components/PreferenceDiagnosisSummary.tsx`
- `app/_components/DiagnosisQuestionCard.tsx`
- `app/_components/CandidateSneakerCheckFlow.tsx`
- `app/_components/CandidateBasicInfoStep.tsx`
- `app/_components/CandidateTagStep.tsx`
- `app/_components/CandidateConfirmStep.tsx`
- `app/_components/CandidateCheckSummary.tsx`
- `app/_data/candidateSneakerOptions.ts`
- `src/core/index.ts`
- `src/core/recommendSneakers.ts`
- `src/core/types.ts`
- `src/domain/profile/preferenceTypes.ts`
- `src/domain/sneaker/sneakerVector.ts`
- `src/domain/sneaker/sneakerTag.ts`
- `src/domain/recommendation/balancedScore.ts`
- `src/domain/recommendation/priceScore.ts`
- `src/domain/recommendation/tagBonus.ts`
- `src/domain/recommendation/scoreBreakdown.ts`
- `src/domain/recommendation/axes.ts`
- `src/domain/recommendation/axisWeights.ts`
- `src/domain/recommendation/decision.ts`
- `src/domain/recommendation/demotion.ts`
- `src/data/index.ts`
- `src/data/sampleProfiles.ts`
- `src/data/sampleSneakers.ts`
- `src/data/sampleOwnedSneakers.ts`

Sample, fixture, demo, and test files were read only as reference material. They are not treated as Core input specification.

## 5. WEB-05 Preference Diagnosis State Observations

WEB-05 is a UI-only question flow implemented in `PreferenceDiagnosisFlow`.

Observed state:

- `currentQuestionIndex`: zero-based index for the currently displayed diagnosis question.
- `selectedAnswerByQuestionId`: `Record<string, DiagnosisAnswerId | undefined>` keyed by diagnosis question id.
- `isSummaryVisible`: local UI flag for displaying the summary.
- `answeredCount`: derived count from `selectedAnswerByQuestionId`.
- `selectedAnswerId`: current question answer, derived from `selectedAnswerByQuestionId[currentQuestion.id]`.

Question data:

- `preferenceDiagnosisQuestions`: eight questions.
- `DiagnosisQuestion.id`: stable UI question id.
- `DiagnosisAnswerId`: `"like" | "neutral" | "dislike"`.
- Unanswered questions are allowed and shown in summary as unanswered.

The eight question ids are:

- `trusted-classic`
- `simple-daily`
- `street-presence`
- `soft-volume`
- `walking-comfort`
- `long-use`
- `sporty-mood`
- `premium-detail`

The summary displays each question and its selected answer label, or the unanswered label. It does not build a Core `PreferenceProfile`, does not call Core, and does not render recommendation results.

## 6. WEB-06 Candidate Sneaker Check State Observations

WEB-06 is a UI-only candidate input flow implemented in `CandidateSneakerCheckFlow`.

Observed state:

- `currentStep`: local step number for the three-step UI.
- `sneakerName`: required candidate name text before moving from Step 1.
- `brand`: optional brand text.
- `seenPriceText`: optional user-entered text, held as a string.
- `budgetText`: optional user-entered text, held as a string.
- `memo`: optional free text.
- `selectedTagIds`: selected `CandidateTagId[]`.
- `isSummaryVisible`: local UI flag for confirmation completion message.
- `sneakerNameError`: local validation message.
- `tagError`: local validation message.

Candidate tag data:

- `CandidateTagId` has 12 ids: `classic`, `low_tech`, `street`, `minimal`, `chunky`, `running`, `basketball`, `comfortable`, `durable`, `retro`, `heritage`, `premium`.
- `maxCandidateTagSelection` is `5`.
- Tags can be selected and unselected.
- At least one tag is required before moving from Step 2.

Important boundaries:

- `seenPriceText` is not market price, current price, official price, resale price, or Core `priceLevel`.
- `budgetText` is not Core `price`, and it is not currently converted into `budgetFit`.
- The UI does not append yen or any currency symbol automatically.
- `memo` is not defined as purchase-judgment input.
- `selectedTagIds` describe the candidate sneaker and must not be treated as user preference tags by default.
- `premium` is a feature tag id only. It must not be treated as price, premium value, resale value, or high-price prediction.
- WEB-06 does not connect to Preference Diagnosis state, Core, result rendering, market price, inventory, authenticity, or purchase links.

## 7. Core Observations

Core public export is defined in `src/core/index.ts`:

- `recommendSneakers`
- `Decision`
- `Demotion`
- `OwnedSneaker`
- `PreferenceProfile`
- `RecommendationResult`
- `RecommendSneakersInput`
- `ScoreBreakdown`
- `SneakerCandidate`
- `SneakerTag`
- `SneakerVector`

`recommendSneakers(input: RecommendSneakersInput)` expects:

- `preferenceProfile: PreferenceProfile`
- `candidates: SneakerCandidate[]`
- `ownedSneakers?: OwnedSneaker[]`
- `preferredTags?: SneakerTag[]`

`PreferenceProfile` contains:

- `userId`
- `vector`: `culture`, `styleFit`, `simplicity`, `street`, `volume`, `comfort`, `durability`
- `policy`: `priceSensitivity`, `overlapSensitivity`, `explorationTolerance`
- `axisImportance`: `culture`, `styleFit`, `simplicity`, `street`, `volume`, `comfort`, `durability`
- `sourceConfidence`: `diagnosis`, `ownedSneakers`, `wantedSneakers`, `feedback`
- `profileVersion`
- `updatedAt`

`SneakerCandidate` contains:

- `sneakerId`
- `name`
- `vector`: `culture`, `styleFit`, `simplicity`, `street`, `volume`, `comfort`, `durability`, `priceLevel`
- `tags: SneakerTag[]`
- `budgetFit`

`SneakerTag` contains:

- `classic`
- `low_tech`
- `canvas`
- `minimal`
- `street`
- `chunky`
- `basketball`
- `running`
- `comfortable`
- `durable`
- `retro`
- `collab`
- `trail`
- `outdoor`
- `premium`
- `heritage`

Core scoring uses:

- User preference vector and candidate vector for taste-axis distance.
- Candidate `comfort` and `durability` values for quality scores.
- Candidate `tags` and input `preferredTags` for `tagBonus`.
- `priceSensitivity`, candidate `priceLevel`, and candidate `budgetFit` for `priceScore`.
- `ownedSneakers` and `overlapSensitivity` for overlap penalty.

Core currently does not contain:

- Candidate brand field.
- User-entered seen price text.
- User-entered budget text.
- Candidate memo field.
- Market price, inventory, authenticity, purchase URL, or external seller data.
- A UI adapter from diagnosis answers to `PreferenceProfile`.
- A UI adapter from candidate text fields to `SneakerCandidate.vector`, `priceLevel`, or `budgetFit`.

## 8. Preference Diagnosis State Mapping Table

| Area | Observed implementation name | Planned normalized name | Source file | UI meaning | Core candidate | Core source / symbol | Confidence | Handling rule | Notes |
| ---- | ---------------------------- | ----------------------- | ----------- | ---------- | -------------- | -------------------- | ---------- | ------------- | ----- |
| Preference Diagnosis | `currentQuestionIndex` | `diagnosisCurrentQuestionIndex` | `app/_components/PreferenceDiagnosisFlow.tsx` | Current UI question position | Not found | - | Not mapped yet | Keep UI-only | Navigation state has no Core meaning. |
| Preference Diagnosis | `selectedAnswerByQuestionId` | `diagnosisAnswersByQuestionId` | `app/_components/PreferenceDiagnosisFlow.tsx` | Answer map keyed by diagnosis question id | Possible source for `PreferenceProfile` | `src/domain/profile/preferenceTypes.ts` `PreferenceProfile` | Unclear | Do not pass directly; design adapter rules later | The map stores answer ids, not numeric vectors or policy values. |
| Preference Diagnosis | `isSummaryVisible` | `diagnosisSummaryVisible` | `app/_components/PreferenceDiagnosisFlow.tsx` | Summary display flag | Not found | - | Not mapped yet | Keep UI-only | Presentation state only. |
| Preference Diagnosis | `answeredCount` | `diagnosisAnsweredCount` | `app/_components/PreferenceDiagnosisFlow.tsx` | Progress count | Not found | - | Not mapped yet | Keep UI-only | Derived UI progress. |
| Preference Diagnosis Answer | `DiagnosisAnswerId` (`like`, `neutral`, `dislike`) | `diagnosisAnswerPreferenceLevel` | `app/_data/preferenceDiagnosisQuestions.ts` | User's sentiment for each question | Possible numeric profile signal | `PreferenceProfile.vector`, `PreferenceProfile.axisImportance`, `PreferenceProfile.policy` | Unclear | Define scale and per-question rules before conversion | Core has no answer enum. Unanswered state also needs an explicit rule. |
| Preference Diagnosis Question | `trusted-classic` | `classicHeritagePreference` | `app/_data/preferenceDiagnosisQuestions.ts` | Preference for trusted classic / heritage feel | `vector.culture`, `preferredTags`, maybe `axisImportance.culture` | `PreferenceProfile.vector.culture`, `RecommendSneakersInput.preferredTags`, `SneakerTag` | Likely | Consider adapter design, but do not mark direct | Could relate to `classic`/`heritage`; numeric conversion is not defined. |
| Preference Diagnosis Question | `simple-daily` | `simpleDailyPreference` | `app/_data/preferenceDiagnosisQuestions.ts` | Preference for simple everyday styling | `vector.simplicity`, `vector.styleFit`, `preferredTags` | `PreferenceProfile.vector.simplicity`, `PreferenceProfile.vector.styleFit`, `SneakerTag` | Likely | Consider adapter design with explicit rules | Could relate to `minimal`/`low_tech`; exact weighting is not defined. |
| Preference Diagnosis Question | `street-presence` | `streetPresencePreference` | `app/_data/preferenceDiagnosisQuestions.ts` | Preference for street presence | `vector.street`, `preferredTags` | `PreferenceProfile.vector.street`, `SneakerTag.street` | Likely | Consider adapter design with explicit rules | Direction is close, but answer-to-number scale is absent. |
| Preference Diagnosis Question | `soft-volume` | `volumePreference` | `app/_data/preferenceDiagnosisQuestions.ts` | Preference for volume / chunky shape | `vector.volume`, `preferredTags` | `PreferenceProfile.vector.volume`, `SneakerTag.chunky` | Likely | Consider adapter design with explicit rules | Direction is close, but answer-to-number scale is absent. |
| Preference Diagnosis Question | `walking-comfort` | `comfortImportancePreference` | `app/_data/preferenceDiagnosisQuestions.ts` | Importance of walking comfort | `axisImportance.comfort`, maybe `vector.comfort` | `PreferenceProfile.axisImportance.comfort`, `PreferenceProfile.vector.comfort` | Unclear | Reconfirm before adapter implementation | Core scoring uses candidate comfort directly; profile comfort is currently not used by `calculateBalancedScore`. |
| Preference Diagnosis Question | `long-use` | `durabilityImportancePreference` | `app/_data/preferenceDiagnosisQuestions.ts` | Importance of long-term use / durability | `axisImportance.durability`, maybe `vector.durability` | `PreferenceProfile.axisImportance.durability`, `PreferenceProfile.vector.durability` | Unclear | Reconfirm before adapter implementation | Core scoring uses candidate durability directly; profile durability is currently not used by `calculateBalancedScore`. |
| Preference Diagnosis Question | `sporty-mood` | `sportyMoodPreference` | `app/_data/preferenceDiagnosisQuestions.ts` | Preference for sporty / running mood | `preferredTags`, maybe `vector.styleFit` or `vector.street` | `RecommendSneakersInput.preferredTags`, `SneakerTag.running` | Unclear | Reconfirm before adapter implementation | The UI meaning is a mood; Core has tags and numeric axes but no sporty axis. |
| Preference Diagnosis Question | `premium-detail` | `premiumDetailPreference` | `app/_data/preferenceDiagnosisQuestions.ts` | Preference for premium detail / special feel | `preferredTags`, maybe `vector.culture` | `RecommendSneakersInput.preferredTags`, `SneakerTag.premium` | Likely | Consider adapter design with explicit non-price rule | Must not become price or resale preference. |
| Preference Diagnosis Summary | `PreferenceDiagnosisSummary` props | `diagnosisSummaryItems` | `app/_components/PreferenceDiagnosisSummary.tsx` | UI-only review of answers | Not found | - | Not mapped yet | Keep UI-only | Summary display is not Core input. |

## 9. Candidate Sneaker Check State Mapping Table

| Area | Observed implementation name | Planned normalized name | Source file | UI meaning | Core candidate | Core source / symbol | Confidence | Handling rule | Notes |
| ---- | ---------------------------- | ----------------------- | ----------- | ---------- | -------------- | -------------------- | ---------- | ------------- | ----- |
| Candidate Flow | `currentStep` | `candidateCurrentStep` | `app/_components/CandidateSneakerCheckFlow.tsx` | Current Candidate UI step | Not found | - | Not mapped yet | Keep UI-only | Navigation state only. |
| Candidate Basic Info | `sneakerName` | `candidateName` | `app/_components/CandidateSneakerCheckFlow.tsx` | User-entered sneaker name | `SneakerCandidate.name` | `src/domain/sneaker/sneakerVector.ts` `SneakerCandidate.name` | Confirmed | Adapter may map trimmed text to `name` | Core still also requires `sneakerId`, `vector`, `tags`, and `budgetFit`. |
| Candidate Basic Info | `brand` | `candidateBrand` | `app/_components/CandidateSneakerCheckFlow.tsx` | Optional brand text | Not found | - | Not mapped yet | Keep UI-only or use only for display until Core adds field | Core has no candidate brand property. |
| Candidate Basic Info | `seenPriceText` | `candidateSeenPriceText` | `app/_components/CandidateSneakerCheckFlow.tsx` | User-entered seen amount / planned amount text | Not found | - | Not mapped yet | Do not convert to Core price fields in WEB-08 unless separately designed | It is explicitly not market price or Core `priceLevel`. |
| Candidate Basic Info | `budgetText` | `candidateBudgetText` | `app/_components/CandidateSneakerCheckFlow.tsx` | User-entered budget text | Possible `budgetFit`, but not direct | `SneakerCandidate.budgetFit`, `calculatePriceScore` | Unclear | Reconfirm numeric conversion rules before use | Core expects a 0-100 fit score, not a raw text amount. |
| Candidate Basic Info | `memo` | `candidateMemo` | `app/_components/CandidateSneakerCheckFlow.tsx` | User memo | Not found | - | Not mapped yet | Keep UI-only | Do not use for purchase judgment without a later design. |
| Candidate Tags | `selectedTagIds` | `candidateTagIds` | `app/_components/CandidateSneakerCheckFlow.tsx` | Candidate feature tags selected by user | `SneakerCandidate.tags` | `src/domain/sneaker/sneakerVector.ts` `SneakerCandidate.tags`; `src/domain/sneaker/sneakerTag.ts` `SneakerTag` | Confirmed | Adapter may map only to candidate `tags`, not to `preferredTags` | Current `CandidateTagId` values are all valid `SneakerTag` values. |
| Candidate Tags | `CandidateTagId.classic` | `candidateTagClassic` | `app/_data/candidateSneakerOptions.ts` | Classic feature tag | `SneakerTag.classic` | `src/domain/sneaker/sneakerTag.ts` | Confirmed | Preserve as feature tag | Candidate tag only. |
| Candidate Tags | `CandidateTagId.low_tech` | `candidateTagLowTech` | `app/_data/candidateSneakerOptions.ts` | Low-tech / simple construction feature tag | `SneakerTag.low_tech` | `src/domain/sneaker/sneakerTag.ts` | Confirmed | Preserve as feature tag | Candidate tag only. |
| Candidate Tags | `CandidateTagId.street` | `candidateTagStreet` | `app/_data/candidateSneakerOptions.ts` | Street feature tag | `SneakerTag.street` | `src/domain/sneaker/sneakerTag.ts` | Confirmed | Preserve as feature tag | Candidate tag only. |
| Candidate Tags | `CandidateTagId.minimal` | `candidateTagMinimal` | `app/_data/candidateSneakerOptions.ts` | Minimal feature tag | `SneakerTag.minimal` | `src/domain/sneaker/sneakerTag.ts` | Confirmed | Preserve as feature tag | Candidate tag only. |
| Candidate Tags | `CandidateTagId.chunky` | `candidateTagChunky` | `app/_data/candidateSneakerOptions.ts` | Chunky / volume feature tag | `SneakerTag.chunky` | `src/domain/sneaker/sneakerTag.ts` | Confirmed | Preserve as feature tag | Candidate tag only. |
| Candidate Tags | `CandidateTagId.running` | `candidateTagRunning` | `app/_data/candidateSneakerOptions.ts` | Running-style feature tag | `SneakerTag.running` | `src/domain/sneaker/sneakerTag.ts` | Confirmed | Preserve as feature tag | Candidate tag only. |
| Candidate Tags | `CandidateTagId.basketball` | `candidateTagBasketball` | `app/_data/candidateSneakerOptions.ts` | Basketball-style feature tag | `SneakerTag.basketball` | `src/domain/sneaker/sneakerTag.ts` | Confirmed | Preserve as feature tag | Candidate tag only. |
| Candidate Tags | `CandidateTagId.comfortable` | `candidateTagComfortable` | `app/_data/candidateSneakerOptions.ts` | Comfortable feature tag | `SneakerTag.comfortable` | `src/domain/sneaker/sneakerTag.ts` | Confirmed | Preserve as feature tag | This is a tag, not `vector.comfort`. |
| Candidate Tags | `CandidateTagId.durable` | `candidateTagDurable` | `app/_data/candidateSneakerOptions.ts` | Durable feature tag | `SneakerTag.durable` | `src/domain/sneaker/sneakerTag.ts` | Confirmed | Preserve as feature tag | This is a tag, not `vector.durability`. |
| Candidate Tags | `CandidateTagId.retro` | `candidateTagRetro` | `app/_data/candidateSneakerOptions.ts` | Retro feature tag | `SneakerTag.retro` | `src/domain/sneaker/sneakerTag.ts` | Confirmed | Preserve as feature tag | Candidate tag only. |
| Candidate Tags | `CandidateTagId.heritage` | `candidateTagHeritage` | `app/_data/candidateSneakerOptions.ts` | Heritage feature tag | `SneakerTag.heritage` | `src/domain/sneaker/sneakerTag.ts` | Confirmed | Preserve as feature tag | Candidate tag only. |
| Candidate Tags | `CandidateTagId.premium` | `candidateTagPremium` | `app/_data/candidateSneakerOptions.ts` | Premium feature tag | `SneakerTag.premium` | `src/domain/sneaker/sneakerTag.ts` | Confirmed | Preserve as feature tag only | Must not imply high price, resale value, or premium market value. |
| Candidate Validation | `sneakerNameError` | `candidateNameError` | `app/_components/CandidateSneakerCheckFlow.tsx` | Local validation message | Not found | - | Not mapped yet | Keep UI-only | Error text is not Core input. |
| Candidate Validation | `tagError` | `candidateTagError` | `app/_components/CandidateSneakerCheckFlow.tsx` | Local validation message | Not found | - | Not mapped yet | Keep UI-only | Error text is not Core input. |
| Candidate Confirmation | `isSummaryVisible` | `candidateSummaryVisible` | `app/_components/CandidateSneakerCheckFlow.tsx` | Confirmation completion message flag | Not found | - | Not mapped yet | Keep UI-only | Presentation state only. |
| Candidate Summary | `CandidateCheckSummary` props | `candidateSummaryItems` | `app/_components/CandidateCheckSummary.tsx` | UI-only review of Candidate input | Not found | - | Not mapped yet | Keep UI-only | Summary display is not Core input. |
| Candidate Core Requirement | No UI field | `candidateSneakerId` | - | Stable candidate id needed by Core | `SneakerCandidate.sneakerId` | `src/domain/sneaker/sneakerVector.ts` | Not mapped yet | Design id strategy later | Do not invent field in WEB-07. |
| Candidate Core Requirement | No UI field | `candidateVector` | - | Numeric candidate characteristics | `SneakerCandidate.vector` | `src/domain/sneaker/sneakerVector.ts` | Not mapped yet | Requires separate design | Current UI tags/text do not produce numeric vector. |
| Candidate Core Requirement | No UI field | `candidatePriceLevel` | - | Numeric price level | `SneakerVector.priceLevel` | `src/domain/sneaker/sneakerVector.ts`; `priceScore.ts` | Not mapped yet | Requires separate design | Do not derive from `seenPriceText` in this plan. |
| Candidate Core Requirement | No UI field | `candidateBudgetFit` | - | Numeric 0-100 budget fit | `SneakerCandidate.budgetFit` | `src/domain/sneaker/sneakerVector.ts`; `priceScore.ts` | Not mapped yet | Requires separate design | Raw budget text is not enough. |

## 10. Mapping Confidence Classification

`Confirmed`:

- Core public API or implementation has a clear corresponding input.
- UI meaning and Core meaning match.
- The mapping does not rely only on sample, fixture, demo, or test data.
- A future adapter can convert the value without changing its meaning.

`Likely`:

- Core has a close candidate.
- UI meaning is near the Core meaning but not a full direct match.
- A specific conversion rule is still required.

`Unclear`:

- Core has a similar concept, but meaning is ambiguous.
- Mapping may lose information or over-transform the UI state.
- WEB-08 must revisit the design before implementation.

`Not mapped yet`:

- No Core-side candidate is found.
- The state is UI-only.
- Passing it to Core would change its meaning.
- A later phase must decide whether to keep it, transform it, or add Core support.

## 11. Confirmed Mapping List

- `sneakerName` -> `SneakerCandidate.name`
- `selectedTagIds` -> `SneakerCandidate.tags`
- `CandidateTagId.classic` -> `SneakerTag.classic`
- `CandidateTagId.low_tech` -> `SneakerTag.low_tech`
- `CandidateTagId.street` -> `SneakerTag.street`
- `CandidateTagId.minimal` -> `SneakerTag.minimal`
- `CandidateTagId.chunky` -> `SneakerTag.chunky`
- `CandidateTagId.running` -> `SneakerTag.running`
- `CandidateTagId.basketball` -> `SneakerTag.basketball`
- `CandidateTagId.comfortable` -> `SneakerTag.comfortable`
- `CandidateTagId.durable` -> `SneakerTag.durable`
- `CandidateTagId.retro` -> `SneakerTag.retro`
- `CandidateTagId.heritage` -> `SneakerTag.heritage`
- `CandidateTagId.premium` -> `SneakerTag.premium`

Confirmed Candidate tag mappings are feature tags only. They are not user preference tags, price signals, resale signals, or authenticity signals.

## 12. Likely Mapping List

- `trusted-classic` answer -> `PreferenceProfile.vector.culture` and/or `preferredTags` such as `classic` / `heritage`.
- `simple-daily` answer -> `PreferenceProfile.vector.simplicity`, `PreferenceProfile.vector.styleFit`, and/or `preferredTags` such as `minimal` / `low_tech`.
- `street-presence` answer -> `PreferenceProfile.vector.street` and/or `preferredTags` such as `street`.
- `soft-volume` answer -> `PreferenceProfile.vector.volume` and/or `preferredTags` such as `chunky`.
- `premium-detail` answer -> `preferredTags` such as `premium`, with a strict non-price interpretation.

These mappings require explicit answer-to-number and answer-to-tag rules before implementation.

## 13. Unclear Mapping List

- `selectedAnswerByQuestionId` as a whole -> `PreferenceProfile`: the structure is a UI answer map, not a Core profile.
- `DiagnosisAnswerId` -> numeric Core values: no scale has been defined for `like`, `neutral`, `dislike`, or unanswered.
- `walking-comfort` answer -> comfort-related Core fields: Core has `axisImportance.comfort` and `vector.comfort`, but scoring currently uses candidate comfort directly for `comfortScore`.
- `long-use` answer -> durability-related Core fields: Core has `axisImportance.durability` and `vector.durability`, but scoring currently uses candidate durability directly for `durabilityScore`.
- `sporty-mood` answer -> `preferredTags` or numeric profile axes: Core has `running`, but no sporty mood axis.
- `budgetText` -> `budgetFit`: Core expects a numeric fit score, not raw text.

## 14. Not Mapped Yet List

- Preference Diagnosis `currentQuestionIndex`
- Preference Diagnosis `isSummaryVisible`
- Preference Diagnosis `answeredCount`
- Preference Diagnosis summary display props
- Candidate `currentStep`
- Candidate `brand`
- Candidate `seenPriceText`
- Candidate `memo`
- Candidate `sneakerNameError`
- Candidate `tagError`
- Candidate `isSummaryVisible`
- Candidate summary display props
- Core-required candidate `sneakerId`
- Core-required candidate `vector`
- Core-required candidate `priceLevel`
- Core-required candidate `budgetFit` when considered independently from raw `budgetText`
- Any market price, inventory, authenticity, purchase URL, seller, or DB field

## 15. Handling Unmappable Items

- Keep UI-only state out of Core input.
- Do not create fake Core fields to make the table look complete.
- Do not map `seenPriceText` to market price or `priceLevel`.
- Do not map `budgetText` to `budgetFit` until a numeric conversion rule exists.
- Do not map `memo` to purchase judgment.
- Do not map Candidate `selectedTagIds` to `preferredTags`.
- Do not treat `premium` as high price, resale value, or premium market prediction.
- Leave missing Core requirements as `Not mapped yet`.
- Treat `Unclear` and `Not mapped yet` entries as design inputs, not implementation approval.

## 16. Sample / Fixture / Test Misuse Policy

Sample, fixture, demo, and test files may illustrate current usage, but they must not be used as the sole authority for Core input specification.

Specifically:

- `src/data/sampleProfiles.ts` shows possible `PreferenceProfile` values and sample `preferredTags`, but it does not define how WEB-05 answers should become a profile.
- `src/data/sampleSneakers.ts` shows possible `SneakerCandidate` values, but it does not define how WEB-06 candidate text should become numeric vectors.
- Fixture and test data verify expected Core behavior for known inputs, but they do not authorize a UI adapter mapping by themselves.
- Explanation, AI, and demo vocabulary must not be treated as Core input fields.

## 17. WEB-08 May Consider

- Designing a pure adapter function for Confirmed mappings only.
- Mapping trimmed `sneakerName` to `SneakerCandidate.name`.
- Mapping `selectedTagIds` to `SneakerCandidate.tags`.
- Designing validation that prevents `selectedTagIds` from being treated as `preferredTags`.
- Designing adapter unit tests around allowed and disallowed mappings.
- Designing an input preview before any `recommendSneakers` execution.
- Drafting, but not blindly implementing, rules for Likely Preference Diagnosis mappings.

## 18. WEB-08 Should Still Treat With Caution Or Avoid

Still cautious:

- Building a full `PreferenceProfile` from WEB-05 answers.
- Converting `like`, `neutral`, `dislike`, and unanswered states into numbers.
- Converting `budgetText` into `budgetFit`.
- Deriving `priceLevel` from `seenPriceText`.
- Inferring candidate numeric vector values from feature tags.
- Calling `recommendSneakers`.
- Rendering Result List or Result Detail.
- Showing `finalDecision`, Buy Score, Personal Fit Score, or `finalScore`.

Still forbidden:

- External price API.
- Inventory lookup.
- Authenticity judgment.
- Purchase links.
- DB.
- Login.
- Saved history.
- Market price scraping.

## 19. WEB-08 Decision

Decision:

- Proceed to WEB-08 with caution

Rationale:

- This is a docs-only mapping plan.
- WEB-05 state was observed.
- WEB-06 state was observed.
- Core public API and input types were observed.
- Confirmed / Likely / Unclear / Not mapped yet categories are separated.
- `Not mapped yet` is explicitly allowed.
- Sample, fixture, demo, and test data were not used as sole proof for `Confirmed`.
- `recommendSneakers` was not executed.
- Result rendering was not implemented.
- `app/**`, `src/**`, `package.json`, `pnpm-lock.yaml`, and `docs/agent-prompts/**` were not changed.

The caution remains because Preference Diagnosis to `PreferenceProfile`, candidate text to numeric vector, and budget/price conversion are not yet safe to implement directly.

## 20. Risks And Open Questions

- How should `like`, `neutral`, `dislike`, and unanswered answers map to numeric values?
- Should unanswered diagnosis questions be omitted, assigned neutral values, or reduce `sourceConfidence.diagnosis`?
- Should Preference Diagnosis generate `preferredTags`, `PreferenceProfile.vector`, `axisImportance`, or all of them?
- How should `walking-comfort` and `long-use` interact with quality scoring when Core currently uses candidate quality values directly?
- What should generate `PreferenceProfile.userId`, `profileVersion`, and `updatedAt` without persistence?
- What should generate `SneakerCandidate.sneakerId` for one-off UI-entered candidates?
- Can candidate tags safely seed a numeric candidate vector, or should vector values require a separate model/data source?
- Is `budgetText` intended to become a raw amount, a range, or a user-only note?
- Should `brand` remain UI-only, or should Core eventually support it?
- Should `memo` ever influence recommendation, or remain display-only?

## 21. Verification Command Results

Initial status before work:

```txt
git status --short --untracked-files=all
<no output>
```

Final verification:

```txt
pnpm test
passed
Test Files 11 passed
Tests 63 passed

pnpm typecheck
passed

pnpm web:build
passed
Route (app)
- /
- /_not-found

git status --short --untracked-files=all
 A docs/web/07_CORE_INPUT_MAPPING_PLAN.md

git diff --stat
docs/web/07_CORE_INPUT_MAPPING_PLAN.md | 486 +++++++++++++++++++++++++++++++++
1 file changed, 486 insertions(+)

git diff --name-status
A docs/web/07_CORE_INPUT_MAPPING_PLAN.md
```

## 22. Git Diff Summary

Expected diff:

```txt
A docs/web/07_CORE_INPUT_MAPPING_PLAN.md
```

No changes are expected under `app/**`, `src/**`, `package.json`, `pnpm-lock.yaml`, `docs/agent-prompts/**`, or prior WEB summary files.
