# SOLE//MATRIX WEB-03: Web App Setup Summary

## 1. WEB-03 Purpose

WEB-03 adds the smallest Next.js Web UI environment needed to verify that the existing SOLE//MATRIX Core v0.1 public API can be imported from browser-facing React code.

WEB-03 does not implement the Home UI, diagnosis UI, Candidate Check, Result List, Result Detail, recommendation rendering, saved history, API routes, database access, authentication, payment, external API calls, price display, stock display, or purchase links.

## 2. Work Performed

- Added a minimal Next.js App Router structure under `app/`.
- Added a root layout with Japanese UI language metadata.
- Added a setup-only page that displays `SOLE//MATRIX` and `Web UI setup check`.
- Added `ClientImportSmoke` as a Client Component.
- Imported `recommendSneakers` from the existing Core public export in `ClientImportSmoke`.
- Rendered `ClientImportSmoke` from `app/page.tsx`.
- Added minimal global CSS without Tailwind or another CSS framework.
- Added Next.js scripts to `package.json`.
- Added Next.js / React dependencies and the minimal React type packages needed for TypeScript JSX checking.
- Updated `tsconfig.json` only as needed for Next.js and JSX support.
- Added Next.js/build artifacts to `.gitignore`.

## 3. Added or Changed Files

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
```

## 4. Added Dependencies

Runtime dependencies:

```txt
next
react
react-dom
```

Development dependencies:

```txt
@types/react
@types/react-dom
```

`@types/react` and `@types/react-dom` were added because `pnpm typecheck` failed without JSX intrinsic element and React namespace types. These are TypeScript-only packages and do not change Core runtime behavior.

Tailwind was not added. WEB-03 only needs a minimal setup page and a Client Component import smoke check.

## 5. Added Scripts

The existing scripts were preserved:

```txt
demo
demo:gemini
test
test:watch
typecheck
```

The following scripts were added:

```txt
web:dev = next dev
web:build = next build
web:start = next start
```

## 6. ClientImportSmoke Overview

`app/_components/ClientImportSmoke.tsx` is a Client Component with `"use client";` at the top.

It imports:

```ts
import { recommendSneakers } from "../../src/core";
```

It does not call `recommendSneakers`. It only checks:

```ts
typeof recommendSneakers === "function"
```

`ClientImportSmoke` is rendered from `app/page.tsx`, so the import path is exercised by the Next.js client compilation path rather than left as unused code.

## 7. Core Import Path

The Core import path is a relative import from the app component to the existing public export:

```txt
../../src/core
```

No new `@/...` alias or `paths` alias was added for this smoke check.

## 8. tsconfig.json Change Reason

Changes were limited to Next.js and JSX requirements:

- Added DOM libs for browser-facing React/Next types.
- Added JSX support. Next.js changed `jsx` to `react-jsx` during `pnpm web:build`, which it reports as mandatory for the React automatic runtime.
- Added the Next.js TypeScript plugin.
- Added `next-env.d.ts`, `app/**/*.ts`, `app/**/*.tsx`, `.next/types/**/*.ts`, and `.next/dev/types/**/*.ts` to `include`.
- Added `exclude: ["node_modules"]`.
- Added `incremental`.
- Next.js added `allowJs: true` during `pnpm web:build` as a suggested value.
- Removed the pre-existing UTF-8 BOM from `tsconfig.json` because Turbopack could not parse the JSON while the BOM was present.

Existing Core type safety was not weakened:

- `strict` remains `true`.
- `noUncheckedIndexedAccess` remains `true`.
- `exactOptionalPropertyTypes` remains `true`.
- `module` remains `ESNext`.
- `moduleResolution` remains `Bundler`.
- Existing `src/**/*.ts` typechecking remains included.

## 9. Explicit Non-Changes

- `src/**` was not changed.
- Existing tests and fixtures were not changed.
- `README.md` was not changed.
- `.github/**` was not changed.
- `docs/ui/**` was not changed.
- `docs/design/**` was not changed.
- `docs/web/01_WEB_UI_IMPLEMENTATION_PLAN.md` was not changed.
- `docs/web/02_REPOSITORY_WEB_READINESS_AUDIT.md` was not changed.
- `docs/agent-prompts/web/03-web-app-setup.md` was not changed.
- No API Route was added.
- No DB was added.
- No auth was added.
- No external API was added.
- No Gemini or OpenAI API call was added.
- No sample data was imported into the Web UI.
- No real price, stock, purchase link, finalScore, finalDecision, or Demotion display was added.

## 10. Verification Results

Initial `pnpm typecheck` failed before React type packages were added:

```txt
error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
error TS2503: Cannot find namespace 'React'.
```

After adding the React type packages:

```txt
pnpm test: passed
pnpm typecheck: passed
pnpm web:build: passed
```

`pnpm add` returned exit code 1 because pnpm reported ignored build scripts for the optional `sharp` dependency pulled in by Next.js. No `sharp` build approval was added, and `pnpm web:build` still passed.

## 11. Client Import Smoke Check Result

Result: passed.

Evidence:

- `ClientImportSmoke` imports `recommendSneakers` from `../../src/core`.
- `ClientImportSmoke` is rendered by `app/page.tsx`.
- `pnpm web:build` compiled the app successfully.

## 12. Risk and Notes

- Next.js 16.2.7 uses Turbopack for `next build` in this environment.
- The optional `sharp` build script remains unapproved by pnpm; this did not block WEB-03 build verification.
- `allowJs: true` was added by Next.js during build. There are no JavaScript source files in the Core implementation, and existing Core TypeScript strictness remains enabled.

## 13. Decision

Decision:

```txt
Proceed to WEB-04 Static UI Shell / Home
```

Rationale:

- The minimal Next.js app is present.
- The Client Component import smoke check is rendered from the page.
- Core public export can be imported through the client compilation path.
- Tests, typecheck, and web build pass.
- No WEB-04 UI scope was implemented early.
