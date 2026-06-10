# WEB-06: Candidate Sneaker Check Flow UI Summary

## 1. Purpose

WEB-06 adds a UI-only Candidate Sneaker Check Flow to the existing Home page. It lets the user organize one sneaker they are interested in through three steps: basic information, feature tags, and input confirmation.

## 2. Implemented Scope

- Added a same-page Candidate Check section below the Preference Diagnosis section.
- Added a 3-step input flow.
- Added Step 1 basic information fields.
- Added Step 2 feature tag chips.
- Added Step 3 input confirmation summary.
- Added back and edit movement inside the Candidate UI only.
- Kept all Candidate state as temporary local client state.

## 3. Added Or Changed Files

- `app/page.tsx`
- `app/globals.css`
- `app/_components/CandidateSneakerCheckFlow.tsx`
- `app/_components/CandidateStepIndicator.tsx`
- `app/_components/CandidateBasicInfoStep.tsx`
- `app/_components/CandidateTagStep.tsx`
- `app/_components/CandidateConfirmStep.tsx`
- `app/_components/CandidateField.tsx`
- `app/_components/CandidateTagChip.tsx`
- `app/_components/CandidateCheckSummary.tsx`
- `app/_data/candidateSneakerOptions.ts`
- `docs/web/06_CANDIDATE_SNEAKER_CHECK_FLOW_SUMMARY.md`

## 4. Candidate Check Flow Structure

The flow is:

1. 気になる一足を整理する intro
2. Step 1: 基本情報
3. Step 2: 特徴タグ
4. Step 3: 確認
5. 編集に戻れる confirmation state

The flow stays on the same page and does not create a new route.

## 5. Step Details

Step 1 includes:

- スニーカー名
- ブランド
- 見かけた金額・購入予定額
- 予算
- メモ

Step 2 includes fixed feature tags and a `selected / 5` count.

Step 3 shows the entered text and selected tag labels in a UI-only summary.

## 6. Input Items

The Candidate draft state is held inside `CandidateSneakerCheckFlow`:

- `sneakerName`
- `brand`
- `seenPriceText`
- `budgetText`
- `memo`
- `selectedTagIds`
- `currentStep`
- `isSummaryVisible`

`seenPriceText` and `budgetText` are UI-only string values.

## 7. Price And Budget Handling

`見かけた金額・購入予定額` is not market price, current price, official price, or resale information. It is only the user's own entered text.

The required notice is displayed in Step 1:

```txt
この金額はユーザー入力です。市場価格や在庫を保証するものではありません。
```

Input values are displayed as entered. The UI does not automatically append `円`.

## 8. Feature Tags

Displayed tags:

- クラシック
- シンプルな作り
- ストリート感
- 合わせやすい
- ボリューム感
- ランニング系
- バスケット系
- 履きやすい
- 長く履けそう
- 昔っぽい雰囲気
- 定番・歴史がある
- 上質・高級感

The maximum selection count is 5. Tags can be selected and unselected. Selected state uses text, border treatment, and `aria-pressed`, not color alone.

## 9. UI-Only Summary

The Step 3 summary shows:

- sneaker name
- brand
- seen price / planned amount
- budget
- memo
- selected feature tags

Empty text fields are displayed as `未入力`.

## 10. Client Component Scope

`"use client"` was added only to:

- `app/_components/CandidateSneakerCheckFlow.tsx`

Existing client component:

- `app/_components/PreferenceDiagnosisFlow.tsx`

`app/page.tsx` and `app/layout.tsx` were not converted to Client Components.

## 11. Boundaries Preserved

WEB-06 does not connect to Preference Diagnosis state.

WEB-06 does not:

- call Core
- execute `recommendSneakers`
- import Core types
- use sample data
- implement Result List
- implement Result Detail
- create an API Route
- add DB behavior
- add external API behavior
- add market price, inventory, authenticity, resale, or buy-link behavior

`package.json`, `pnpm-lock.yaml`, and `src/**` were not changed.

## 12. `git add -N` Note

`git add -N` is only for diff visibility of new files. It is intent-to-add state for review, not normal staging for commit.

Before committing, use normal `git add` only for the files that should be included.

## 13. ClientImportSmoke Exclusion

`ClientImportSmoke.tsx` is excluded from the WEB-06 grep verification commands because it remains the WEB-03 import-smoke component.

## 14. Price, Inventory, And Sales-Route Check

Verification command:

```powershell
Get-ChildItem app -Recurse -Include *.tsx |
  Where-Object { $_.FullName -notlike "*ClientImportSmoke.tsx" } |
  Select-String -Pattern "marketPrice|stock|inventory|authentic|buyLink|priceApi|resale|url|href="
```

Expected result:

```txt
原則として何も出ない
```

`premium` remains allowed as a feature tag internal id and is not part of the check pattern.

## 15. Manual Browser Check

Manual browser check result:

- Full interactive browser automation was not available in this Codex session because the browser-control runtime was not exposed and Playwright was not installed in the project.
- `pnpm web:dev --hostname 127.0.0.1 --port 3000` was started temporarily.
- `Invoke-WebRequest http://127.0.0.1:3000` returned `200`.
- The served page HTML contained `気になる一足を整理する`.
- The served page HTML contained `見かけた金額・購入予定額`.
- The served page HTML contained `この金額はユーザー入力です。市場価格や在庫を保証するものではありません。`
- The served page HTML did not contain `WEB-07` or `Core Input Mapping`.
- The dev server was stopped after the check.

## 16. WEB-07 Handling

WEB-07 is treated as:

```txt
WEB-07: Core Input Mapping Plan / UI State Mapping
```

WEB-07 is not shown on the user-facing screen.

## 17. Validation Results

Final verification:

- `pnpm test`: passed, 11 test files and 63 tests.
- `pnpm typecheck`: passed.
- `pnpm web:build`: passed.
- `git status --short --untracked-files=all`: only WEB-06 allowed app files and this summary are changed. New files are in `git add -N` intent-to-add state for diff visibility.
- `git diff --stat`: 12 files changed before this summary update, all in allowed WEB-06 paths.
- `git diff --name-status`: only `app/page.tsx`, `app/globals.css`, new Candidate components/data, and this summary.
- use client check: `CandidateSneakerCheckFlow.tsx` and existing `PreferenceDiagnosisFlow.tsx`.
- Link / router / Core contamination check: no output.
- price, inventory, and sales-route contamination check: no output.

## 18. Decision

Decision:

- Proceed to WEB-07 Core Input Mapping Plan / UI State Mapping.

## 19. Risks And Remaining Checks

- Manual browser checking should confirm that entering `18000` remains `18000` and is not converted.
- Manual browser checking should confirm that five selected tags block additional unselected tags while allowing selected tags to be removed.
- WEB-07 should map UI state carefully before any Core call is introduced.
