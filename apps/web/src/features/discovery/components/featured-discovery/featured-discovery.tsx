import Link from "next/link";

import styles from "./featured-discovery.module.css";

export function FeaturedDiscovery() {
  return (
    <section
      className={styles.section}
      aria-labelledby="featured-discovery-title"
    >
      <div className={styles.inner}>
        <div className={styles.visual} aria-hidden="true">
          <div className={styles.visualGlow} />
          <div className={styles.orbit} />
          <div className={styles.moon}>
            <div className={styles.iceSurface} />
            <div className={styles.iceCrack} />
            <div className={styles.iceAtmosphere} />
          </div>
          <div className={styles.visualLabel}>
            <span>JUPITER SYSTEM</span>
            <span>52.1° N · EUROPA</span>
          </div>
          <div className={styles.visualIndex}>01</div>
        </div>

        <div className={styles.content}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowLine} />
            <span>BEYOND THE FAMILIAR</span>
          </div>

          <p className={styles.category}>FEATURED WORLD / OCEAN MOON</p>

          <h2 id="featured-discovery-title" className={styles.title}>
            A hidden ocean,
            <br />
            beneath an
            <br />
            <span>alien sky.</span>
          </h2>

          <p className={styles.description}>
            Beneath Europa’s fractured shell of ice may lie a vast, salty
            ocean. This distant moon of Jupiter offers one of the most
            intriguing places to investigate the conditions that could
            support life beyond Earth.
          </p>

          <div className={styles.facts}>
            <div className={styles.fact}>
              <span className={styles.factLabel}>ORBITAL HOME</span>
              <span className={styles.factValue}>Jupiter</span>
            </div>
            <div className={styles.fact}>
              <span className={styles.factLabel}>WORLD TYPE</span>
              <span className={styles.factValue}>Icy moon</span>
            </div>
            <div className={styles.fact}>
              <span className={styles.factLabel}>WHAT LIES BELOW?</span>
              <span className={styles.factValue}>Possible ocean</span>
            </div>
          </div>

          <Link href="/explore" className={styles.action}>
            Explore Europa
            <span aria-hidden="true">↗</span>
          </Link>

          <p className={styles.disclaimer}>
            An ocean is strongly supported by scientific evidence; its
            properties and potential habitability remain under investigation.
          </p>
        </div>
      </div>
    </section>
  );
}
