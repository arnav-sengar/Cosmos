import Link from "next/link";

import styles from "./discovery-hero.module.css";

export function DiscoveryHero() {
  return (
    <section className={styles.hero} aria-labelledby="discovery-title">
      <div className={styles.atmosphere} aria-hidden="true">
        <div className={styles.stars} />
        <div className={styles.nebula} />
        <div className={styles.planetSystem}>
          <div className={styles.orbitOuter} />
          <div className={styles.orbitInner} />
          <div className={styles.planet}>
            <div className={styles.planetSurface} />
            <div className={styles.planetAtmosphere} />
          </div>
          <div className={styles.moon} />
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowLine} />
          <span>AN INFINITE UNIVERSE OF DISCOVERY</span>
        </div>

        <h1 id="discovery-title" className={styles.title}>
          The universe is
          <br />
          closer than
          <br />
          <span className={styles.titleAccent}>you think.</span>
        </h1>

        <p className={styles.description}>
          From the worlds beyond our own to the forces shaping the cosmos,
          discover the science, beauty, and wonder of our universe.
        </p>

        <div className={styles.actions}>
          <Link href="/explore" className={styles.primaryAction}>
            Begin exploring
            <span aria-hidden="true">↗</span>
          </Link>

          <a href="#discover-cosmos" className={styles.secondaryAction}>
            Discover Cosmos
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>

      <div className={styles.footer} aria-hidden="true">
        <span>EVERYTHING BEGINS WITH CURIOSITY</span>
        <span className={styles.scrollIndicator}>
          <span />
          SCROLL TO DISCOVER
        </span>
        <span>01 / 05</span>
      </div>
    </section>
  );
}
