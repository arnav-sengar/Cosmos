import type { Metadata } from "next";

import SkeletonSpecimen from "./skeleton-specimen";

export const metadata: Metadata = {
  title: "Skeleton | Cosmos Design System",
  description:
    "Skeleton loading placeholder examples in the Cosmos design system.",
};

export default function SkeletonPage() {
  return <SkeletonSpecimen />;
}
