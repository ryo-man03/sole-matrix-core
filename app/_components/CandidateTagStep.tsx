import {
  candidateSneakerTagOptions,
  maxCandidateTagSelection,
  type CandidateTagId,
} from "../_data/candidateSneakerOptions";

import { CandidateTagChip } from "./CandidateTagChip";

type CandidateTagStepProps = {
  selectedTagIds: CandidateTagId[];
  tagError: string;
  onToggleTag: (tagId: CandidateTagId) => void;
};

export function CandidateTagStep({
  selectedTagIds,
  tagError,
  onToggleTag,
}: CandidateTagStepProps) {
  const isMaxSelected = selectedTagIds.length >= maxCandidateTagSelection;

  return (
    <div className="candidate-card">
      <div className="candidate-card-heading">
        <p className="candidate-step-kicker">Step 2</p>
        <h3>特徴を整理する</h3>
        <p>
          候補の印象に近いものを選びます。タグは自動では付きません。自分で見た印象だけを選んでください。
        </p>
      </div>

      <div className="candidate-tag-toolbar">
        <p>{selectedTagIds.length} / {maxCandidateTagSelection} 選択中</p>
        {isMaxSelected ? (
          <p className="candidate-tag-limit" aria-live="polite">
            5個選択済みです。別のタグを選ぶ場合は、先に1つ解除してください。
          </p>
        ) : null}
      </div>

      <div className="candidate-tag-grid">
        {candidateSneakerTagOptions.map((option) => {
          const isSelected = selectedTagIds.includes(option.id);

          return (
            <CandidateTagChip
              isDisabled={isMaxSelected && !isSelected}
              isSelected={isSelected}
              key={option.id}
              onToggle={onToggleTag}
              option={option}
            />
          );
        })}
      </div>

      {tagError ? (
        <p className="candidate-field-error" aria-live="polite">
          {tagError}
        </p>
      ) : (
        <p className="candidate-field-helper">
          迷う場合は、まず一番近い特徴を1つだけ選んでも大丈夫です。
        </p>
      )}
    </div>
  );
}
