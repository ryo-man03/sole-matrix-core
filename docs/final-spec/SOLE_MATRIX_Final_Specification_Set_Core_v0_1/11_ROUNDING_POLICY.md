# 11. ROUNDING POLICY

## 1. 結論

丸め規則を固定する。  
丸めが曖昧だとgolden testが不安定になる。

## 2. ルール

| 項目 | ルール |
|---|---|
| 内部計算 | 丸めない |
| ScoreBreakdown保存 | 小数第2位 |
| axisWeightsApplied | 小数第4位 |
| Decision判定 | 丸め前finalScoreを使う |
| fixture比較 | 丸め後の値を使う |
| createdAt | テスト用固定値を使う |

## 3. 固定日時

```ts
export const FIXED_TEST_NOW = "2026-06-09T00:00:00Z";
```

## 4. 実装例

```ts
export function roundScore(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundWeight(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}
```

## 5. 禁止

- 実装ごとに丸め桁を変えない
- Decision判定に丸め後だけを使わない
- createdAtに現在時刻を使ってgolden testを壊さない
