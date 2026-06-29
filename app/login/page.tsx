import { AppShell } from "../_components/AppShell";
import { MainContainer } from "../_components/MainContainer";

export const productEntryActions = [
  { href: "/login?intent=login", label: "ログイン", kind: "primary" },
  { href: "/login?intent=signup", label: "新規登録", kind: "secondary" },
  { href: "/app?session=guest", label: "ゲストで試す", kind: "guest" },
] as const;

export default function LoginPage() {
  return (
    <AppShell>
      <MainContainer labelledBy="product-entry-title">
        <section className="product-entry" data-provider-optional="true">
          <div className="product-entry-copy">
            <p className="product-entry-kicker">SOLE//MATRIX</p>
            <h1 id="product-entry-title">
              スニーカー選びを、好み・予算・手持ち・画像・URLから整理する。
            </h1>
            <p>
              買うか迷っている一足を、8つの質問と外部の参考情報から整理します。ログインは必須ではありません。
            </p>
          </div>

          <div className="product-entry-panel" aria-label="利用方法を選択">
            <div className="product-entry-actions">
              {productEntryActions.map((action) => (
                <a
                  className="product-entry-action"
                  data-kind={action.kind}
                  href={action.href}
                  key={action.label}
                >
                  {action.label}
                  <span aria-hidden="true">→</span>
                </a>
              ))}
            </div>
            <p className="product-entry-provider-note">
              認証サービスの設定がない環境でも、ゲスト診断は利用できます。ログインと新規登録は現在準備中です。
            </p>
          </div>

          <aside className="product-entry-storage" aria-labelledby="storage-title">
            <p className="product-entry-kicker">Data policy</p>
            <h2 id="storage-title">保存される情報</h2>
            <ul>
              <li>ゲスト: 診断履歴や個人を特定できる情報は保存しません。</li>
              <li>ログインユーザー: 好み、診断履歴、推薦への評価を本人の記録として保存できます。</li>
              <li>画像、外部APIの生レスポンス、APIキーは保存しません。</li>
            </ul>
          </aside>
        </section>
      </MainContainer>
    </AppShell>
  );
}
