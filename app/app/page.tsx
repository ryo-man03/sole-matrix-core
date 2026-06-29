import { AppShell } from "../_components/AppShell";
import { MainContainer } from "../_components/MainContainer";
import { ProductSessionBoundary } from "../_components/ProductSessionBoundary";

export default function ProductAppPage() {
  return (
    <AppShell>
      <MainContainer labelledBy="product-app-title">
        <a className="back-home-link" href="/">← ホームに戻る</a>
        <header className="product-app-heading">
          <p className="home-kicker">SOLE//MATRIX / WORKSPACE</p>
          <h1 id="product-app-title">今日は何をしますか？</h1>
          <p>
            好みを整理する診断と、気になる一足の購入判断を分けて進めます。
            選んだ機能だけが画面に表示されます。
          </p>
        </header>
        <ProductSessionBoundary />
      </MainContainer>
    </AppShell>
  );
}
