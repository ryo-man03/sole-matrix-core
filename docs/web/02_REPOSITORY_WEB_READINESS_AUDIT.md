# SOLE//MATRIX WEB-02: Repository Web Readiness Audit

## 1. WEB-02 Purpose

WEB-02 is a docs-only audit before any Web UI setup or implementation. Its purpose is to determine whether the current SOLE//MATRIX Core v0.1 repository is ready for a later Web App Setup prompt, and whether `recommendSneakers(input)` can be imported from browser-facing UI code without pulling in Node-only, environment-variable, external API, or provider-adapter dependencies.

WEB-02 did not install Next.js, React, Tailwind, Vite, or any other Web UI dependency.

## 2. Audit Scope

Audited files and areas:

- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `tsconfig.json`
- `vitest.config.ts`
- `src/**`
- `docs/web/01_WEB_UI_IMPLEMENTATION_PLAN.md`
- Existing `docs/ui/**`, `docs/design/**`, and selected `docs/agent-prompts/**` references
- `.github/workflows/ci.yml`

## 3. Unchanged Scope

WEB-02 changed only these docs:

- `docs/web/02_REPOSITORY_WEB_READINESS_AUDIT.md`
- `docs/agent-prompts/web/02-repository-web-readiness-audit.md`

WEB-02 did not change:

- `src/**`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `README.md`
- `.github/**`
- `tsconfig.json`
- `vitest.config.ts`
- Existing fixtures
- Existing tests
- Existing Core logic
- `docs/ui/**`
- `docs/design/**`
- `docs/web/01_WEB_UI_IMPLEMENTATION_PLAN.md`

## 4. package.json Check

```txt
package.json exists: yes
package manager: pnpm, inferred from pnpm-lock.yaml and pnpm-workspace.yaml
scripts: demo, demo:gemini, test, test:watch, typecheck
dependencies: none
devDependencies: @types/node, tsx, typescript, vitest
```

No `packageManager` field is declared in `package.json`.

## 5. scripts Check

| script | exists | value | notes |
| --- | --- | --- | --- |
| dev | no | n/a | No Web dev server script exists. |
| build | no | n/a | No build script exists. |
| test | yes | `vitest run` | Existing test command. |
| typecheck | yes | `tsc --noEmit` | Existing typecheck command. |
| lint | no | n/a | No lint script exists. |
| demo | yes | `tsx src/demo/runRecommendationDemo.ts` | CLI-only demo. |
| demo:gemini | yes | `tsx src/demo/runGeminiRecommendationDemo.ts` | CLI-only Gemini demo. |
| test:watch | yes | `vitest` | Watch-mode test script. |

## 6. dependencies / devDependencies Check

| package | status | notes |
| --- | --- | --- |
| next | not installed | No Next.js dependency or config found. |
| react | not installed | No React dependency found. |
| react-dom | not installed | No React DOM dependency found. |
| tailwindcss | not installed | No Tailwind dependency or config found. |
| vite | not installed as app dependency | `vitest.config.ts` imports `vitest/config`; no Vite web app config exists. |
| typescript | installed | Present in `devDependencies`. |
| vitest | installed | Present in `devDependencies`. |
| tsx | installed | Present in `devDependencies`. |
| @types/node | installed | Present in `devDependencies`; used for Node-targeted tests and CLI/demo code. |

## 7. Web UI Environment Presence

| item | exists | notes |
| --- | --- | --- |
| `app/` | no | No root Next.js App Router directory. |
| `pages/` | no | No root Next.js Pages Router directory. |
| `public/` | no | No static public assets directory. |
| `src/app/` | no | No Next.js App Router under `src`. |
| `src/pages/` | no | No Next.js Pages Router under `src`. |
| `index.html` | no | No Vite/static HTML entry. |
| `vite.config.*` | no | `vitest.config.ts` exists, but no Vite web config. |
| `next.config.*` | no | No Next.js config. |
| `tailwind.config.*` | no | No Tailwind config. |
| `postcss.config.*` | no | No PostCSS config. |

Conclusion: no Web UI app environment is currently present.

## 8. Next.js Status

```txt
Next.js Status:
- Not installed
```

Evidence:

- `next` is absent from `package.json`.
- No `app/`, `pages/`, `src/app/`, or `src/pages/` directory exists.
- No `next.config.*` file exists.

WEB-02 did not add Next.js.

## 9. React Status

```txt
React Status:
- Not installed
```

Evidence:

- `react` is absent from `package.json`.
- `react-dom` is absent from `package.json`.
- No React app entry such as `src/main.*`, `src/App.*`, `app/`, or `pages/` exists.

WEB-02 did not add React.

## 10. Tailwind Status

```txt
Tailwind Status:
- Not installed
```

Evidence:

- `tailwindcss` is absent from `package.json`.
- No `tailwind.config.*` file exists.
- No `postcss.config.*` file exists.
- No Web CSS entry file was found.

WEB-02 did not add Tailwind.

## 11. Vite or Existing Web Environment Status

```txt
Vite Status:
- Not installed as a Web app environment
```

Evidence:

- No `vite` dependency appears in `package.json`.
- No `@vitejs/*` dependency appears in `package.json`.
- No `vite.config.*` file exists.
- No `index.html` file exists.
- No `src/main.*` or `src/App.*` file exists.
- `vitest.config.ts` exists only for test configuration.

## 12. src Structure Check

Observed structure:

```txt
src/
  ai/
    __tests__/
    createGeminiExplanationPrompt.ts
    generateGeminiExplanation.ts
    index.ts
    types.ts
  core/
    __tests__/
    index.ts
    recommendSneakers.ts
    types.ts
  data/
    __tests__/
    index.ts
    sampleOwnedSneakers.ts
    sampleProfiles.ts
    sampleSneakers.ts
  demo/
    __tests__/
    formatGeminiRecommendationDemo.ts
    formatRecommendationResult.ts
    runGeminiRecommendationDemo.ts
    runRecommendationDemo.ts
  domain/
    profile/
    recommendation/
    sneaker/
  explanation/
    __tests__/
    createRuleBasedExplanation.ts
    index.ts
    types.ts
```

Classification:

- Core logic: `src/core/**` plus `src/domain/**`
- Public API: `src/core/index.ts`
- Sample data: `src/data/**`
- CLI demos: `src/demo/**`
- Rule-based explanation: `src/explanation/**`
- Gemini/provider adapter: `src/ai/**`
- Tests: `src/**/__tests__/**`
- Web UI directories: none found
- Node-only execution paths: CLI demo files under `src/demo/**`, plus Node test runtime

## 13. Core Public API Check

```txt
recommendSneakers definition:
src/core/recommendSneakers.ts

recommendSneakers export path:
src/core/index.ts

recommended import path for Web UI:
import { recommendSneakers } from "../src/core";
```

If WEB-03 introduces a TypeScript path alias, the preferred future import may become:

```ts
import { recommendSneakers } from "@/core";
```

That alias does not exist today, so WEB-02 records it only as a possible WEB-03 setup decision.

Related public types are exported from `src/core/index.ts`:

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

## 14. recommendSneakers(input) Import Route

Current route:

```txt
src/core/index.ts
  -> src/core/recommendSneakers.ts
    -> src/domain/recommendation/balancedScore.ts
    -> src/domain/recommendation/* pure scoring modules
    -> src/domain/profile/preferenceTypes.ts
    -> src/domain/sneaker/*
```

The route does not import `src/ai/**`, `src/demo/**`, or tests.

For WEB-03, use the public Core export rather than importing from private scoring modules:

```ts
import { recommendSneakers } from "../src/core";
```

## 15. Core Browser Executability Check

| check | result | notes |
| --- | --- | --- |
| Pure TypeScript logic | pass | Core delegates to domain scoring modules and returns structured data. |
| No fs dependency in Core body | pass | No `fs` or `node:fs` matches in `src/core`, `src/domain`, `src/data`, or `src/explanation`. |
| No path dependency in Core body | pass | No `path` or `node:path` matches in browser-relevant Core modules. |
| No process.env dependency in Core body | pass | No `process.env` matches in `src/core`, `src/domain`, `src/data`, or `src/explanation`. |
| No external fetch required by Core body | pass | No `fetch(` or `axios` matches in browser-relevant Core modules. |
| Gemini adapter not required for core execution | pass | Gemini code is isolated in `src/ai/**` and not imported by `src/core/**`. |
| CLI separated from core | pass | CLI demos live in `src/demo/**` and import Core, not the reverse. |
| sample data browser-safe | likely pass | `src/data/**` exports static TypeScript data and has no Node/env/fetch matches. |

## 16. Node-only API Dependency Check

Search command:

```powershell
rg 'node:fs|from [''\\"]fs[''\\"]|require\\([''\\"]fs[''\\"]\\)|node:path|from [''\\"]path[''\\"]|require\\([''\\"]path[''\\"]\\)|process\\.env|child_process|node:crypto|from [''\\"]crypto[''\\"]|Buffer' src
```

| keyword/pattern | found | location | category | risk |
| --- | --- | --- | --- | --- |
| `process.env` | yes | `src/ai/generateGeminiExplanation.ts` | adapter | Do not import from Client UI. Isolated from Core. |
| `process.env` | yes | `src/demo/runGeminiRecommendationDemo.ts` | CLI-only | Safe if demo code is never imported by Web UI. |
| `process.env` | yes | `src/ai/__tests__/generateGeminiExplanation.test.ts` | tests | Reference only; not a Client import blocker. |
| `node:fs`, `fs`, `node:path`, `path`, `child_process`, `node:crypto`, `crypto`, `Buffer` | no | n/a | n/a | No direct match found in `src`. |

Core-specific search command:

```powershell
rg 'node:fs|from [''\\"]fs[''\\"]|require\\([''\\"]fs[''\\"]\\)|node:path|from [''\\"]path[''\\"]|require\\([''\\"]path[''\\"]\\)|process\\.env|child_process|node:crypto|from [''\\"]crypto[''\\"]|Buffer' src/core src/domain src/data src/explanation
```

Core-specific result: no matches.

## 17. Environment Variable Dependency Check

| keyword | found | location | category | risk |
| --- | --- | --- | --- | --- |
| `process.env` | yes | `src/ai/generateGeminiExplanation.ts` | adapter | Not safe for direct Client import; keep out of Web UI initial path. |
| `process.env` | yes | `src/demo/runGeminiRecommendationDemo.ts` | CLI-only | Not a Core blocker. |
| `process.env` | yes | `src/ai/__tests__/generateGeminiExplanation.test.ts` | tests | Not a Client import blocker. |
| `GEMINI_API_KEY` | yes | `src/ai/generateGeminiExplanation.ts`, `src/demo/runGeminiRecommendationDemo.ts`, tests, docs | adapter / CLI / tests / docs | Adapter must stay outside Client bundle. |
| `OPENAI_API_KEY` | no in `src` | n/a | n/a | No OpenAI runtime dependency found in source. |
| `API_KEY`, `SECRET`, `TOKEN` | no material source matches beyond `GEMINI_API_KEY` | n/a | n/a | No additional secret dependency found. |

Core-specific result: no environment-variable matches in `src/core`, `src/domain`, `src/data`, or `src/explanation`.

## 18. External API Dependency Check

Search command:

```powershell
rg "fetch\(|axios|GEMINI_API_KEY|OPENAI_API_KEY|API_KEY|SECRET|TOKEN|Gemini|OpenAI" src
```

| keyword/pattern | found | location | category | risk |
| --- | --- | --- | --- | --- |
| `fetch(` | yes | `src/ai/generateGeminiExplanation.ts` | adapter | Do not import from Client UI. Not part of Core route. |
| `GEMINI_API_KEY` | yes | `src/ai/generateGeminiExplanation.ts`, `src/demo/runGeminiRecommendationDemo.ts`, tests | adapter / CLI / tests | Keep out of initial Web UI. |
| `Gemini` | yes | `src/ai/**`, `src/demo/**`, related tests | adapter / CLI / tests | Not a Core blocker if import route remains `src/core`. |
| `OpenAI` | no source runtime dependency | n/a | n/a | Docs mention OpenAI as a prohibition/reference only. |
| `axios` | no | n/a | n/a | No axios dependency or usage found. |

Core-specific command:

```powershell
rg "fetch\(|axios|GEMINI_API_KEY|OPENAI_API_KEY|API_KEY|SECRET|TOKEN|Gemini|OpenAI" src/core src/domain src/data src/explanation
```

Core-specific result: no matches.

## 19. Gemini / OpenAI / Provider Dependency Check

```txt
Gemini adapter:
Present in src/ai/**.

OpenAI dependency:
No OpenAI runtime dependency found in source.

Fallback explanation:
src/ai/generateGeminiExplanation.ts falls back to caller-provided rule-based text when no key, no fetcher, failed response, invalid response, or unsafe output is encountered.

Provider field:
Gemini/rule-based provider metadata exists in explanation output types and demo formatting, not in Core recommendation results.

Risk:
The adapter uses process.env and fetch, so it must not be imported into Client UI. The Core recommendation route does not import it.
```

Gemini must remain an optional explanation adapter. It must not change `finalScore`, `rawDecision`, `finalDecision`, or `demotions`.

## 20. Search Result Classification

| category | meaning | Client import judgment |
| --- | --- | --- |
| Core body | `src/core/**` and its required domain scoring modules | High relevance. No Node/env/fetch/provider matches found. |
| adapter | `src/ai/**` Gemini explanation adapter | Medium relevance. Do not import into Client UI. |
| CLI-only | `src/demo/**` | Reference only. Safe if not imported by Web UI. |
| tests | `src/**/__tests__/**` | Reference only. Not a Client import blocker. |
| docs | `docs/**` | Reference only. Not a Client import blocker. |
| config files | `tsconfig.json`, `vitest.config.ts`, `.github/**` | Relevant to setup and CI, not Web runtime. |
| unknown | none identified | No unclassified source-risk area found in this audit. |

Important distinction: docs and tests mention Gemini, OpenAI, `process.env`, and Web implementation rules. Those mentions are not evidence that the Core Client import path is unsafe.

## 21. Provisional Client Import Decision

```txt
Client Import Decision:
- Likely safe for direct Client import, with targeted verification in WEB-03
```

Reasoning:

- `src/core/index.ts` exports `recommendSneakers`.
- `src/core/recommendSneakers.ts` imports only domain scoring/type modules.
- The Core route has no direct `fs`, `path`, `process.env`, `fetch`, `axios`, Gemini, OpenAI, or secret-token dependency.
- Gemini/provider code is isolated under `src/ai/**`.
- CLI code is isolated under `src/demo/**`.
- Static sample data appears browser-safe.

Targeted verification is still required in WEB-03 because no actual Web bundler, alias, or Client Component environment exists yet.

## 22. API Route Prohibition Alignment

WEB-02 did not create an API Route.

The current evidence does not require an API Route for the initial Web UI because the Core recommendation route appears browser-safe. If WEB-03 discovers bundler issues, stop Web UI integration and design an adapter strategy in a separate docs-only prompt rather than silently adding an API Route.

Policy:

```txt
Client import is likely safe.
Proceed without API Route for the initial Web UI setup.
Do not import src/ai/** or src/demo/** into Client UI.
If Core import becomes unsafe, stop and design adapter strategy separately.
API Route decision is deferred to a later version.
```

## 23. Required WEB-03 Work

WEB-03 should:

- Add the minimum Web App Setup needed for this existing repository.
- Explicitly decide whether to introduce Next.js, React, and Tailwind.
- Avoid `create-next-app`-style overwrites.
- Avoid overwriting existing `src/**`, Core logic, tests, fixtures, docs, README, and CI.
- Record any planned changes to `package.json` and `pnpm-lock.yaml` before making them.
- Preserve the Core import route through `src/core/index.ts`.
- Keep `src/ai/**` and `src/demo/**` out of Client imports.
- Run `pnpm test` and `pnpm typecheck` after setup.

If WEB-03 creates a path alias, it should map only the intended Web-safe modules. Do not make broad imports from `src` that could pull in `src/ai/**` or `src/demo/**`.

## 24. Decision to Proceed to WEB-03

```txt
Decision:
- Proceed to WEB-03 Web App Setup
```

Reasoning:

- No Web UI environment is installed yet.
- Core direct import appears likely safe.
- Existing repository structure can support a minimal Web UI addition if WEB-03 is careful and explicit.
- The main caution is to avoid importing provider adapter or CLI modules into the Web bundle.

## 25. Risks and Unverified Items

| risk / item | status | WEB-03 handling |
| --- | --- | --- |
| Core Client import risk | low to medium | Verify with the actual Web bundler after setup. |
| Next.js introduction risk | medium | Add manually and minimally; do not use destructive scaffolding. |
| React introduction risk | medium | Add only if selected by WEB-03. |
| Tailwind introduction risk | medium | Add only if selected by WEB-03. |
| `package.json` / lockfile mutation | expected in WEB-03 if dependencies are added | WEB-03 must explicitly permit and review changes. |
| Existing `src/**` collision | medium | Prefer a minimal Web directory plan that avoids changing Core. |
| Sample data browser usability | low | Static data appears browser-safe; verify after bundling. |
| Gemini/provider accidental import | medium | Import only from `src/core` and optionally `src/data`; avoid `src/ai` and `src/demo`. |
| API Route temptation | medium | Do not add API Routes in WEB-03 unless a later prompt explicitly changes the policy. |
| Search false positives | low | Searches were split by category to avoid treating docs/tests as runtime blockers. |
| Encoding of existing docs | present | Existing WEB-01 docs/prompt contain mojibake text; WEB-02 records findings in clean ASCII markdown. |

## 26. Completion Criteria

WEB-02 completion criteria are met:

- `package.json` was checked.
- scripts were checked.
- dependencies and devDependencies were checked.
- Web UI environment presence was checked.
- Next.js, React, Tailwind, and Vite status were checked.
- `src/**` structure was checked.
- `recommendSneakers(input)` definition and export path were checked.
- Core browser executability was checked.
- Node-only API dependency searches were run and classified.
- environment-variable dependency searches were run and classified.
- external API dependency searches were run and classified.
- Gemini/OpenAI/provider dependency status was checked.
- docs/tests references were not treated as Client import blockers.
- provisional Client import decision was recorded.
- WEB-03 required work and proceed decision were recorded.
- No implementation, dependency installation, package metadata change, lockfile change, source change, existing docs change, test config change, or CI change was made.

## Executed Audit Commands

```powershell
git status --short --untracked-files=all
Get-ChildItem -Force
rg --files
Get-Content package.json
Get-Content tsconfig.json
Get-Content docs\web\01_WEB_UI_IMPLEMENTATION_PLAN.md
Get-Content docs\agent-prompts\web\01-web-ui-implementation-plan.md
Get-ChildItem src -Recurse
Get-ChildItem docs\web
Get-Content src\core\recommendSneakers.ts
Get-Content src\core\index.ts
Get-Content src\core\types.ts
Get-Content src\ai\generateGeminiExplanation.ts
Get-Content src\data\index.ts
Get-Content src\demo\runGeminiRecommendationDemo.ts
rg "recommendSneakers"
rg "export .*recommendSneakers"
rg "from .*recommend"
rg 'node:fs|from [''\\"]fs[''\\"]|require\\([''\\"]fs[''\\"]\\)|node:path|from [''\\"]path[''\\"]|require\\([''\\"]path[''\\"]\\)|process\.env|child_process|node:crypto|from [''\\"]crypto[''\\"]|Buffer' src
rg "fetch\(|axios|GEMINI_API_KEY|OPENAI_API_KEY|API_KEY|SECRET|TOKEN|Gemini|OpenAI" src
rg "Gemini|OpenAI|process\.env|fetch\(" docs src
Get-ChildItem .github -Recurse -Force
Get-ChildItem -Recurse -File -Include 'next.config.*','vite.config.*','tailwind.config.*','postcss.config.*','index.html'
Get-ChildItem -Force app,pages,public,src\app,src\pages -ErrorAction SilentlyContinue
Get-Content vitest.config.ts
Get-Content pnpm-workspace.yaml
Get-Content .github\workflows\ci.yml
rg 'node:fs|from [''\\"]fs[''\\"]|require\\([''\\"]fs[''\\"]\\)|node:path|from [''\\"]path[''\\"]|require\\([''\\"]path[''\\"]\\)|process\.env|child_process|node:crypto|from [''\\"]crypto[''\\"]|Buffer' src\core src\domain src\data src\explanation
rg "fetch\(|axios|GEMINI_API_KEY|OPENAI_API_KEY|API_KEY|SECRET|TOKEN|Gemini|OpenAI" src\core src\domain src\data src\explanation
rg "process\.env|fetch\(|GEMINI_API_KEY|OPENAI_API_KEY|API_KEY|SECRET|TOKEN" docs tests
rg --files src | Sort-Object
Get-Content src\ai\index.ts
```

Note: the `rg ... docs tests` command found the expected docs references and also reported that a top-level `tests` directory does not exist. This repository stores tests under `src/**/__tests__/**`.
