type PrototypeReadinessPanelProps = {
  candidateDisplayName: string;
  selectedTagLabels: string[];
  hasPriceMemo: boolean;
  hasBudgetMemo: boolean;
  hasDiagnosisAnswers?: boolean;
};

export function PrototypeReadinessPanel({
  candidateDisplayName,
  selectedTagLabels,
  hasPriceMemo,
  hasBudgetMemo,
  hasDiagnosisAnswers,
}: PrototypeReadinessPanelProps) {
  const prototypeReadinessState = {
    candidate: candidateDisplayName.trim() ? "入力あり" : "入力なし",
    tags: selectedTagLabels.length > 0 ? "選択あり" : "選択なし",
    priceMemo: hasPriceMemo ? "入力あり" : "入力なし",
    budgetMemo: hasBudgetMemo ? "入力あり" : "入力なし",
    diagnosis:
      hasDiagnosisAnswers === undefined
        ? "参考表示"
        : hasDiagnosisAnswers
          ? "入力あり"
          : "入力なし",
  } as const;

  const nextCheckItems = [
    !hasPriceMemo ? "価格メモが入力されていません。" : null,
    !hasBudgetMemo ? "予算メモが入力されていません。" : null,
    hasDiagnosisAnswers === undefined
      ? "診断回答の扱いは、別の画面とあわせて整理します。"
      : !hasDiagnosisAnswers
        ? "診断回答が入力されていません。"
        : null,
    "正式な推薦に使う情報はまだ整理中です。",
    "推薦機能にはまだ接続していません。",
  ].filter((item): item is string => item !== null);

  return (
    <section
      aria-labelledby="prototype-readiness-title"
      style={{ display: "grid", gap: 14, marginTop: 18 }}
    >
      <div className="candidate-card">
        <div className="candidate-card-heading">
          <p className="candidate-step-kicker">準備状態の確認</p>
          <h3 id="prototype-readiness-title">推薦準備チェック</h3>
        </div>
        <div className="candidate-summary-notes">
          <p>現在は推薦結果ではありません。</p>
          <p>入力内容の整理状態を表示しています。</p>
        </div>
      </div>

      <div className="candidate-card">
        <div className="candidate-card-heading">
          <p className="candidate-step-kicker">入力を整理中</p>
          <h3>受け取った入力</h3>
          <p>画面上で受け取った入力を、状態だけでまとめています。</p>
        </div>
        <div className="candidate-summary">
          <dl className="candidate-summary-list">
            <div>
              <dt>候補名</dt>
              <dd>{prototypeReadinessState.candidate}</dd>
            </div>
            <div>
              <dt>選択タグ</dt>
              <dd>{prototypeReadinessState.tags}</dd>
            </div>
            <div>
              <dt>価格メモ</dt>
              <dd>{prototypeReadinessState.priceMemo}</dd>
            </div>
            <div>
              <dt>予算メモ</dt>
              <dd>{prototypeReadinessState.budgetMemo}</dd>
            </div>
            <div>
              <dt>診断回答</dt>
              <dd>{prototypeReadinessState.diagnosis}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="candidate-card">
        <div className="candidate-card-heading">
          <p className="candidate-step-kicker">整理中</p>
          <h3>次に確認すること</h3>
          <p>まだ推薦には使わない入力と、今後の整理事項です。</p>
        </div>
        <div className="candidate-summary-notes">
          {nextCheckItems.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
