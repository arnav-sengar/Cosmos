import {
  DiscoveryHero,
  DiscoveryPillars,
  FeaturedDiscovery,
} from "../../features/discovery";

export default function Home() {
  return (
    <main id="main-content" className="flex flex-1 flex-col">
      <DiscoveryHero />
      <DiscoveryPillars />
      <FeaturedDiscovery />
    </main>
  );
}
