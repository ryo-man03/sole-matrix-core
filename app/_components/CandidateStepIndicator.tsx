const candidateSteps = ["基本情報", "特徴タグ", "確認"];

type CandidateStepIndicatorProps = {
  currentStep: number;
};

export function CandidateStepIndicator({
  currentStep,
}: CandidateStepIndicatorProps) {
  return (
    <ol className="candidate-step-indicator" aria-label="入力ステップ">
      {candidateSteps.map((step, index) => {
        const stepNumber = index + 1;
        const isCurrent = stepNumber === currentStep;
        const isComplete = stepNumber < currentStep;

        return (
          <li
            className="candidate-step-item"
            data-current={isCurrent}
            data-complete={isComplete}
            key={step}
          >
            <span className="candidate-step-number">{stepNumber}</span>
            <span className="candidate-step-label">{step}</span>
            <span className="candidate-step-state">
              {isCurrent ? "現在" : isComplete ? "入力済み" : "未入力"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
