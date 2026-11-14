import type { Metadata } from "next";

import TabsSpecimen from "./tabs-specimen";

export const metadata: Metadata = {
  title: "Tabs | Cosmos Design System",
  description:
    "Interactive specimen for the Cosmos shared Tabs component.",
};

export default function TabsPage() {
  return <TabsSpecimen />;
}
