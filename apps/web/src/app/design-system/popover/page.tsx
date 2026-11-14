import type { Metadata } from "next";

import PopoverSpecimen from "./popover-specimen";

export const metadata: Metadata = {
  title: "Popover | Cosmos Design System",
  description:
    "Interactive specimen for the Cosmos shared Popover component.",
};

export default function PopoverPage() {
  return <PopoverSpecimen />;
}