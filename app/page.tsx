import { AppShell } from "./_components/AppShell";
import { HomeEntryCard } from "./_components/HomeEntryCard";
import { MainContainer } from "./_components/MainContainer";

const entryCards = [
  { eyebrow: "01 / PREFERENCE", title: "11問で好みを整理する", description: "商品を決めていなくても始められます。具体的なモデル名と参考リンクまで表示します。", items: ["11問を1問ずつ進める", "Gemini候補を検証してCoreで再評価", "失敗時も具体モデルのfallbackを表示"] },
  { eyebrow: "02 / PRODUCT", title: "気になる一足を購入判断する", description: "商品名・URL・画像のいずれかから、買う理由と待つ理由を整理します。", items: ["URLは外部参考情報として分離", "Geminiは説明補助、最終DecisionはCore", "具体モデル名から検索リンクを作成"] },
] as const;

export default function Page() {
  return <AppShell><MainContainer labelledBy="home-title"><section className="home-hero home-hero--landing"><p className="home-kicker">SOLE//MATRIX</p><h1 id="home-title" className="home-title">迷っている一足を、<br />買う前に整理する。</h1><p className="home-lead">11問の好み診断と、商品名・URL・画像を使った購入判断を、必要な方から始められます。</p><a className="home-primary-cta" href="/login"><span>はじめる</span><span aria-hidden="true">→</span></a><p className="home-cta-note">ゲストはログインなしで何回でも利用できます。履歴は保存しません。</p></section><section className="entry-section" aria-labelledby="home-capabilities-title"><div className="section-heading"><p className="home-kicker">Choose your path</p><h2 id="home-capabilities-title">今日したいことから選べます。</h2></div><div className="entry-grid">{entryCards.map((card) => <HomeEntryCard key={card.title} eyebrow={card.eyebrow} title={card.title} description={card.description} items={[...card.items]} />)}</div></section><aside className="prototype-boundary" aria-labelledby="prototype-boundary-title"><p className="home-entry-eyebrow">Safety boundary</p><h2 id="prototype-boundary-title">購入前に必ず販売元で確認してください</h2><p>参考URLやAI説明は在庫・価格・サイズ・真贋・購入可能性を保証しません。Core scoreと外部証拠は分離して表示します。</p></aside></MainContainer></AppShell>;
}
