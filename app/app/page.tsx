import { AppShell } from "../_components/AppShell";
import { MainContainer } from "../_components/MainContainer";
import { RecommendationWorkspace } from "../_components/RecommendationWorkspace";

export default function ProductAppPage() {
  return (
    <AppShell>
      <MainContainer labelledBy="product-app-title">
        <header className="product-app-heading">
          <p className="home-kicker">SOLE//MATRIX / PRODUCT BETA</p>
          <h1 id="product-app-title">迷っている一足を、判断できる材料に。</h1>
          <p>
            ゲストでも1回の診断を試せます。ログインは必須ではありません。
          </p>
        </header>
        <RecommendationWorkspace />
      </MainContainer>
    </AppShell>
  );
}
