export function Header() {
  return (
    <header className="site-header">
      <a className="site-brand" href="/">SOLE//MATRIX</a>
      <nav className="site-nav" aria-label="プロダクトナビゲーション">
        <a href="/app?session=guest">診断</a>
        <a href="/onboarding">初回設定</a>
        <a href="/settings">設定</a>
      </nav>
    </header>
  );
}
