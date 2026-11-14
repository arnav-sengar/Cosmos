import type { Metadata } from "next";

import AccordionSpecimen from "./accordion-specimen";

export const metadata: Metadata = {
  title: "Accordion | Cosmos Design System",
  description:
    "Accordion component examples and interaction patterns in the Cosmos design system.",
};

export default function AccordionPage() {
  return <AccordionSpecimen />;
}
