import type { CandidateTagId } from "../_data/candidateSneakerOptions";

import { CandidateCheckSummary } from "./CandidateCheckSummary";

type CandidateConfirmStepProps = {
  sneakerName: string;
  brand: string;
  seenPriceText: string;
  budgetText: string;
  memo: string;
  selectedTagIds: CandidateTagId[];
  isSummaryVisible: boolean;
  onEditBasicInfo: () => void;
  onEditTags: () => void;
  onConfirm: () => void;
};

export function CandidateConfirmStep({
  sneakerName,
  brand,
  seenPriceText,
  budgetText,
  memo,
  selectedTagIds,
  isSummaryVisible,
  onEditBasicInfo,
  onEditTags,
  onConfirm,
}: CandidateConfirmStepProps) {
  return (
    <div className="candidate-card">
      <div className="candidate-card-heading">
        <p className="candidate-step-kicker">Step 3</p>
        <h3>入力内容の確認</h3>
        <p>
          ここでは入力した内容を見直すだけです。好み診断や推薦結果とはまだ接続していません。
        </p>
      </div>

      <CandidateCheckSummary
        brand={brand}
        budgetText={budgetText}
        memo={memo}
        seenPriceText={seenPriceText}
        selectedTagIds={selectedTagIds}
        sneakerName={sneakerName}
      />

      <div className="candidate-summary-notes">
        <p>この金額は市場価格ではなく、ユーザー入力です。</p>
        <p>この内容はまだ購入判断には使われません。</p>
        <p>好み診断結果との接続は後続の整理で行います。</p>
      </div>

      {isSummaryVisible ? (
        <p className="candidate-complete-message" aria-live="polite">
          入力内容を確認しました。修正したい場合は編集に戻れます。
        </p>
      ) : null}

      <div className="candidate-edit-actions">
        <button
          className="candidate-secondary-button"
          onClick={onEditBasicInfo}
          type="button"
        >
          基本情報を編集
        </button>
        <button
          className="candidate-secondary-button"
          onClick={onEditTags}
          type="button"
        >
          特徴タグを編集
        </button>
        <button
          className="candidate-primary-button"
          onClick={onConfirm}
          type="button"
        >
          入力内容を確認する
        </button>
      </div>
    </div>
  );
}
