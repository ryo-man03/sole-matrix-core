import { AppShell } from "./_components/AppShell";
import { HomeEntryCard } from "./_components/HomeEntryCard";
import { MainContainer } from "./_components/MainContainer";

const entryCards = [
  {
    eyebrow: "01 / PREFERENCE",
    title: "8問で、自分の好みを整理する",
    description:
      "スニーカー名やURLがなくても始められます。直感で答えながら、好みの軸を言葉とスコアに整理します。",
    items: ["8問を一問ずつ進める", "回答はいつでも戻って変更", "結果から商品判断へ進める"],
  },
  {
    eyebrow: "02 / PRODUCT",
    title: "気になる一足の購入判断を整理する",
    description:
      "商品名・URL・画像・予算を手がかりに、買う理由と待つ理由を分けて確認できます。",
    items: ["URLは外部の参考情報として確認", "商品参考リンクを結果後に表示", "価格・在庫・購入可否は保証しない"],
  },
] as const;

export default function Page() {
  return (
    <AppShell>
      <MainContainer labelledBy="home-title">
        <section className="home-hero home-hero--landing">
          <p className="home-kicker">SOLE//MATRIX</p>
          <h1 id="home-title" className="home-title">
            迷っている一足を、<br />買う前に整理する。
          </h1>
          <p className="home-lead">
            好みの8問診断と、商品・URL・画像を使った購入判断を、必要な方から始められます。
            Coreの判定と外部の参考情報を分けて表示します。
          </p>
          <a className="home-primary-cta" href="/login">
            <span>はじめる</span>
            <span aria-hidden="true">→</span>
          </a>
          <p className="home-cta-note">
            アカウントなしのゲスト利用に対応しています。入力した商品URLは保存しません。
          </p>
        </section>

        <section className="entry-section" aria-labelledby="home-capabilities-title">
          <div className="section-heading">
            <p className="home-kicker">Choose your path</p>
            <h2 id="home-capabilities-title">今日したいことから選べます。</h2>
          </div>
          <div className="entry-grid">
            {entryCards.map((card) => (
              <HomeEntryCard
                key={card.title}
                eyebrow={card.eyebrow}
                title={card.title}
                description={card.description}
                items={[...card.items]}
              />
            ))}
          </div>
        </section>

        <aside className="prototype-boundary" aria-labelledby="prototype-boundary-title">
          <p className="home-entry-eyebrow">Prototype boundary</p>
          <h2 id="prototype-boundary-title">このプロトタイプについて</h2>
          <p>
            推薦は判断を補助するもので、価格・在庫・サイズ・購入可能性を保証しません。
            外部サービスが利用できない場合も、ローカルの判定経路を継続します。
          </p>
        </aside>
      </MainContainer>
    </AppShell>
  );
}
