import type { DiagnosisAnswerId, DiagnosisQuestion } from "../_data/preferenceDiagnosisQuestions";
import type { RyoPreferenceVector } from "../_lib/ryo-mode-v4/types";
import { summarizeRyoPreferenceVector } from "../_lib/ryo-mode-v4/vector";

export function PreferenceDiagnosisSummary({ questions, selectedAnswerByQuestionId, vector }: { questions: DiagnosisQuestion[]; selectedAnswerByQuestionId: Record<string, DiagnosisAnswerId | undefined>; vector: RyoPreferenceVector }) {
  const summary = summarizeRyoPreferenceVector(vector);
  return <section className="diagnosis-summary" aria-labelledby="diagnosis-summary-title"><p className="diagnosis-summary-kicker">回答サマリー</p><h3 id="diagnosis-summary-title">11問の回答を確認</h3><p className="diagnosis-summary-lead">回答をRyoPreferenceVector v4へ変換し、既存Coreの判断とRyo Mode補助評価の両方に使います。</p><dl className="diagnosis-summary-list">{questions.map((question, index) => <div className="diagnosis-summary-item" key={question.id}><dt><span>Q{index + 1}</span>{question.question}</dt><dd>{question.options.find((option) => option.id === selectedAnswerByQuestionId[question.id])?.label ?? "未回答"}</dd></div>)}</dl><div className="core-v1-provider-note" data-ryo-vector-summary><strong>Vector summary</strong><p>Ryo反映: {summary.ryoInfluence} / 予算上限: {summary.budgetCeilingYen ? `${summary.budgetCeilingYen.toLocaleString("ja-JP")}円` : "上限指定なし"}</p><p>主な回答: {summary.dominantSignals.join(" / ") || "個別条件を優先"}</p></div><p className="diagnosis-summary-note">推薦候補はGemini調査結果を検証するか、具体モデルのfallback catalogから選び、Coreで再評価します。</p></section>;
}
