import { AppShell } from "./_components/AppShell";
import { CandidateSneakerCheckFlow } from "./_components/CandidateSneakerCheckFlow";
import { HomeEntryCard } from "./_components/HomeEntryCard";
import { MainContainer } from "./_components/MainContainer";
import { PreferenceDiagnosisFlow } from "./_components/PreferenceDiagnosisFlow";

const entryCards = [
  {
    title: "好みを診断する",
    description:
      "履き方や見た目の好みを整理して、自分に合う一足を考えるための軸を作ります。",
    helper: "今は好みを言葉にする入口です。",
  },
  {
    title: "気になる一足をチェックする",
    description:
      "候補の印象や気になる点を、購入前に落ち着いて見直すための入口です。",
    helper: "候補との相性を確認する入口です。",
  },
];

export default function Page() {
  return (
    <AppShell>
      <MainContainer labelledBy="home-title">
        <section className="home-hero">
          <p className="home-kicker">Preference-based sneaker check</p>
          <h1 id="home-title">SOLE//MATRIX</h1>
          <p className="home-lead">
            スニーカーの好みと個性を、価格や販売情報から少し離れて静かに整理するための判断サポートです。
          </p>
        </section>

        <section className="entry-section" aria-label="入口">
          <div className="entry-grid">
            {entryCards.map((card) => (
              <HomeEntryCard
                key={card.title}
                title={card.title}
                description={card.description}
                helper={card.helper}
              />
            ))}
          </div>
          <p className="result-note">
            結果の見方は、後続のResult画面実装で追加予定です。
          </p>
          <p className="diagnosis-entry-note">
            下の診断フローで、まずは好みの方向だけを試せます。
          </p>
          <p className="candidate-entry-note">
            気になる一足の入力も、このページ下部で試せます。
          </p>
        </section>

        <PreferenceDiagnosisFlow />
        <CandidateSneakerCheckFlow />
      </MainContainer>
    </AppShell>
  );
}
