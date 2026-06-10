# WEB-04: Static UI Shell / Home Summary

## 1. Purpose

WEB-04 replaced the WEB-03 setup check page with a static user-facing Home screen for SOLE//MATRIX. This pass adds only the shared UI shell and Home surface. Preference Diagnosis, Candidate Check, Result List, Result Detail, recommendation execution, sample data, API routes, DB work, and external APIs remain out of scope.

## 2. Implemented Scope

- Added `AppShell`, `Header`, `MainContainer`, `FooterNotice`, and `HomeEntryCard` under `app/_components/`.
- Replaced `app/page.tsx` with a static Home screen.
- Added two non-interactive entry cards: `好みを診断する` and `気になる一足をチェックする`.
- Added the support text: `結果の見方は、後続のResult画面実装で追加予定です。`
- Added the notice that price, inventory, authenticity, resale premium, and purchase links are not handled.
- Updated minimal metadata in `app/layout.tsx`.
- Reworked `app/globals.css` for a quiet off-white, thin-border, restrained-card layout.

## 3. Changed Files

- `app/page.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `app/_components/AppShell.tsx`
- `app/_components/Header.tsx`
- `app/_components/MainContainer.tsx`
- `app/_components/FooterNotice.tsx`
- `app/_components/HomeEntryCard.tsx`
- `docs/web/04_STATIC_UI_SHELL_HOME_SUMMARY.md`

## 4. Home Structure

The Home screen is composed as:

- `AppShell`
- `Header`
- `MainContainer`
- Home hero with the `SOLE//MATRIX` service name and a short description
- Entry card section with two equal cards
- Result-view support text
- `FooterNotice`

## 5. Entry Card Treatment

The two cards are treated as Entry Cards, not CTA cards. They are static visual entry points for the future flows, with no navigation or interaction in WEB-04.

## 6. Non-Interactive Entry Cards

`HomeEntryCard` renders an `article`. It is not a `button`, not a `Link`, and does not use router APIs or click handlers. It also does not add `tabIndex`, so a non-interactive element is not made keyboard-focusable.

## 7. Cursor And Hover Policy

Entry Cards do not use `cursor: pointer`. They do not include hover transforms, strong hover shadows, underlines, or link-like styling that would imply they can be pressed.

## 8. No Implementation Memo Inside Cards

The cards do not show internal development messages such as future-route notes or next-process labels. Their text is limited to user-facing descriptions and helper copy.

## 9. Header Policy

The Header shows `SOLE//MATRIX` and a short user-facing label, `購入判断サポート`. It does not show `Static Home`, `WEB-04`, `Next: WEB-05`, `Core v0.1`, project-step names, or debug status.

## 10. Core Version Visibility

`Core v0.1` is intentionally not presented as primary Home-screen content. The Home page is a user-facing surface rather than a development status page.

## 11. Result Guide Treatment

`結果の見方` is not linkified in WEB-04. It is plain support text only. No `/guide` page, `Link`, router call, or click handler was added.

## 12. WEB-05 Label Treatment

`Next: WEB-05 Preference Diagnosis Flow` is intentionally not shown on the Home screen. The next-step information belongs in this summary and future implementation prompts, not in the user-facing Home UI.

## 13. ClientImportSmoke

`ClientImportSmoke` remains in the repository as the WEB-03 verification component, but `app/page.tsx` no longer renders it. It was not deleted so WEB-03 history and the import-smoke artifact remain available.

## 14. Not Implemented

- Preference Diagnosis
- Candidate Check
- Result List
- Result Detail
- `recommendSneakers` execution from the UI
- Sample data loading
- API Route creation
- DB integration
- Gemini, OpenAI, price, scraping, or other external API integration
- Login, saved history, my page, checkout, AI chat, or purchase links

## 15. Boundaries Preserved

- `package.json` was not changed.
- `pnpm-lock.yaml` was not changed.
- `src/**` was not changed.
- Existing tests and fixtures were not changed.
- `ClientImportSmoke.tsx` was not changed.
- No new dependency, path alias, route, router usage, `Link`, or client state was added.

## 16. Validation Commands

Baseline before implementation:

- `git status --short --untracked-files=all`: clean
- `pnpm test`: passed, 11 files and 63 tests
- `pnpm typecheck`: passed
- `pnpm web:build`: passed

Final validation:

- `pnpm test`: passed
- `pnpm typecheck`: passed
- `pnpm web:build`: passed

## 17. Decision

Decision: Proceed to WEB-05 Preference Diagnosis Flow.

The static Home shell is in place, the entry cards are visually equal and non-interactive, the forbidden implementation areas were not added, and the validation commands pass.
