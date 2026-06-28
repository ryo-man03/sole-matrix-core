import { AppShell } from "./_components/AppShell";
import { CandidateSneakerCheckFlow } from "./_components/CandidateSneakerCheckFlow";
import { HomeEntryCard } from "./_components/HomeEntryCard";
import { MainContainer } from "./_components/MainContainer";
import { PreferenceDiagnosisFlow } from "./_components/PreferenceDiagnosisFlow";
import { RecommendationWorkspace } from "./_components/RecommendationWorkspace";

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
    title: "外部サービスが止まっても判定できる",
    description:
      "外部商品データとAI説明は安全な境界から利用し、失敗時はローカル候補とルールベース説明へ戻ります。",
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
            スニーカーの好み・画像・URL・購入リスクをまとめて診断する。
          </h1>
          <p className="home-lead">
            Core v1の判断ロジックを軸に、RyoとBalancedの二つの視点で「買う理由」と「待つ理由」を整理します。
          </p>
          <a className="home-primary-cta" href="#recommendation-workspace">
            <span>判断ワークスペースを開く</span>
            <span aria-hidden="true">→</span>
          </a>
          <p className="home-cta-note">
            予算入力は任意です。外部APIが未設定でも、判定と説明まで完了します。
          </p>
        </section>

        <RecommendationWorkspace />

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
