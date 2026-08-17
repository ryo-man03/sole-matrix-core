import { AppShell } from "./_components/AppShell";
import { HomeEntryCard } from "./_components/HomeEntryCard";
import { MainContainer } from "./_components/MainContainer";

const entryCards = [
  { eyebrow: "01 / PREFERENCE", title: "11問で好みを整理する", description: "商品を決めていなくても始められます。具体的なモデル名と参考リンクまで表示します。", items: ["11問を1問ずつ進める", "候補を検証してCoreで再評価", "外部API失敗時も具体モデルを提示"], href: "/app?session=guest&path=diagnosis", actionLabel: "スニーカー診断を始める" },
  { eyebrow: "02 / PRODUCT", title: "気になる一足を購入判断する", description: "商品名・URL・画像のいずれかから、買う理由と待つ理由を整理します。", items: ["URL・画像は外部参考情報として分離", "最終DecisionはCoreが決定", "販売・出品情報は結果を見てから手動確認"], href: "/app?session=guest&path=product", actionLabel: "商品判断を始める" },
] as const;

export default function Page() {
  return (
    <AppShell>
      <MainContainer labelledBy="home-title">
        <section className="home-hero home-hero--landing">
          <div className="home-hero-copy">
            <p className="home-kicker">SOLE//MATRIX</p>
            <h1 id="home-title" className="home-title">歴史・素材・服装から、自分に合うスニーカーを整理する。</h1>
            <p className="home-lead">11問の好みと購入目的から候補を整理。気になる一足は、商品名・URL・画像から個別に購入判断できます。</p>
            <div className="home-hero-actions">
              <a className="home-primary-cta" href="/app?session=guest&path=diagnosis"><span>スニーカー診断を始める</span><span aria-hidden="true">→</span></a>
              <a className="home-secondary-cta" href="/app?session=guest&path=product">気になる一足を判断する</a>
            </div>
            <p className="home-cta-note">AIは候補と説明を補助し、最終判断はルールベースのCoreとあなた自身が行います。ログインなしでも試せます。</p>
          </div>
          <aside className="home-hero-ledger" aria-label="推薦で確認できる内容">
            <span className="home-hero-ledger-number">11</span>
            <strong>QUESTIONS / ONE DECISION</strong>
            <dl>
              <div><dt>01</dt><dd>あなたとの相性</dd></div>
              <div><dt>02</dt><dd>Ryoらしい理由</dd></div>
              <div><dt>03</dt><dd>注意したい点</dd></div>
              <div><dt>04</dt><dd>購入候補と外部情報</dd></div>
            </dl>
          </aside>
        </section>

        <section className="entry-section" aria-labelledby="home-capabilities-title">
          <div className="section-heading"><div><p className="home-kicker">Choose your path</p><h2 id="home-capabilities-title">いま必要な入口から。</h2></div><p>どちらから始めても、結果のあとに診断・商品判断を行き来できます。</p></div>
          <div className="entry-grid">{entryCards.map((card) => <HomeEntryCard key={card.title} {...card} items={[...card.items]} />)}</div>
        </section>

        <section className="home-principles" aria-labelledby="home-principles-title">
          <div><p className="home-kicker">What stays human</p><h2 id="home-principles-title">AIの答えではなく、あなたの購入判断をつくる。</h2></div>
          <ol>
            <li><span>Core</span><strong>スコアと最終判断</strong><p>同じ入力には同じルールで答えます。</p></li>
            <li><span>Research</span><strong>候補と説明の補助</strong><p>取得できない場合はfallbackを明示します。</p></li>
            <li><span>Market</span><strong>購入前の外部確認</strong><p>楽天市場・Yahoo!ショッピング・eBayの確認は推薦結果と分離して手動実行します。</p></li>
          </ol>
        </section>

        <aside className="prototype-boundary" aria-labelledby="prototype-boundary-title"><p className="home-entry-eyebrow">Safety boundary</p><h2 id="prototype-boundary-title">最後は、販売元の情報で確認する。</h2><p>参考URLやAI説明は在庫・価格・サイズ・真贋・購入可能性を保証しません。推薦判断と外部情報は画面上でも明確に分けて表示します。</p></aside>
      </MainContainer>
    </AppShell>
  );
}
