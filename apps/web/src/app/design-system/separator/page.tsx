import type { Metadata } from "next";

import SeparatorSpecimen from "./separator-specimen";

export const metadata: Metadata = {
  title: "Separator | Cosmos Design System",
  description:
    "Separator component examples and accessibility patterns in the Cosmos design system.",
};

export default function SeparatorPage() {
  return <SeparatorSpecimen />;
}
