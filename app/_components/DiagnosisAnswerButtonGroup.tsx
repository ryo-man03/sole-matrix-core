import type {
  DiagnosisAnswerId,
  DiagnosisQuestion,
} from "../_data/preferenceDiagnosisQuestions";

type DiagnosisAnswerButtonGroupProps = {
  questionId: string;
  options: DiagnosisQuestion["options"];
  selectedAnswerId: DiagnosisAnswerId | undefined;
  onSelect: (answerId: DiagnosisAnswerId) => void;
};

export function DiagnosisAnswerButtonGroup({
  questionId,
  options,
  selectedAnswerId,
  onSelect,
}: DiagnosisAnswerButtonGroupProps) {
  return (
    <div
      className="diagnosis-answer-group"
      role="group"
      aria-label="回答を選ぶ"
    >
      {options.map((option) => {
        const isSelected = option.id === selectedAnswerId;

        return (
          <button
            aria-pressed={isSelected}
            className="diagnosis-answer-button"
            data-selected={isSelected ? "true" : "false"}
            key={`${questionId}-${option.id}`}
            onClick={() => onSelect(option.id)}
            type="button"
          >
            <span className="diagnosis-answer-label">{option.label}</span>
            <span className="diagnosis-answer-description">
              {option.description}
            </span>
            {isSelected ? (
              <span className="diagnosis-answer-state">選択中</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
