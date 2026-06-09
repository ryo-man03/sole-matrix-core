# 14. AI AGENT INSTRUCTIONS

## 1. 実装順

1. 型定義を実装する
2. scoreUtilsを実装する
3. axisWeights / tagBonus / priceScore / overlapPenaltyを実装する
4. balancedScoreを実装する
5. decision / demotionを実装する
6. snapshotを実装する
7. fixturesを実装する
8. golden testを通す

## 2. 禁止事項

- 新機能を追加しない
- UIを作らない
- DBを作らない
- APIを叩かない
- AI説明生成を入れない
- 外部価格APIを入れない
- PreferenceVectorにpriceSensitivityを戻さない
- SneakerVectorにpriceSensitivityを戻さない
- comfort / durabilityを近さで評価しない
- finalScoreを100点超え前提でclampしない
- fixtureの期待値を実装に合わせて勝手に変えない
- テストが落ちたら期待値ではなく実装を疑う

## 3. 実装完了条件

- `pnpm test` が通る
- golden testが通る
- Case A〜Gが通る
- Snapshot比較が通る
