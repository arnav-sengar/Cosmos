"use client";

import {
  Separator,
} from "@cosmos/ui";

import styles from "./separator-specimen.module.css";

export default function SeparatorSpecimen() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>COSMOS / DESIGN SYSTEM</p>
        <h1 className={styles.title}>Separator</h1>
        <p className={styles.description}>
          A visual and semantic divider used to distinguish content groups
          and establish clear structure within an interface.
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Horizontal separator</h2>
          <p>Separates content vertically within a layout.</p>
        </div>

        <div className={styles.demo}>
          <div className={styles.contentGroup}>
            <h3>Overview</h3>
            <p>
              Explore the essential information and context for this section.
            </p>
          </div>

          <Separator />

          <div className={styles.contentGroup}>
            <h3>Additional information</h3>
            <p>
              Supporting details and related information appear below the divider.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Vertical separator</h2>
          <p>Separates adjacent content groups in a horizontal layout.</p>
        </div>

        <div className={styles.demo}>
          <div className={styles.horizontalLayout}>
            <div className={styles.verticalGroup}>
              <h3>Explore</h3>
              <p>Discover astronomical objects and phenomena.</p>
            </div>

            <Separator orientation="vertical" />

            <div className={styles.verticalGroup}>
              <h3>Learn</h3>
              <p>Build knowledge through structured learning.</p>
            </div>

            <Separator orientation="vertical" />

            <div className={styles.verticalGroup}>
              <h3>Research</h3>
              <p>Investigate scientific questions and discoveries.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Decorative separator</h2>
          <p>Used when a divider is purely visual and should be hidden from assistive technology.</p>
        </div>

        <div className={styles.demo}>
          <div className={styles.contentGroup}>
            <h3>Mission control</h3>
            <p>Monitor mission information and current status.</p>
          </div>

          <Separator decorative />

          <div className={styles.contentGroup}>
            <h3>Mission resources</h3>
            <p>Access supporting resources and documentation.</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Semantic separator</h2>
          <p>Exposes separator semantics and orientation to assistive technology.</p>
        </div>

        <div className={styles.demo}>
          <div className={styles.contentGroup}>
            <h3>Scientific observations</h3>
            <p>Review observations collected during the mission.</p>
          </div>

          <Separator />

          <div className={styles.contentGroup}>
            <h3>Research notes</h3>
            <p>Review notes and supporting research material.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
