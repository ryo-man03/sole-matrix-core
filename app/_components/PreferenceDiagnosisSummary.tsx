import type { DiagnosisAnswerId, DiagnosisQuestion } from "../_data/preferenceDiagnosisQuestions";

const answerLabels: Record<DiagnosisAnswerId, string> = { like: "好き", neutral: "普通", dislike: "苦手" };

export function PreferenceDiagnosisSummary({ questions, selectedAnswerByQuestionId }: { questions: DiagnosisQuestion[]; selectedAnswerByQuestionId: Record<string, DiagnosisAnswerId | undefined> }) {
  return <section className="diagnosis-summary" aria-labelledby="diagnosis-summary-title"><p className="diagnosis-summary-kicker">回答サマリー</p><h3 id="diagnosis-summary-title">8問の回答を確認</h3><p className="diagnosis-summary-lead">未回答は中立として扱い、Coreで8軸の好みへ変換します。</p><dl className="diagnosis-summary-list">{questions.map((question, index) => <div className="diagnosis-summary-item" key={question.id}><dt><span>Q{index + 1}</span>{question.question}</dt><dd>{answerLabels[selectedAnswerByQuestionId[question.id] ?? "neutral"]}</dd></div>)}</dl><p className="diagnosis-summary-note">推薦候補はGemini調査結果を検証するか、具体モデルのfallback catalogから選び、Coreで再評価します。</p></section>;
}
