import { CandidateField } from "./CandidateField";

type CandidateBasicInfoStepProps = {
  sneakerName: string;
  brand: string;
  seenPriceText: string;
  budgetText: string;
  memo: string;
  sneakerNameError: string;
  onSneakerNameChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onSeenPriceTextChange: (value: string) => void;
  onBudgetTextChange: (value: string) => void;
  onMemoChange: (value: string) => void;
};

export function CandidateBasicInfoStep({
  sneakerName,
  brand,
  seenPriceText,
  budgetText,
  memo,
  sneakerNameError,
  onSneakerNameChange,
  onBrandChange,
  onSeenPriceTextChange,
  onBudgetTextChange,
  onMemoChange,
}: CandidateBasicInfoStepProps) {
  return (
    <div className="candidate-card">
      <div className="candidate-card-heading">
        <p className="candidate-step-kicker">Step 1</p>
        <h3>基本情報を入力する</h3>
        <p>
          まずは気になる一足を、覚え書きとして整理します。金額欄は自分が見た金額や予定額のメモです。
        </p>
      </div>

      <div className="candidate-form-grid">
        <CandidateField
          error={sneakerNameError}
          id="candidate-sneaker-name"
          label="スニーカー名"
          onChange={onSneakerNameChange}
          placeholder="例: Air Max 95, Samba OG"
          required
          value={sneakerName}
        />
        <CandidateField
          id="candidate-brand"
          label="ブランド"
          onChange={onBrandChange}
          placeholder="例: Nike, adidas, New Balance"
          value={brand}
        />
        <CandidateField
          helper="入力した文字をそのまま確認画面に表示します。"
          id="candidate-seen-price"
          inputMode="numeric"
          label="見かけた金額・購入予定額"
          onChange={onSeenPriceTextChange}
          placeholder="例: 18000"
          value={seenPriceText}
        />
        <CandidateField
          helper="入力した文字をそのまま確認画面に表示します。"
          id="candidate-budget"
          inputMode="numeric"
          label="予算"
          onChange={onBudgetTextChange}
          placeholder="例: 20000"
          value={budgetText}
        />
        <CandidateField
          id="candidate-memo"
          label="メモ"
          multiline
          onChange={onMemoChange}
          placeholder="例: 前から気になっている、合わせやすそう、形が好き"
          value={memo}
        />
      </div>

      <p className="candidate-notice">
        この金額はユーザー入力です。市場価格や在庫を保証するものではありません。
      </p>
    </div>
  );
}
