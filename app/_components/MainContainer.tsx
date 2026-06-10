import type { ReactNode } from "react";

type MainContainerProps = {
  children: ReactNode;
  labelledBy?: string;
};

export function MainContainer({ children, labelledBy }: MainContainerProps) {
  return (
    <main className="main-container" aria-labelledby={labelledBy}>
      {children}
    </main>
  );
}
