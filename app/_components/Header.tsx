"use client";

import { usePathname } from "next/navigation";

const navigationItems = [
  { href: "/", label: "ホーム" },
  { href: "/app", label: "診断・商品判断" },
  { href: "/settings", label: "設定" },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <a className="site-brand" href="/" aria-label="SOLE MATRIX ホーム">
        <span>SOLE</span><span aria-hidden="true">//</span><span>MATRIX</span>
      </a>
      <nav className="site-nav" aria-label="プロダクトナビゲーション">
        {navigationItems.map((item) => (
          <a
            aria-current={pathname === item.href ? "page" : undefined}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </a>
        ))}
        <a aria-current={pathname === "/login" ? "page" : undefined} className="site-nav-cta" href="/login">はじめる</a>
      </nav>
    </header>
  );
}
