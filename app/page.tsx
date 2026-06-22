import { AppShell } from "./_components/AppShell";
import { CandidateSneakerCheckFlow } from "./_components/CandidateSneakerCheckFlow";
import { HomeEntryCard } from "./_components/HomeEntryCard";
import { MainContainer } from "./_components/MainContainer";
import { PreferenceDiagnosisFlow } from "./_components/PreferenceDiagnosisFlow";

const entryCards = [
  {
    eyebrow: "What this prototype does",
    title: "一足について、順番に整理する",
    description:
      "答えを急がず、気になっている理由や好みを言葉にしていきます。",
    items: [
      "気になる一足の情報を整理する",
      "好みや理由を言葉にする",
      "推薦準備チェックへ進む",
    ],
  },
  {
    eyebrow: "Current boundary",
    title: "今は、情報整理に集中します",
    description:
      "この画面で購入の答えを出すのではなく、次に確認したいことを見つけるための入口です。",
    items: [
      "購入判断を確定しない",
      "推薦結果・スコア・ランキングを表示しない",
      "入力した内容の整理状態を確認する",
    ],
  },
];

export default function Page() {
  return (
    <AppShell>
      <MainContainer labelledBy="home-title">
        <section className="home-hero">
          <p className="home-kicker">SOLE//MATRIX</p>
          <h1 id="home-title" className="home-title">
            買う前に、気持ちと理由を整える。
          </h1>
          <p className="home-lead">
            今は購入判断ではなく、気になる一足の情報整理に集中します。
          </p>
          <a className="home-primary-cta" href="#candidate-flow">
            <span>気になる一足を整理する</span>
            <span aria-hidden="true">→</span>
          </a>
          <p className="home-cta-note">
            入力後は、推薦に進む前の準備状態を確認できます。
          </p>
        </section>

        <section className="entry-section" aria-label="このプロトタイプについて">
          <div className="entry-grid">
            {entryCards.map((card) => (
              <HomeEntryCard
                key={card.title}
                eyebrow={card.eyebrow}
                title={card.title}
                description={card.description}
                items={card.items}
              />
            ))}
          </div>
        </section>

        <PreferenceDiagnosisFlow />
        <div id="candidate-flow" className="candidate-flow-anchor">
          <CandidateSneakerCheckFlow />
        </div>
      </MainContainer>
    </AppShell>
  );
}
