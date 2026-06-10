import type { CandidateTagOption } from "../_data/candidateSneakerOptions";

type CandidateTagChipProps = {
  option: CandidateTagOption;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: (id: CandidateTagOption["id"]) => void;
};

export function CandidateTagChip({
  option,
  isSelected,
  isDisabled,
  onToggle,
}: CandidateTagChipProps) {
  const content = (
    <>
      <span className="candidate-tag-label">
        {isSelected ? "選択中：" : ""}
        {option.label}
      </span>
      <span className="candidate-tag-helper">{option.helper}</span>
    </>
  );

  if (isSelected) {
    return (
      <button
        aria-pressed="true"
        className="candidate-tag-chip"
        data-selected={true}
        disabled={isDisabled}
        onClick={() => onToggle(option.id)}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <button
      aria-pressed="false"
      className="candidate-tag-chip"
      data-selected={false}
      disabled={isDisabled}
      onClick={() => onToggle(option.id)}
      type="button"
    >
      {content}
    </button>
  );
}