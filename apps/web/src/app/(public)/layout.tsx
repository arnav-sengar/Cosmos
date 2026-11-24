import type { ReactNode } from "react";

import { PublicNavigation } from "../../components/public-navigation/public-navigation";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({
  children,
}: PublicLayoutProps) {
  return (
    <>
      <PublicNavigation />

      <div className="flex flex-1 flex-col">
        {children}
      </div>
    </>
  );
}
