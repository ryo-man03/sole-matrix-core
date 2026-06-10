import type { ReactNode } from "react";

import { FooterNotice } from "./FooterNotice";
import { Header } from "./Header";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <Header />
      {children}
      <FooterNotice />
    </div>
  );
}
