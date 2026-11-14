import type { Metadata } from "next";
import VisualizationSpecimen from "./visualization-specimen";

export const metadata: Metadata = {
  title: "Visualization System",
  description:
    "Internal design-system validation for Cosmos scientific visualizations.",
};

export default function VisualizationPage() {
  return <VisualizationSpecimen />;
}
