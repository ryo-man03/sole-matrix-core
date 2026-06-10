# WEB-05: Preference Diagnosis Question Flow UI Summary

## 1. Purpose

WEB-05 adds a UI-only Preference Diagnosis question flow on top of the existing WEB-04 Home shell. It lets the user move through eight lightweight preference questions before any candidate sneaker input, recommendation execution, API route, DB work, or external API integration.

## 2. Implemented Scope

- Added a Preference Diagnosis Flow section to the Home page.
- Added an 8-question flow with one question shown at a time.
- Added three answer buttons for every question: `好き`, `普通`, `苦手`.
- Added `Question 1 / 8` style progress text and a progress bar.
- Added `前へ` and `次へ` navigation inside the same page.
- Allows moving forward even when the current question is unanswered.
- Keeps the final `診断内容を確認する` action available even if some questions are unanswered.
- Shows quiet helper text when the current question is unanswered.
- Preserves answers when moving backward and forward.
- Added a UI-only diagnosis summary after the final question.
- Displays unanswered entries as `未回答` in the summary.

## 3. Added Or Changed Files

- `app/page.tsx`
- `app/globals.css`
- `app/_components/PreferenceDiagnosisFlow.tsx`
- `app/_components/DiagnosisQuestionCard.tsx`
- `app/_components/DiagnosisAnswerButtonGroup.tsx`
- `app/_components/DiagnosisProgress.tsx`
- `app/_components/PreferenceDiagnosisSummary.tsx`
- `app/_data/preferenceDiagnosisQuestions.ts`
- `docs/web/05_PREFERENCE_DIAGNOSIS_FLOW_SUMMARY.md`

## 4. Flow Structure

The flow is:

1. Preference Diagnosis intro
2. Question 1 through Question 8
3. Optional answer selection per question
4. Back and next movement within local UI state
5. Final confirmation action
6. UI-only summary

Only one question card is rendered at a time. The eight questions are not displayed as a single long form.

## 5. Question UI

Each question has:

- A stable `id`
- A user-facing question
- Short helper text
- Three shared answer options

The question data is UI-only. It does not import Core types and does not produce a formal PreferenceProfile.

## 6. Answer Handling

Answers are held in local client state inside `PreferenceDiagnosisFlow`.

State used:

- `currentQuestionIndex`
- `selectedAnswerByQuestionId`
- `isSummaryVisible`

The selected answer can be changed at any time. Unanswered questions are also allowed. WEB-05 does not create a Core-ready PreferenceProfile, so unanswered state is preserved as UI state and surfaced in the summary instead of blocking progress.

Answer state is conveyed with text, border treatment, and `aria-pressed`, not color alone.

## 7. Summary Handling

The summary lists every question with either its selected answer or `未回答`. The summary is explicitly labeled as `UI-only diagnosis summary` and explains that the result is not used for purchase judgment yet.

The summary does not show `finalScore`, `finalDecision`, `demotion`, Buy Score, Personal Fit Score, Core recommendation output, sneaker recommendations, purchase judgment, prices, inventory, authenticity, resale premiums, or purchase links.

## 8. Client Component Scope

`"use client"` was added only to:

- `app/_components/PreferenceDiagnosisFlow.tsx`

`app/page.tsx` and `app/layout.tsx` remain Server Components. The AppShell, Header, and MainContainer were not converted to Client Components.

## 9. Boundaries Preserved

Not implemented in WEB-05:

- Preference Tag Selector
- Tag chips
- `selectedTagIds`
- `maxSelectionCount`
- `recommendSneakers`
- Core Recommendation Integration
- Candidate Sneaker Check
- Result List
- Result Detail
- API Route
- DB
- Gemini API
- OpenAI API
- External price API
- Scraping
- Login, saved history, my page, checkout, or purchase links
- localStorage or URL query persistence

No `src/**` files were changed. `package.json` and `pnpm-lock.yaml` were not changed.

## 10. `git add -N` Note

`git add -N` is only for diff visibility of new files. It is intent-to-add state for review, not normal staging for commit.

Before committing, use normal `git add` only for the files that should be included.

## 11. Validation

Run after implementation:

- `pnpm test`
- `pnpm typecheck`
- `pnpm web:build`
- `git status --short --untracked-files=all`
- `git diff --stat`
- `git diff --name-status`
- `Get-ChildItem app -Recurse -Include *.tsx | Where-Object { $_.FullName -notlike "*ClientImportSmoke.tsx" } | Select-String -Pattern '["'']use client["'']'`
- `Get-ChildItem app -Recurse -Include *.tsx | Where-Object { $_.FullName -notlike "*ClientImportSmoke.tsx" } | Select-String -Pattern "next/link|useRouter|router\.|recommendSneakers|sampleSneakers|finalScore|finalDecision|demotion"`

## 12. Decision For WEB-06

Decision: Proceed to WEB-06 Candidate Sneaker Check Flow if validation remains green.

The WEB-05 scope is intentionally limited to a question flow UI and local answer summary.
