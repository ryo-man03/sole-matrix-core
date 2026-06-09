# 15. FINAL CHECKLIST

## 1. スコープ

- [ ] Core v0.1の範囲が広がっていない
- [ ] UIが入っていない
- [ ] DBが入っていない
- [ ] AIが入っていない
- [ ] 外部APIが入っていない

## 2. 型

- [ ] TasteAxisがある
- [ ] QualityAxisがある
- [ ] PreferenceVectorがある
- [ ] PreferenceVectorにpriceSensitivityがない
- [ ] PreferencePolicyがある
- [ ] AxisImportanceがある
- [ ] PreferenceProfileがある
- [ ] SneakerVectorがある
- [ ] SneakerVectorにpriceSensitivityがない

## 3. スコア

- [ ] TasteAxisは近さで評価
- [ ] QualityAxisは靴側の値で評価
- [ ] finalScoreは100点内配分
- [ ] priceScoreはPolicyから計算
- [ ] overlapPenaltyはPolicyから計算
- [ ] Demotion発生ケースがある

## 4. fixture / test

- [ ] fixtureがTypeScriptで出ている
- [ ] golden testがある
- [ ] expectedScoreBreakdownsがある
- [ ] expectedDecisionsがある
- [ ] expectedDemotionsがある
- [ ] expectedSnapshotsがある
- [ ] Case AのA1_canvas_high_overlap名が修正済み
- [ ] Snapshot期待値がある

## 5. ドキュメント

- [ ] READMEがある
- [ ] AI Agent向け禁止事項がある
- [ ] ロードマップが固定されている
- [ ] ここから実装に進める
