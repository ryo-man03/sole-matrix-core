# WEB Prompt 02: Repository Web Readiness Audit

You are working in the TypeScript personal development project `SOLE//MATRIX Core v0.1`.

Create `WEB-02: Repository Web Readiness Audit`.

This is a docs-only audit before Web UI implementation. Do not implement a Web app in this prompt.

## Goal

Audit the current repository structure, package/dependency state, Core browser executability, and `recommendSneakers(input)` import route before any Web App Setup work.

Write the findings to:

- `docs/web/02_REPOSITORY_WEB_READINESS_AUDIT.md`
- `docs/agent-prompts/web/02-repository-web-readiness-audit.md`

## Hard Prohibitions

Do not run dependency-installing or scaffolding commands:

- `pnpm add`
- `npm install`
- `yarn add`
- `npx create-next-app`
- `pnpm create next-app`
- `create-next-app`
- `pnpm lint --fix`
- `prettier --write`
- `tsc --init`
- `next dev`
- `pnpm dev`
- commands that add or update dependencies
- commands that initialize a Web app
- file-generation commands that scaffold app code
- bulk formatting commands

Do not change:

- `src/**`
- `package.json`
- `pnpm-lock.yaml`
- `README.md`
- `.github/**`
- `tsconfig.json`
- test config files
- existing fixtures
- existing tests
- existing Core logic
- existing `docs/ui/**`
- existing `docs/design/**`
- `docs/web/01_WEB_UI_IMPLEMENTATION_PLAN.md`

Only create or edit the two WEB-02 docs files listed above.

## Audit Commands That May Be Used

```powershell
git status --short --untracked-files=all
Get-ChildItem
Get-ChildItem src -Recurse
Get-Content package.json
Get-Content tsconfig.json
Get-ChildItem docs/web
rg "recommendSneakers"
rg "export .*recommendSneakers"
rg "from .*recommend"
pnpm test
pnpm typecheck
git diff --stat
git diff --name-status
```

Use `Select-String` only if `rg` is unavailable.

## Search Rules

Do not rely on broad generic searches alone. Terms such as `path`, `api`, and `endpoint` can create many false positives.

Split findings into these categories:

- Core body
- adapter
- CLI-only
- tests
- docs
- config files
- unknown

Docs-only or tests-only mentions must not be treated as proof that the Core Client import path is unsafe.

CLI-only Node API usage must not be treated as proof that Core is unsafe, provided it is not on the Web import route.

Adapter usage of external APIs must be separated from Core usage.

## Required High-Risk Searches

Run a Node/API/env dependency search over `src`:

```powershell
rg 'node:fs|from [''\\"]fs[''\\"]|require\\([''\\"]fs[''\\"]\\)|node:path|from [''\\"]path[''\\"]|require\\([''\\"]path[''\\"]\\)|process\.env|child_process|node:crypto|from [''\\"]crypto[''\\"]|Buffer' src
```

Run the same kind of search for the browser-relevant Core route:

```powershell
rg 'node:fs|from [''\\"]fs[''\\"]|require\\([''\\"]fs[''\\"]\\)|node:path|from [''\\"]path[''\\"]|require\\([''\\"]path[''\\"]\\)|process\.env|child_process|node:crypto|from [''\\"]crypto[''\\"]|Buffer' src\core src\domain src\data src\explanation
```

Run an external API / AI provider search over `src`:

```powershell
rg "fetch\(|axios|GEMINI_API_KEY|OPENAI_API_KEY|API_KEY|SECRET|TOKEN|Gemini|OpenAI" src
```

Run the same kind of search for the browser-relevant Core route:

```powershell
rg "fetch\(|axios|GEMINI_API_KEY|OPENAI_API_KEY|API_KEY|SECRET|TOKEN|Gemini|OpenAI" src\core src\domain src\data src\explanation
```

Run docs/tests reference checks separately:

```powershell
rg "Gemini|OpenAI|process\.env|fetch\(" docs src
```

If a top-level `tests` directory does not exist, record that the repository stores tests under `src/**/__tests__/**`.

## Required Audit Sections

Include these sections in `docs/web/02_REPOSITORY_WEB_READINESS_AUDIT.md`:

1. WEB-02 purpose
2. Audit scope
3. Unchanged scope
4. `package.json` check
5. scripts check
6. dependencies / devDependencies check
7. Web UI environment presence
8. Next.js status
9. React status
10. Tailwind status
11. Vite or existing Web environment status
12. `src` structure check
13. Core public API check
14. `recommendSneakers(input)` import route
15. Core browser executability check
16. Node-only API dependency check
17. environment-variable dependency check
18. external API dependency check
19. Gemini / OpenAI / provider dependency check
20. search result classification
21. provisional Client import decision
22. API Route prohibition alignment
23. required WEB-03 work
24. decision to proceed to WEB-03
25. risks and unverified items
26. completion criteria

## package.json Recording Format

Record:

```txt
package.json exists:
package manager:
scripts:
dependencies:
devDependencies:
```

Check whether these exist:

- `next`
- `react`
- `react-dom`
- `tailwindcss`
- `vite`
- `typescript`
- `vitest`
- `tsx`
- `build` script
- `dev` script
- `test` script
- `typecheck` script

## scripts Table

Use this table:

| script | exists | value | notes |
| --- | --- | --- | --- |
| dev | TODO | TODO | TODO |
| build | TODO | TODO | TODO |
| test | TODO | TODO | TODO |
| typecheck | TODO | TODO | TODO |
| lint | TODO | TODO | TODO |

Add other existing scripts if useful.

## dependencies Table

Use this table:

| package | status | notes |
| --- | --- | --- |
| next | TODO | TODO |
| react | TODO | TODO |
| react-dom | TODO | TODO |
| tailwindcss | TODO | TODO |
| vite | TODO | TODO |
| typescript | TODO | TODO |
| vitest | TODO | TODO |

## Web UI Environment Table

Check and record:

| item | exists | notes |
| --- | --- | --- |
| `app/` | TODO | TODO |
| `pages/` | TODO | TODO |
| `public/` | TODO | TODO |
| `src/app/` | TODO | TODO |
| `src/pages/` | TODO | TODO |
| `index.html` | TODO | TODO |
| `vite.config.*` | TODO | TODO |
| `next.config.*` | TODO | TODO |
| `tailwind.config.*` | TODO | TODO |
| `postcss.config.*` | TODO | TODO |

## Status Blocks

Record Next.js status as one of:

```txt
Next.js Status:
- Already installed
- Not installed
- Unclear
```

Record React status as one of:

```txt
React Status:
- Already installed
- Not installed
- Unclear
```

Record Tailwind status as one of:

```txt
Tailwind Status:
- Already installed
- Not installed
- Unclear
```

Record Vite status as one of:

```txt
Vite Status:
- Already installed
- Not installed
- Unclear
```

## Core Public API Recording Format

Record:

```txt
recommendSneakers definition:
recommendSneakers export path:
recommended import path for Web UI:
related types:
```

Do not change Core code. Only record the import route.

## Browser Executability Table

Use this table:

| check | result | notes |
| --- | --- | --- |
| Pure TypeScript logic | TODO | TODO |
| No fs dependency in Core body | TODO | TODO |
| No path dependency in Core body | TODO | TODO |
| No process.env dependency in Core body | TODO | TODO |
| No external fetch required by Core body | TODO | TODO |
| Gemini adapter not required for core execution | TODO | TODO |
| CLI separated from core | TODO | TODO |
| sample data browser-safe | TODO | TODO |

## Search Result Tables

For Node-only API dependency checks, use:

| keyword/pattern | found | location | category | risk |
| --- | --- | --- | --- | --- |
| TODO | TODO | TODO | Core body / adapter / CLI-only / tests / docs / config files / unknown | TODO |

For environment-variable dependency checks, use:

| keyword | found | location | category | risk |
| --- | --- | --- | --- | --- |
| process.env | TODO | TODO | TODO | TODO |
| GEMINI_API_KEY | TODO | TODO | TODO | TODO |
| OPENAI_API_KEY | TODO | TODO | TODO | TODO |

For external API dependency checks, use:

| keyword/pattern | found | location | category | risk |
| --- | --- | --- | --- | --- |
| TODO | TODO | TODO | Core body / adapter / CLI-only / tests / docs / config files / unknown | TODO |

## Gemini / OpenAI / Provider Check

Record:

```txt
Gemini adapter:
OpenAI dependency:
Fallback explanation:
Provider field:
Risk:
```

Make clear that Gemini/provider explanation code must not change `finalScore`, `rawDecision`, `finalDecision`, or `demotions`.

## Client Import Decision

Record one of:

```txt
Client Import Decision:
- Likely safe for direct Client import
- Possibly safe, but needs targeted verification
- Not safe for direct Client import
- Unknown
```

Use `Likely safe` only if the Core import route is pure TypeScript and does not require Node APIs, `process.env`, external fetch, Gemini, OpenAI, or provider adapter code.

Use `Possibly safe` if the route appears safe but actual Web bundler verification is still needed.

Use `Not safe` if Core itself requires Node APIs, secrets, external APIs, or server-only behavior.

Use `Unknown` if repository structure is too unclear.

## API Route Policy

Do not create an API Route in WEB-02.

If Client import is not safe, record:

```txt
Client import is not safe.
Stop Web UI integration.
Adapter strategy must be designed in a separate docs-only prompt.
API Route decision is deferred to a later version.
```

If Client import appears safe, record that WEB-03 should proceed without adding an API Route and should avoid importing adapter/CLI modules.

## WEB-03 Decision

Record one of:

```txt
Decision:
- Proceed to WEB-03 Web App Setup
- Proceed to WEB-03 with caution
- Hold and design Adapter strategy first
- Hold due to unclear repository state
```

Proceed only if the repository state is clear enough and Core direct import is safe or likely safe.

## Required Verification Commands

After writing the docs, run:

```powershell
pnpm test
pnpm typecheck
git status --short --untracked-files=all
git diff --stat
git diff --name-status
```

Expected result:

- Existing tests pass.
- Typecheck passes.
- Changed files are limited to `docs/web/**` and `docs/agent-prompts/web/**`.
- No changes appear in `src/**`, `package.json`, `pnpm-lock.yaml`, `README.md`, `.github/**`, `tsconfig.json`, test config files, existing fixtures, existing tests, existing `docs/ui/**`, existing `docs/design/**`, or `docs/web/01_WEB_UI_IMPLEMENTATION_PLAN.md`.

## Suggested Commit Message

```txt
docs: add repository web readiness audit
```

## Final Report Requirements

Report:

- files added
- audit commands run
- unchanged scopes verified
- `pnpm test` result
- `pnpm typecheck` result
- `git diff --stat` result
- `git diff --name-status` result
- `git status --short --untracked-files=all` result
- provisional Client import decision
- WEB-03 proceed decision

The purpose of this prompt is only to document whether this existing repository is ready to add a Web UI in a later prompt. Do not implement Web UI, install dependencies, or change project configuration in WEB-02.
