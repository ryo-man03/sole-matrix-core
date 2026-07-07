import { AppShell } from "../_components/AppShell";
import { MainContainer } from "../_components/MainContainer";
import { ProductSessionBoundary } from "../_components/ProductSessionBoundary";

export default function ProductAppPage() {
  return <AppShell><MainContainer labelledBy="product-app-title"><a className="back-home-link" href="/">← ホームに戻る</a><header className="product-app-heading"><p className="home-kicker">SOLE//MATRIX / WORKSPACE</p><h1 id="product-app-title">今日は何をしますか？</h1><p>好みを整理する11問診断と、気になる一足の商品判断を分けて進めます。</p></header><ProductSessionBoundary /></MainContainer></AppShell>;
}
