# WEB-08.5: App Lib Test Coverage Include Summary

## 1. Purpose

WEB-08.5 makes the WEB-08 mapper test run as part of the normal repository test command.

The only test target added to Vitest is:

```txt
app/_lib/**/*.test.ts
```

This includes `app/_lib/core-input/candidateInputMapper.test.ts` in `pnpm test` without changing mapper implementation, mapper test content, Core execution, Result UI, or package scripts.

## 2. Changed Files

- `vitest.config.ts`
- `docs/web/08_5_TEST_COVERAGE_SUMMARY.md`

## 3. package.json Test Script Check

`package.json` was read but not changed.

The `test` script is:

```json
"test": "vitest run"
```

Confirmed:

- `pnpm test` calls `vitest run`.
- `pnpm test` does not directly specify `src` or another path.
- `pnpm test` does not pass `--config`.
- `pnpm test` uses the default `vitest.config.ts`.
- Updating `test.include` in `vitest.config.ts` is reflected in `pnpm test`.

## 4. Vitest Include Change

Before WEB-08.5:

```ts
include: ["src/**/*.test.ts"]
```

After WEB-08.5:

```ts
include: ["src/**/*.test.ts", "app/_lib/**/*.test.ts"]
```

The existing `src/**/*.test.ts` target was preserved. No existing test target was removed or narrowed.

## 5. pnpm test Inclusion Result

`pnpm exec vitest run app/_lib/core-input/candidateInputMapper.test.ts` passed with:

```txt
Test Files  1 passed (1)
Tests       7 passed (7)
```

`pnpm test` passed with:

```txt
Test Files  12 passed (12)
Tests       70 passed (70)
```

The normal `pnpm test` output did not list individual file names with the default reporter, but WEB-08 recorded the previous repository suite as `11 passed` files and `63 passed` tests. The added mapper test independently has `1 passed` file and `7 passed` tests. After WEB-08.5, normal `pnpm test` reports `12 passed` files and `70 passed` tests, which confirms `candidateInputMapper.test.ts` is included in the normal run.

## 6. Verification Results

Initial status:

```txt
git status --short --untracked-files=all
<no output>
```

Mapper unit test:

```txt
pnpm exec vitest run app/_lib/core-input/candidateInputMapper.test.ts
passed
Test Files 1 passed
Tests 7 passed
```

Repository test suite:

```txt
pnpm test
passed
Test Files 12 passed
Tests 70 passed
```

Typecheck:

```txt
pnpm typecheck
passed
```

Web build:

```txt
pnpm web:build
passed
Route (app)
- /
- /_not-found
```

## 7. Files Not Changed

Confirmed not changed:

- `package.json`
- `pnpm-lock.yaml`
- `src/**`
- `app/page.tsx`
- `app/globals.css`
- `app/_components/**`
- `app/_data/**`
- `app/_lib/core-input/types.ts`
- `app/_lib/core-input/candidateInputMapper.ts`
- `app/_lib/core-input/candidateInputMapper.test.ts`
- `docs/web/08_CORE_INPUT_MAPPER_SUMMARY.md`
- `docs/web/07_CORE_INPUT_MAPPING_PLAN.md`
- `docs/agent-prompts/**`
- `.github/**`
- `README.md`

## 8. Final Diff Checks

Final `git status --short --untracked-files=all`:

```txt
 M vitest.config.ts
?? docs/web/08_5_TEST_COVERAGE_SUMMARY.md
```

Final `git diff --stat`:

```txt
vitest.config.ts | 2 +-
1 file changed, 1 insertion(+), 1 deletion(-)
```

Note: `docs/web/08_5_TEST_COVERAGE_SUMMARY.md` is a new untracked file, so it is visible in `git status --short --untracked-files=all` but not in default `git diff --stat`.

Final `git diff --name-status`:

```txt
M       vitest.config.ts
```

Note: `docs/web/08_5_TEST_COVERAGE_SUMMARY.md` is a new untracked file, so it is visible in `git status --short --untracked-files=all` but not in default `git diff --name-status`.

## 9. Next Step

Next WEB number:

```txt
WEB-09: Core Recommendation Dry Run / Integration Guard
```

WEB-09 should use WEB-08 mapper output to identify missing Core values needed for a safe dry run. It should not move directly into Result List or Result Detail UI.
