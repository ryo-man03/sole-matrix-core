import { AppShell } from "./_components/AppShell";
import { CandidateSneakerCheckFlow } from "./_components/CandidateSneakerCheckFlow";
import { HomeEntryCard } from "./_components/HomeEntryCard";
import { MainContainer } from "./_components/MainContainer";
import { PreferenceDiagnosisFlow } from "./_components/PreferenceDiagnosisFlow";

const entryCards = [
  {
    eyebrow: "What this prototype does",
    title: "診断から、二つの視点で相性を整理する",
    description:
      "8つの質問をPreferenceVectorへ変換し、一般的な相性と個人らしさを別々に計算します。",
    items: [
      "Balanced Score / Ryo Scoreを表示する",
      "CoreがDecisionを決める",
      "理由・注意点・外部API readinessを表示する",
    ],
  },
  {
    eyebrow: "Current boundary",
    title: "外部商品データに依存しないCore v1",
    description:
      "楽天商品データは本線に混ぜず、ローカルの仮候補で安全に推薦フローを確認できます。",
    items: [
      "Geminiは説明文だけを補助する",
      "score / DecisionはTypeScript純粋関数で確定する",
      "Feedbackはmock repositoryへ安全に保存する",
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
            好みの診断から二つのスコアとDecisionを作り、理由と注意点まで安全に表示します。
          </p>
          <a className="home-primary-cta" href="#core-v1">
            <span>Core v1診断を始める</span>
            <span aria-hidden="true">→</span>
          </a>
          <p className="home-cta-note">
            Gemini未設定でも、ルールベースの説明まで完了します。
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
