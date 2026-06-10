import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "SOLE//MATRIX",
  description:
    "スニーカーの好みと候補を静かに整理する購入判断サポートです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
