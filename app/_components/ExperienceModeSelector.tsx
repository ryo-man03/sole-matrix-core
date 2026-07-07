"use client";

export type ExperienceMode = "diagnosis" | "product";

type ExperienceModeSelectorProps = {
  hasDiagnosisResult: boolean;
  onSelect: (mode: ExperienceMode) => void;
};

const modes = [
  {
    id: "diagnosis",
    eyebrow: "A / PREFERENCE",
    title: "11問診断で好みを整理する",
    description:
      "商品を決めていなくても始められます。11の質問を1問ずつ進み、好みの傾向を整理します。",
    details: [
      "スニーカー名やURLがなくても始められる",
      "戻る / 次へで1問ずつ進める",
      "完了後におすすめモデルと参考リンクを表示する",
    ],
    cta: "11問診断を始める",
  },
  {
    id: "product",
    eyebrow: "B / PRODUCT",
    title: "商品・URL・画像から購入判断する",
    description:
      "買うか迷っている一足について、商品名・URL・画像・予算を使って判断材料を整理します。",
    details: [
      "商品名・URL・画像のいずれかで始められる",
      "URLは外部参考情報として扱う",
      "結果後に商品参考リンクを表示する",
    ],
    cta: "一足の購入判断へ進む",
  },
] as const;

export function ExperienceModeSelector({
  hasDiagnosisResult,
  onSelect,
}: ExperienceModeSelectorProps) {
  return (
    <section
      className="experience-selector"
      aria-labelledby="experience-selector-title"
    >
      <div className="experience-selector-heading">
        <p className="workspace-kicker">Select a path</p>
        <h2 id="experience-selector-title">まず、利用目的を選んでください。</h2>
        <p>選択後は、その目的に必要な画面だけを表示します。</p>
      </div>

      {hasDiagnosisResult ? (
        <p className="experience-context-note">
          11問診断の結果があります。商品判断を選ぶと、好みの参考情報として引き継げます。
        </p>
      ) : null}

      <div className="experience-mode-grid">
        {modes.map((mode) => (
          <article
            className="experience-mode-card"
            data-mode={mode.id}
            key={mode.id}
          >
            <p>{mode.eyebrow}</p>
            <h3>{mode.title}</h3>
            <span>{mode.description}</span>
            <ul>
              {mode.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            <button onClick={() => onSelect(mode.id)} type="button">
              {mode.cta}
              <span aria-hidden="true">→</span>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
