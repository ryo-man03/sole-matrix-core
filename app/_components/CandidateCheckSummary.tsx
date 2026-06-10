import type { CandidateTagId } from "../_data/candidateSneakerOptions";
import { candidateSneakerTagOptions } from "../_data/candidateSneakerOptions";

type CandidateCheckSummaryProps = {
  sneakerName: string;
  brand: string;
  seenPriceText: string;
  budgetText: string;
  memo: string;
  selectedTagIds: CandidateTagId[];
};

const emptyLabel = "未入力";

function displayValue(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : emptyLabel;
}

export function CandidateCheckSummary({
  sneakerName,
  brand,
  seenPriceText,
  budgetText,
  memo,
  selectedTagIds,
}: CandidateCheckSummaryProps) {
  const selectedTags = selectedTagIds
    .map((tagId) =>
      candidateSneakerTagOptions.find((option) => option.id === tagId),
    )
    .filter((option): option is NonNullable<typeof option> => Boolean(option));

  return (
    <div className="candidate-summary">
      <div>
        <p className="candidate-summary-kicker">気になる一足</p>
        <dl className="candidate-summary-list">
          <div>
            <dt>スニーカー名</dt>
            <dd>{displayValue(sneakerName)}</dd>
          </div>
          <div>
            <dt>ブランド</dt>
            <dd>{displayValue(brand)}</dd>
          </div>
          <div>
            <dt>見かけた金額・購入予定額</dt>
            <dd>{displayValue(seenPriceText)}</dd>
          </div>
          <div>
            <dt>予算</dt>
            <dd>{displayValue(budgetText)}</dd>
          </div>
          <div>
            <dt>メモ</dt>
            <dd>{displayValue(memo)}</dd>
          </div>
        </dl>
      </div>

      <div>
        <p className="candidate-summary-kicker">選択タグ</p>
        {selectedTags.length > 0 ? (
          <ul className="candidate-summary-tags">
            {selectedTags.map((tag) => (
              <li key={tag.id}>{tag.label}</li>
            ))}
          </ul>
        ) : (
          <p className="candidate-summary-empty">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}
