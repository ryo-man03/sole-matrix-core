export function DiagnosisProgress({
  currentIndex,
  totalCount,
  answeredCount,
  category,
}: {
  currentIndex: number;
  totalCount: number;
  answeredCount: number;
  category: string;
}) {
  const currentNumber = currentIndex + 1;
  const progressPercent = Math.round((currentNumber / totalCount) * 100);
  return (
    <div className="diagnosis-progress" aria-label="診断の進行状況">
      <div className="diagnosis-progress-text">
        <span>質問 {currentNumber} / {totalCount}</span>
        <span>{answeredCount}問回答済み</span>
      </div>
      <strong className="diagnosis-progress-category">{category}</strong>
      <div
        className="diagnosis-progress-track"
        role="progressbar"
        aria-label={`質問 ${currentNumber} / ${totalCount}、${category}`}
        aria-valuemin={1}
        aria-valuemax={totalCount}
        aria-valuenow={currentNumber}
      >
        <span className="diagnosis-progress-bar" style={{ width: `${progressPercent}%` }} />
      </div>
    </div>
  );
}
