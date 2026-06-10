# WEB Prompt 03: Web App Setup

You are working in the TypeScript personal development project `SOLE//MATRIX Core v0.1`.

Create `WEB-03: Web App Setup`.

This prompt may add the minimum Web app environment needed to verify that the existing Core can be imported by a browser-facing Next.js Client Component. This prompt is not a user-facing Home implementation, diagnosis UI implementation, recommendation integration, API design task, or data feature task.

## Goal

Add a minimal Next.js Web app setup only if the repository state still matches the WEB-02 readiness audit and the setup can be done without weakening existing Core safety.

Write the work summary to:

- `docs/web/03_WEB_APP_SETUP_SUMMARY.md`
- `docs/agent-prompts/web/03-web-app-setup.md`

## Required Context

Read before editing:

- `docs/web/02_REPOSITORY_WEB_READINESS_AUDIT.md`
- `package.json`
- `tsconfig.json`
- `src/core/index.ts`

Confirm the WEB-02 conclusion is still usable before creating Web files:

- Core public export is available from `src/core/index.ts`.
- The Core import route does not require `src/ai/**`.
- The Core import route does not require `src/demo/**`.
- The Core import route does not require Node-only APIs, environment variables, external APIs, Gemini, or OpenAI.

If the import route is unclear, stop and report the blocker.

## Hard Prohibitions

Do not change:

- `src/**`
- `README.md`
- `.github/**`
- existing tests
- existing fixtures
- `docs/ui/**`
- `docs/design/**`
- `docs/web/01_WEB_UI_IMPLEMENTATION_PLAN.md`
- `docs/web/02_REPOSITORY_WEB_READINESS_AUDIT.md`

Do not add:

- API Route
- database
- authentication
- login
- external API
- scraping
- real price display
- inventory display
- purchase link
- saved history
- localStorage or sessionStorage persistence
- AI chat
- AI-generated score
- AI-generated decision
- AI-generated demotion
- sitemap
- payment
- notification

Do not run:

- `npx create-next-app`
- `pnpm create next-app`
- `create-next-app`
- `tsc --init`
- bulk formatting commands
- `pnpm lint --fix`
- commands that overwrite existing repository structure

Do not run Recommendation in WEB-03.

Do not use sample data in WEB-03.

Do not display `finalScore`, `finalDecision`, or `Demotion` in WEB-03.

Do not create an API Route in WEB-03.

## Allowed Main Diffs

The expected WEB-03 diff should be limited mainly to:

```txt
package.json
pnpm-lock.yaml
app/layout.tsx
app/page.tsx
app/globals.css
app/_components/ClientImportSmoke.tsx
next-env.d.ts
tsconfig.json
.gitignore
docs/web/03_WEB_APP_SETUP_SUMMARY.md
docs/agent-prompts/web/03-web-app-setup.md
```

If another file appears, explain why it is necessary. If any stopped-diff path appears, stop before commit and report it.

## Stop If These Diffs Appear

Stop and report before commit if any of these paths are changed:

```txt
src/**
README.md
.github/**
existing test
existing fixture
docs/ui/**
docs/design/**
docs/web/01_WEB_UI_IMPLEMENTATION_PLAN.md
docs/web/02_REPOSITORY_WEB_READINESS_AUDIT.md
```

## Minimal Web App Requirements

If adding Next.js, add it manually and minimally. Do not use create-next-app.

Use the App Router with root `app/`.

Required files if Next.js is introduced:

- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `next-env.d.ts`

The first page must remain a setup check page, not a real Home UI.

Allowed page content:

- `SOLE//MATRIX`
- a short Web UI setup check note
- the rendered `ClientImportSmoke` helper

Do not implement WEB-04 static Home UI in WEB-03.

## ClientImportSmoke Required Render

If `ClientImportSmoke` is created, it must be rendered once from `app/page.tsx`.

Creating an unused component does not count as a Client import smoke check.

The display can be a small helper text.

Example:

```tsx
import { ClientImportSmoke } from "./_components/ClientImportSmoke";

export default function Page() {
  return (
    <main>
      <h1>SOLE//MATRIX</h1>
      <p>Web UI setup check</p>
      <ClientImportSmoke />
    </main>
  );
}
```

Rules:

- Do not create `ClientImportSmoke` and leave it unused.
- Render it from `app/page.tsx` so it is included in the Next.js build target.
- Do not run Recommendation yet.
- Do not use sample data yet.
- Do not display `finalScore`, `finalDecision`, or `Demotion` yet.
- Do not create an API Route.

## ClientImportSmoke Scope

`ClientImportSmoke` may only prove that the browser-facing Client Component can import the existing Core public export.

It may:

- use `"use client"`
- import `recommendSneakers` from the existing public Core export
- render small static text proving that the import binding exists

It must not:

- call `recommendSneakers`
- create real input data
- import sample data
- import `src/ai/**`
- import `src/demo/**`
- display recommendation output
- display score, decision, or demotion fields
- fetch external data
- read environment variables
- use Node-only APIs

## Core Import Path Alias Prohibition

In WEB-03, do not add a new path alias only for the Core import smoke check.

Only use an alias if it already exists before WEB-03 work starts.

If no existing alias is available, prefer a relative import from `app/_components/ClientImportSmoke.tsx` to the existing public export.

Rules:

- Do not newly add an `@/...` alias.
- Do not add `tsconfig.json` `paths` only for the Core import smoke check.
- Use the existing public export.
- If the import route is unclear, stop and report.
- If importing the route pulls in Node-only APIs or environment variables, stop and report.

Preferred import when no alias exists:

```tsx
import { recommendSneakers } from "../../src/core";
```

Adjust the relative path only if the file location changes.

## tsconfig.json Diff Handling

If `tsconfig.json` changes, report the reason for the diff with this exact structure:

```txt
tsconfig.json change reason:
- Next.jsが必要とする最小差分:
- 既存Coreのtypecheckに影響する可能性:
- strictness / module設定を弱めていないか:
```

Forbidden:

- weakening existing Core type safety
- weakening `strict`
- weakening `noImplicitAny` or similar safety settings
- changing `module` or `moduleResolution` broadly without a clear reason
- replacing the existing configuration wholesale
- running `tsc --init`

Potentially allowed, only when minimal and necessary:

- minimal `jsx` setting required by Next.js
- minimal `include` or Next.js plugin setting required by Next.js
- minimal diff to include `next-env.d.ts`

If `tsconfig.json` changes, always report it.

## package.json and Scripts

If dependencies are needed, add only the minimum required for the chosen Next.js setup.

Expected dependency additions may include:

- `next`
- `react`
- `react-dom`
- matching React type packages if needed by the setup

Add or change scripts only as needed. Prefer:

```json
{
  "web:dev": "next dev",
  "web:build": "next build",
  "web:start": "next start"
}
```

Do not remove existing scripts.

Do not rename existing Core scripts.

Do not replace the existing `typecheck` script unless absolutely required. If it must change, stop and report before changing it.

## Tailwind Decision

Tailwind is not required in WEB-03.

If Tailwind is not introduced, report that explicitly.

If Tailwind is introduced, keep the setup minimal and explain why it is needed for WEB-03 rather than WEB-04.

## Required Pre-Commit Verification

After WEB-03 work and before commit, run:

```powershell
pnpm test
pnpm typecheck
pnpm web:build
git status --short --untracked-files=all
git diff --stat
git diff --name-status
```

Confirm specifically:

- `ClientImportSmoke` is rendered from `app/page.tsx`.
- `ClientImportSmoke` is not an unused file.
- No path alias was added only for the Core import smoke check.
- If `tsconfig.json` has a diff, its reason is explained.
- Existing Core strictness and module settings were not weakened.
- No `src/**` change exists.
- No API Route was created.
- No DB was added.
- No external API was added.
- No purchase link, price display, or inventory display was added.

## Summary Document Requirements

Create `docs/web/03_WEB_APP_SETUP_SUMMARY.md` with:

1. WEB-03 purpose
2. files added or changed
3. dependencies added
4. scripts added or changed
5. Web app structure
6. `ClientImportSmoke` implementation
7. proof that `ClientImportSmoke` is rendered from `app/page.tsx`
8. Core import path used
9. confirmation that no new Core import path alias was added
10. `tsconfig.json` change reason, if changed
11. confirmation that existing Core type safety was not weakened
12. Tailwind decision
13. Client import smoke check result
14. prohibited items confirmation
15. verification command results
16. git diff summary
17. decision on whether WEB-04 may proceed

## Suggested Commit Message

Prefer:

```txt
chore: add minimal Next.js web app setup
```

Reason:

- WEB-03 adds environment setup, not a user-facing feature.
- Home implementation and diagnosis UI implementation start in WEB-04 or later.
- Use `feat` for WEB-04 or later UI feature implementation.

## Final Report Requirements

Report:

- added and changed file list
- dependencies added
- scripts added or changed
- whether `ClientImportSmoke` is rendered from `app/page.tsx`
- whether a new Core import path alias was added
- if `tsconfig.json` changed, the required reason block
- confirmation that existing Core type safety was not weakened
- whether Tailwind was introduced
- Client import smoke check result
- `pnpm test` result
- `pnpm typecheck` result
- `pnpm web:build` result
- `git diff --stat` result
- `git diff --name-status` result
- `git status --short --untracked-files=all` result
- decision on whether WEB-04 may proceed
