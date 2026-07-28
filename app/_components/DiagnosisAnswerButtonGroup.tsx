import type { DiagnosisAnswerId, DiagnosisQuestion } from "../_data/preferenceDiagnosisQuestions";

export function DiagnosisAnswerButtonGroup({ questionId, options, selectedAnswerId, onSelect }: { questionId: string; options: DiagnosisQuestion["options"]; selectedAnswerId: DiagnosisAnswerId | undefined; onSelect: (answerId: DiagnosisAnswerId) => void }) {
  return <div className="diagnosis-answer-group" role="group" aria-label="回答を選ぶ">{options.map((option) => { const selected = option.id === selectedAnswerId; return <button aria-pressed={selected} className="diagnosis-answer-button" data-selected={selected ? "true" : "false"} key={`${questionId}-${option.id}`} onClick={() => onSelect(option.id)} type="button"><span className="diagnosis-answer-label">{option.label}</span><span className="diagnosis-answer-description">{option.description}</span>{selected ? <span className="diagnosis-answer-state">選択中</span> : null}</button>; })}</div>;
}
