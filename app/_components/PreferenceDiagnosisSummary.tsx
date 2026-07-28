import type { DiagnosisAnswerId, DiagnosisQuestion } from "../_data/preferenceDiagnosisQuestions";
import {
  purchasePurposeLabel,
  type UserSneakerContext,
} from "../_lib/diagnosis/sneakerContext";
import type { RyoPreferenceVector } from "../_lib/ryo-mode-v4/types";
import { summarizeRyoPreferenceVector } from "../_lib/ryo-mode-v4/vector";

export function PreferenceDiagnosisSummary({
  context,
  onEditAnswers,
  onEditContext,
  questions,
  selectedAnswerByQuestionId,
  vector,
}: {
  context: UserSneakerContext;
  onEditAnswers: () => void;
  onEditContext: () => void;
  questions: DiagnosisQuestion[];
  selectedAnswerByQuestionId: Record<string, DiagnosisAnswerId | undefined>;
  vector: RyoPreferenceVector;
}) {
  const summary = summarizeRyoPreferenceVector(vector);
  const summaryIds = ["style", "pantsFit", "materialAging", "color", "budget", "ryoStrength"];
  const summaryQuestions = questions.filter((question) => summaryIds.includes(question.id));
  return (
    <section className="diagnosis-summary" aria-labelledby="diagnosis-summary-title">
      <p className="diagnosis-summary-kicker">回答サマリー</p>
      <h3 id="diagnosis-summary-title">今回の診断条件</h3>
      <p className="diagnosis-summary-lead">購入目的と主要な回答を確認できます。詳細な診断ベクトルは結果の技術情報へ分けています。</p>
      <dl className="diagnosis-summary-list">
        <div className="diagnosis-summary-item">
          <dt>購入目的</dt>
          <dd>{purchasePurposeLabel(context.purchasePurpose)}</dd>
        </div>
        {summaryQuestions.map((question) => (
          <div className="diagnosis-summary-item" key={question.id}>
            <dt>{question.question}</dt>
            <dd>{question.options.find((option) => option.id === selectedAnswerByQuestionId[question.id])?.label ?? "未回答"}</dd>
          </div>
        ))}
        <div className="diagnosis-summary-item">
          <dt>所有モデルの反映</dt>
          <dd>{context.ownedModels.length}件</dd>
        </div>
        <div className="diagnosis-summary-item">
          <dt>避けたい傾向の反映</dt>
          <dd>{context.dislikedModels.length + context.dislikedSignals.length}件</dd>
        </div>
      </dl>
      <div className="diagnosis-summary-actions">
        <button className="diagnosis-secondary-button" onClick={onEditContext} type="button">購入目的を編集する</button>
        <button className="diagnosis-secondary-button" onClick={onEditAnswers} type="button">11問の回答を編集する</button>
      </div>
      <div className="core-v1-provider-note" data-ryo-vector-summary>
        <strong>診断の要点</strong>
        <p>Ryo反映: {summary.ryoInfluence} / 予算上限: {summary.budgetCeilingYen ? `${summary.budgetCeilingYen.toLocaleString("ja-JP")}円` : "上限指定なし"}</p>
        <p>主な回答: {summary.dominantSignals.join(" / ") || "個別条件を優先"}</p>
      </div>
      <p className="diagnosis-summary-note">推薦候補はGemini調査結果を検証するか、具体モデルのCore候補から選び、Coreで再評価します。</p>
    </section>
  );
}
