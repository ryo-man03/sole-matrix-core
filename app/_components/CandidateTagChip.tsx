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
  return (
    <button
      aria-pressed={isSelected}
      className="candidate-tag-chip"
      data-selected={isSelected}
      disabled={isDisabled}
      onClick={() => onToggle(option.id)}
      type="button"
    >
      <span className="candidate-tag-label">
        {isSelected ? "選択中: " : ""}
        {option.label}
      </span>
      <span className="candidate-tag-helper">{option.helper}</span>
    </button>
  );
}
