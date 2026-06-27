# Core v1 architecture and extension points

## 責務境界

```txt
validation.ts
  HTTP入力の安全な正規化

diagnosis.ts / preferenceVector.ts
  診断回答・タグ → 8軸 PreferenceVector

scoring.ts
  Balanced Score adapter / Ryo Score 純粋関数

decision.ts
  score・budgetFit・risk・情報量・readiness → Decision

explanation.ts
  常に利用できる rule-based explanation

geminiExplanation.ts
  structured explanation provider。失敗時は rule-based へ戻る

repository.ts
  CandidateRepository / FeedbackRepository と mock実装

service.ts
  上記を組み合わせる唯一の推薦本線
```

検索入力や別UIを追加する場合も、最終判定は `recommendCoreV1` へ寄せます。別の Decision ロジックは作りません。

## Explanation provider を追加する

`service.ts` の `ExplanationProvider` を実装します。provider が受け取る `ExplanationInput` は Core 確定後の読み取り専用 facts です。

provider は `RecommendationExplanation` を返し、score や Decision を返しません。OpenAIなど別providerを追加する場合も、JSON schema validation と `createRuleBasedExplanation` fallback を同じ境界で維持します。

## Candidate provider を追加する

`CandidateRepository` の `listCandidates` を実装し、`CandidateProfile` へ正規化します。

新providerの応答を service や scoring へ直接渡してはいけません。次を検証してから repository 境界を通します。

- 8軸が0〜100
- tagが既知の `SneakerTag`
- risk / informationCompleteness / readiness が明示的
- 外部価格の根拠と取得時刻が追跡可能

## Rakuten が HTTP 200 になった場合

1. 隔離 smoke で `shapeValid: true` を確認する。
2. raw response を保存・表示せず、専用 normalizer を追加する。
3. normalizer の fixture test を追加する。
4. `CandidateRepository` 実装として接続する。
5. local fallback を残したまま provider readiness を切り替える。

Core v1 の `scoring.ts` や `decision.ts` から Rakuten を直接呼びません。

## Supabase feedback 移行案

現行の `createMockFeedbackRepository` を `SupabaseFeedbackRepository` へ差し替えられる構造です。本番接続時は API Route の server side だけに client を置き、ブラウザへ service role key を渡しません。

参考 migration 案（未適用）:

```sql
create table public.recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recommendation_id text not null,
  sentiment text not null check (sentiment in ('helpful', 'not_helpful', 'unsure')),
  comment text check (char_length(comment) <= 500),
  created_at timestamptz not null default now()
);

alter table public.recommendation_feedback enable row level security;

create policy "users insert own feedback"
on public.recommendation_feedback
for insert to authenticated
with check (auth.uid() = user_id);

create policy "users read own feedback"
on public.recommendation_feedback
for select to authenticated
using (auth.uid() = user_id);
```

認証を導入するまではこの migration を適用せず、mock repository を使います。

## Scoring rule を変更する

- Balanced Score の legacy adapter・表示用内訳: `scoring.ts`
- Ryo Score の重み: `scoring.ts`
- Decision threshold: `decision.ts`
- 診断質問の軸寄与: `preferenceVector.ts`

変更時は既存 golden test を削除せず、Core v1 の domain test を追加・更新して意図を固定します。
