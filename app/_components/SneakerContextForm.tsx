import {
  DISLIKED_SIGNAL_OPTIONS,
  PURCHASE_PURPOSE_OPTIONS,
  parseContextListInput,
  type UserSneakerContext,
} from "../_lib/diagnosis/sneakerContext";

export function SneakerContextForm({
  context,
  onChange,
  onContinue,
}: {
  context: UserSneakerContext;
  onChange: (context: UserSneakerContext) => void;
  onContinue: () => void;
}) {
  return (
    <section className="diagnosis-context" aria-labelledby="diagnosis-context-title">
      <p className="diagnosis-summary-kicker">購入コンテキスト</p>
      <h3 id="diagnosis-context-title">今回探しているのは？</h3>
      <p>11問の好みは変えず、今回の買い方だけを推薦の重みに反映します。</p>
      <div className="diagnosis-purpose-options">
        {PURCHASE_PURPOSE_OPTIONS.map((option) => {
          const selected = context.purchasePurpose === option.id;
          return (
            <button
              aria-pressed={selected}
              className="diagnosis-purpose-button"
              data-selected={selected ? "true" : "false"}
              key={option.id}
              onClick={() => onChange({ ...context, purchasePurpose: option.id })}
              type="button"
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          );
        })}
      </div>
      <details className="diagnosis-context-optional">
        <summary>持っている靴・避けたい候補を任意で追加</summary>
        <div className="diagnosis-context-fields">
          <label>
            <span>持っている靴</span>
            <textarea
              defaultValue={context.ownedModels.join("\n")}
              maxLength={809}
              onBlur={(event) => onChange({ ...context, ownedModels: parseContextListInput(event.currentTarget.value) })}
              placeholder={"例: PUMA Suede\nConverse All Star Hi"}
            />
            <small>改行または読点区切り・最大10件（各80文字）</small>
          </label>
          <label>
            <span>避けたいモデル</span>
            <textarea
              defaultValue={context.dislikedModels.join("\n")}
              maxLength={809}
              onBlur={(event) => onChange({ ...context, dislikedModels: parseContextListInput(event.currentTarget.value) })}
              placeholder={"例: adidas Samba OG\nNike Air Max 95"}
            />
            <small>未入力でも診断できます。</small>
          </label>
          <fieldset>
            <legend>避けたい傾向</legend>
            <div className="diagnosis-signal-options">
              {DISLIKED_SIGNAL_OPTIONS.map((signal) => {
                const selected = context.dislikedSignals.includes(signal);
                return (
                  <label key={signal}>
                    <input
                      checked={selected}
                      onChange={() => onChange({
                        ...context,
                        dislikedSignals: selected
                          ? context.dislikedSignals.filter((item) => item !== signal)
                          : [...context.dislikedSignals, signal].slice(0, 10),
                      })}
                      type="checkbox"
                    />
                    <span>{signal}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>
      </details>
      <p className="diagnosis-context-note">この情報は診断中だけ利用し、長文プロフィールとして保存しません。ゲストではこのタブの一時保存だけです。</p>
      <button className="diagnosis-primary-button" onClick={onContinue} type="button">11問診断へ進む</button>
    </section>
  );
}
