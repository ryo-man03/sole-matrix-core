import type { LiveProductUrl } from "../_lib/product-links/types";

type ProductReferenceLinksProps = {
  links: readonly LiveProductUrl[];
  message: string;
  isLoading: boolean;
};

export function ProductReferenceLinks({
  links,
  message,
  isLoading,
}: ProductReferenceLinksProps) {
  const displayableLinks = links.filter(
    (link) =>
      link.verificationStatus === "verified_live" ||
      link.verificationStatus === "search_fallback",
  );

  return (
    <section
      className="diagnosis-product-links"
      aria-labelledby="diagnosis-product-links-title"
    >
      <p className="diagnosis-summary-kicker">External reference</p>
      <h4 id="diagnosis-product-links-title">商品参考リンク</h4>
      <p className="product-links-boundary">
        参考リンクはCore score・Decision・budgetFitを変更しません。
        価格・在庫・サイズ・購入可能性は保証しません。
      </p>

      {isLoading ? (
        <p className="product-links-status" aria-live="polite">
          安全な参考リンクを確認しています…
        </p>
      ) : displayableLinks.length ? (
        <ul className="product-link-list">
          {displayableLinks.map((link) => (
            <li key={`${link.source}:${link.href}`}>
              <div>
                <strong>{link.label}</strong>
                <span>{link.displayDomain}</span>
              </div>
              <small>
                {link.verificationStatus === "search_fallback"
                  ? "検索リンク（直接商品URLではありません）"
                  : "存在確認済みの参考URL"}
              </small>
              <small>{link.note}</small>
              <a href={link.href} rel="noopener noreferrer" target="_blank">
                外部サイトで確認する
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="product-links-status" aria-live="polite">
          {message}
        </p>
      )}
    </section>
  );
}
