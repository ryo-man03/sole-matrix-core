import { AppShell } from "../_components/AppShell";
import { MainContainer } from "../_components/MainContainer";

export const productEntryActions = [
  { label: "ログイン", kind: "primary", status: "preparing" },
  { label: "新規登録", kind: "secondary", status: "preparing" },
  {
    href: "/app?session=guest",
    label: "ゲストで試す",
    kind: "guest",
    status: "available",
  },
] as const;

export default function LoginPage() {
  return (
    <AppShell>
      <MainContainer labelledBy="product-entry-title">
        <a className="back-home-link" href="/">← ホームに戻る</a>
        <section className="product-entry" data-provider-optional="true">
          <div className="product-entry-copy">
            <p className="product-entry-kicker">SOLE//MATRIX / ENTRY</p>
            <h1 id="product-entry-title">利用方法を選ぶ</h1>
            <p>
              現在はゲストとして、8問の好み診断と一足の購入判断を試せます。
              入力した商品URLや画像は個人履歴として保存しません。
            </p>
          </div>

          <div className="product-entry-panel" aria-label="利用方法を選択">
            <div className="product-entry-actions">
              {productEntryActions.map((action) =>
                action.status === "available" ? (
                  <a
                    className="product-entry-action"
                    data-kind={action.kind}
                    href={action.href}
                    key={action.label}
                  >
                    <span>
                      <strong>{action.label}</strong>
                      <small>保存なしで1回試せます</small>
                    </span>
                    <span aria-hidden="true">→</span>
                  </a>
                ) : (
                  <div
                    className="product-entry-action"
                    data-availability="preparing"
                    data-kind={action.kind}
                    key={action.label}
                  >
                    <span>
                      <strong>{action.label}</strong>
                      <small>認証連携を準備中</small>
                    </span>
                    <span className="product-entry-badge">準備中</span>
                  </div>
                ),
              )}
            </div>
            <p className="product-entry-provider-note">
              ログインと新規登録は本番認証の設定前です。利用可能な機能として誤認されないよう、現在は操作できません。
            </p>
          </div>

          <aside className="product-entry-storage" aria-labelledby="storage-title">
            <p className="product-entry-kicker">Data policy</p>
            <h2 id="storage-title">保存される情報</h2>
            <ul>
              <li>ゲストの診断履歴と入力した商品URLは個人データとして保存しません。</li>
              <li>推薦への評価は、URLなどを除去した匿名の参考パターンとして扱います。</li>
              <li>画像、外部APIの生レスポンス、APIキーは保存・表示しません。</li>
            </ul>
          </aside>
        </section>
      </MainContainer>
    </AppShell>
  );
}
