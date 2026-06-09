# Prompt 07: Gemini CLI Demo

Add a separate Gemini-enabled CLI demo for SOLE//MATRIX Core v0.2.

Scope:

* Keep the existing `pnpm demo` unchanged.
* Add `pnpm demo:gemini`.
* Use `sampleProfiles`, `sampleSneakers`, owned sneaker sample data, and `recommendSneakers(input)`.
* Explain only the top three recommendation results.
* For each result, create a rule-based explanation first and pass it as fallback to the Gemini adapter.
* If `GEMINI_API_KEY` is not set, do not call Gemini and print `GEMINI_API_KEY not set; using rule-based fallback.`
* Do not read `GOOGLE_API_KEY`.
* Do not let Gemini alter `finalScore`, `rawDecision`, `finalDecision`, or `demotions`.
* Do not assert real prices, stock, resale value, or authenticity.
* Do not add dependencies or update `pnpm-lock.yaml`.

Editable files:

* `src/demo/runGeminiRecommendationDemo.ts`
* `src/demo/formatGeminiRecommendationDemo.ts`
* `src/demo/__tests__/formatGeminiRecommendationDemo.test.ts`
* `docs/agent-prompts/v0.2/07-gemini-cli-demo.md`
* `package.json`

Verification:

```bash
pnpm demo
pnpm demo:gemini
pnpm test
pnpm typecheck
git status --short --untracked-files=all
git diff --stat
git diff --name-status
git diff -- package.json
```
