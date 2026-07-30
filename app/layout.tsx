import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "SOLE//MATRIX", description: "スニーカーの好みと候補を整理する購入判断サポートです。" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <a className="skip-to-content" href="#main-content">本文へ移動</a>
        {children}
      </body>
    </html>
  );
}
