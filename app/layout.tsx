import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "SOLE//MATRIX",
  description: "Web UI setup check for SOLE//MATRIX Core v0.1.",
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
