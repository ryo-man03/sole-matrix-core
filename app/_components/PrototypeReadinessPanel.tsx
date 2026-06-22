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
    candidate: candidateDisplayName.trim() ? "確認済み" : "確認が必要",
    tags: selectedTagLabels.length > 0 ? "確認済み" : "確認が必要",
    priceMemo: hasPriceMemo ? "入力あり" : "入力なし",
    budgetMemo: hasBudgetMemo ? "入力あり" : "入力なし",
    diagnosis:
      hasDiagnosisAnswers === undefined
        ? "この画面では未確認"
        : hasDiagnosisAnswers
          ? "入力あり"
          : "入力なし",
  } as const;

  const itemsNeedingConfirmation = [
    !hasPriceMemo ? "価格メモが入力されていません。" : null,
    !hasBudgetMemo ? "予算メモが入力されていません。" : null,
    hasDiagnosisAnswers === undefined
      ? "診断回答の有無は、この画面ではまだ確認できません。"
      : !hasDiagnosisAnswers
        ? "診断回答が入力されていません。"
        : null,
    "価格・予算メモの意味や扱いは、Production側で確認が必要です。",
  ].filter((item): item is string => item !== null);

  return (
    <section
      aria-labelledby="prototype-readiness-title"
      style={{ display: "grid", gap: 14, marginTop: 18 }}
    >
      <div className="candidate-card">
        <div className="candidate-card-heading">
          <p className="candidate-step-kicker">Prototype表示のみ</p>
          <h3 id="prototype-readiness-title">推薦準備チェック</h3>
        </div>
        <div className="candidate-summary-notes">
          <p>現在は推薦結果ではありません。</p>
          <p>入力内容の整理状態を表示しています。</p>
          <p>画面上で受け取った候補名と選択タグを表示しています。</p>
        </div>
      </div>

      <div className="candidate-card">
        <div className="candidate-card-heading">
          <p className="candidate-step-kicker">確認済み</p>
          <h3>確認できた入力</h3>
          <p>入力された候補名とタグを確認できました。</p>
        </div>
        <div className="candidate-summary">
          <dl className="candidate-summary-list">
            <div>
              <dt>候補名</dt>
              <dd>{candidateDisplayName || "未入力"}</dd>
            </div>
            <div>
              <dt>候補名の整理状態</dt>
              <dd>{prototypeReadinessState.candidate}</dd>
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
          <div>
            <p className="candidate-summary-kicker">
              選択タグ（{prototypeReadinessState.tags}）
            </p>
            {selectedTagLabels.length > 0 ? (
              <ul className="candidate-summary-tags">
                {selectedTagLabels.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            ) : (
              <p className="candidate-summary-empty">選択されていません</p>
            )}
          </div>
        </div>
      </div>

      <div className="candidate-card">
        <div className="candidate-card-heading">
          <p className="candidate-step-kicker">確認が必要</p>
          <h3>確認が必要な項目</h3>
          <p>入力内容に確認が必要な項目があります。</p>
        </div>
        <div className="candidate-summary-notes">
          {itemsNeedingConfirmation.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </div>

      <div className="candidate-card">
        <div className="candidate-card-heading">
          <p className="candidate-step-kicker">未接続</p>
          <h3>まだ未接続の項目</h3>
        </div>
        <div className="candidate-summary-notes">
          <p>推薦機能にはまだ接続されていません。</p>
          <p>Production側の判断が残っています。</p>
          <p>入力内容から推薦用の値を作成していません。</p>
        </div>
      </div>

      <div className="candidate-card">
        <div className="candidate-card-heading">
          <p className="candidate-step-kicker">準備中</p>
          <h3>次に決めること</h3>
        </div>
        <div className="candidate-summary-notes">
          <p>候補の識別方法を決めます。</p>
          <p>特徴情報の参照元と、診断回答の扱いを決めます。</p>
          <p>価格・予算情報の意味と扱いを決めます。</p>
          <p>表示内容を確認したうえで、次の実装範囲を決めます。</p>
        </div>
      </div>
    </section>
  );
}
