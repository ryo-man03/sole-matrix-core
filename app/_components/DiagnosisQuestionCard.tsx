import type { DiagnosisAnswerId, DiagnosisQuestion } from "../_data/preferenceDiagnosisQuestions";
import { DiagnosisAnswerButtonGroup } from "./DiagnosisAnswerButtonGroup";

export function DiagnosisQuestionCard({ currentIndex, totalCount, question, selectedAnswerId, onSelectAnswer }: { currentIndex: number; totalCount: number; question: DiagnosisQuestion; selectedAnswerId: DiagnosisAnswerId | undefined; onSelectAnswer: (answerId: DiagnosisAnswerId) => void }) {
  return <article className="diagnosis-question-card"><div className="diagnosis-card-visual" aria-hidden="true"><span>SOLE</span><span>Q{currentIndex + 1}</span></div><div className="diagnosis-question-content"><p className="diagnosis-question-count">{currentIndex + 1}問目 / {totalCount}問</p><h3>{question.question}</h3><p className="diagnosis-question-helper">{question.helperText}</p><DiagnosisAnswerButtonGroup questionId={question.id} options={question.options} selectedAnswerId={selectedAnswerId} onSelect={onSelectAnswer} /></div></article>;
}
