import {
  Skeleton,
} from "@cosmos/ui";

import styles from "./skeleton-specimen.module.css";

export default function SkeletonSpecimen() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>COSMOS / DESIGN SYSTEM</p>
        <h1 className={styles.title}>Skeleton</h1>
        <p className={styles.description}>
          A loading placeholder that previews the structure of content
          before it becomes available.
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Text skeletons</h2>
          <p>Represent text content while information is loading.</p>
        </div>

        <div className={styles.demo}>
          <div className={styles.textExamples}>
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="85%" />
            <Skeleton variant="text" width="65%" />
            <Skeleton variant="text" width="45%" />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Circular skeletons</h2>
          <p>Represent avatars and other circular content.</p>
        </div>

        <div className={styles.demo}>
          <div className={styles.circularExamples}>
            <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
            <Skeleton variant="circular" width="3.5rem" height="3.5rem" />
            <Skeleton variant="circular" width="5rem" height="5rem" />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Rectangular skeletons</h2>
          <p>Represent images, cards, and larger content regions.</p>
        </div>

        <div className={styles.demo}>
          <div className={styles.rectangularExamples}>
            <Skeleton variant="rectangular" height="5rem" />
            <Skeleton variant="rectangular" height="8rem" />
            <Skeleton variant="rectangular" height="12rem" />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Article loading layout</h2>
          <p>Combine skeleton primitives to preview a realistic content structure.</p>
        </div>

        <div className={styles.articleCard}>
          <Skeleton variant="rectangular" height="12rem" />

          <div className={styles.articleContent}>
            <Skeleton variant="text" width="35%" height="0.75rem" />

            <Skeleton variant="text" width="75%" height="1.75rem" />

            <div className={styles.articleLines}>
              <Skeleton variant="text" />
              <Skeleton variant="text" />
              <Skeleton variant="text" width="82%" />
            </div>

            <div className={styles.author}>
              <Skeleton
                variant="circular"
                width="2.5rem"
                height="2.5rem"
              />

              <div className={styles.authorDetails}>
                <Skeleton variant="text" width="8rem" />
                <Skeleton variant="text" width="5rem" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
