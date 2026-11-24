import Link from "next/link";

import styles from "./discovery-pillars.module.css";

const pillars = [
  {
    number: "01",
    name: "Explore",
    description:
      "Travel across planets, moons, stars and galaxies. Experience the universe beyond the limits of everyday perception.",
    href: "/explore",
    visual: "explore",
    category: "INTERACTIVE UNIVERSE",
  },
  {
    number: "02",
    name: "Learn",
    description:
      "Turn curiosity into understanding through astronomy, space science and discoveries explained at every level.",
    href: "/learn",
    visual: "learn",
    category: "KNOWLEDGE & EDUCATION",
  },
  {
    number: "03",
    name: "Research",
    description:
      "Go deeper into observations, scientific evidence, datasets and the questions that continue to shape our understanding.",
    href: "/research",
    visual: "research",
    category: "SCIENCE & DISCOVERY",
  },
  {
    number: "04",
    name: "Community",
    description:
      "Share what you discover, exchange ideas and connect with people who look at the universe with the same curiosity.",
    href: "/community",
    visual: "community",
    category: "A SHARED UNIVERSE",
  },
] as const;

export function DiscoveryPillars() {
  return (
    <section
      id="discover-cosmos"
      className={styles.section}
      aria-labelledby="pillars-title"
    >
      <div className={styles.inner}>
        <div className={styles.introduction}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowLine} />
            <span>ONE UNIVERSE. ENDLESS PERSPECTIVES.</span>
          </div>

          <div className={styles.introductionContent}>
            <h2 id="pillars-title" className={styles.title}>
              More than a place
              <br />
              to <span>look at the stars.</span>
            </h2>

            <p className={styles.description}>
              The universe has more than one story to tell. Explore its
              wonders, understand its science, investigate its mysteries and
              discover it alongside others.
            </p>
          </div>
        </div>

        <div className={styles.grid}>
          {pillars.map((pillar) => (
            <Link
              key={pillar.visual}
              href={pillar.href}
              className={styles.card}
              data-visual={pillar.visual}
            >
              <div className={styles.cardVisual} aria-hidden="true">
                <div className={styles.visualOrbit} />
                <div className={styles.visualCore} />
                <div className={styles.visualAccent} />
              </div>

              <div className={styles.cardContent}>
                <div className={styles.cardMeta}>
                  <span>{pillar.number}</span>
                  <span>{pillar.category}</span>
                </div>

                <h3 className={styles.cardTitle}>{pillar.name}</h3>

                <p className={styles.cardDescription}>
                  {pillar.description}
                </p>

                <span className={styles.cardAction}>
                  Discover {pillar.name}
                  <span aria-hidden="true">↗</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
