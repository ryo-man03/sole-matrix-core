# Agent Prompt: v0.2 Plan

## 1. このプロンプトの目的

SOLE//MATRIX Core v0.1を壊さずに、次段階であるv0.2「Coreを使った最小デモ」の開発計画をリポジトリ内に追加する。

今回はコード実装を行わない。目的は、v0.2へ安全に進むための設計・計画ドキュメントを固定すること。

## 2. 編集してよいファイル

- `docs/v0.2-development-plan.md`
- `docs/agent-prompts/v0.2/01-plan.md`

## 3. 編集してはいけないファイル

- `src/**`
- `package.json`
- `pnpm-lock.yaml`
- `.github/**`
- `README.md`
- 既存fixture
- 既存test
- 既存のCoreロジック

## 4. 実行すべきコマンド

```bash
pnpm test
pnpm typecheck
git diff --stat
git status
```

## 5. 期待するテスト結果

- 既存テストがすべて成功する
- `pnpm typecheck`が成功する
- 差分は`docs/**`のみ
- Coreロジックに変更がない
- fixtureや期待値に変更がない
- `README.md`を変更していない
- `package.json`を変更していない

## 6. commit message案

```txt
docs: add v0.2 development plan without changing core
```

## 7. 完了後に確認すべきこと

- 追加したファイルが次の2つだけであること
  - `docs/v0.2-development-plan.md`
  - `docs/agent-prompts/v0.2/01-plan.md`
- `src/**`に差分がないこと
- `README.md`に差分がないこと
- `package.json`に差分がないこと
- 既存fixtureと既存testに差分がないこと
- `pnpm test`が成功していること
- `pnpm typecheck`が成功していること
- `git diff --stat`で差分が`docs/**`のみであること
- 次に実装すべきPrompt番号が`02-public-api`であること
