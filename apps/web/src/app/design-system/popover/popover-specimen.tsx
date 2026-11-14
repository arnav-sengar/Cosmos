"use client";

import { useState } from "react";

import { Popover } from "@cosmos/ui";

import styles from "./popover-specimen.module.css";

export default function PopoverSpecimen() {
  const [controlledOpen, setControlledOpen] = useState(false);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>COSMOS / DESIGN SYSTEM</p>
        <h1 className={styles.title}>Popover</h1>
        <p className={styles.description}>
          A contextual floating surface for supplementary information,
          controls, and related actions.
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Basic popover</h2>
          <p>Click the trigger to open or close the floating surface.</p>
        </div>

        <div className={styles.demo}>
          <Popover
            label="Planet information"
            content={
              <div className={styles.popoverContent}>
                <h3>Mars</h3>
                <p>
                  The fourth planet from the Sun, known for its reddish
                  appearance and ancient river valleys.
                </p>
              </div>
            }
          >
            <button type="button" className={styles.trigger}>
              Explore Mars
            </button>
          </Popover>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Interactive content</h2>
          <p>
            The popover surface should accept clicks, text selection,
            and keyboard interaction.
          </p>
        </div>

        <div className={styles.demo}>
          <Popover
            label="Mission actions"
            content={
              <div className={styles.popoverContent}>
                <h3>Mission controls</h3>
                <p>Select an action to test interaction inside the popover.</p>
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => window.alert("Mission action received.")}
                >
                  Execute action
                </button>
                <a className={styles.contentLink} href="#interactive-content">
                  Read mission details
                </a>
              </div>
            }
          >
            <button type="button" className={styles.trigger}>
              Open mission controls
            </button>
          </Popover>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Placement</h2>
          <p>
            Popovers support top, bottom, left, and right placements,
            including start and end alignment.
          </p>
        </div>

        <div className={styles.placementGrid}>
          {(
            [
              "top",
              "top-start",
              "top-end",
              "bottom",
              "bottom-start",
              "bottom-end",
              "left",
              "left-start",
              "left-end",
              "right",
              "right-start",
              "right-end",
            ] as const
          ).map((placement) => (
            <div className={styles.placementItem} key={placement}>
              <span className={styles.placementLabel}>{placement}</span>
              <Popover
                label={`${placement} placement example`}
                placement={placement}
                content={
                  <div className={styles.popoverContent}>
                    <strong>{placement}</strong>
                    <p>Popover placement preview.</p>
                  </div>
                }
              >
                <button type="button" className={styles.trigger}>
                  Open
                </button>
              </Popover>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Controlled state</h2>
          <p>The parent component owns the open state.</p>
        </div>

        <div className={styles.demo}>
          <div className={styles.controlledHeader}>
            <span className={styles.stateLabel}>Popover state</span>
            <code className={styles.stateValue}>
              {controlledOpen ? "open" : "closed"}
            </code>
          </div>

          <Popover
            label="Controlled popover"
            open={controlledOpen}
            onOpenChange={setControlledOpen}
            content={
              <div className={styles.popoverContent}>
                <h3>Controlled surface</h3>
                <p>
                  Its visibility is synchronized with the parent state.
                </p>
              </div>
            }
          >
            <button type="button" className={styles.trigger}>
              Toggle controlled popover
            </button>
          </Popover>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setControlledOpen((current) => !current)}
          >
            Change state externally
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Disabled popover</h2>
          <p>A disabled popover cannot be opened through its trigger.</p>
        </div>

        <div className={styles.demo}>
          <Popover
            label="Disabled popover"
            disabled
            content={
              <div className={styles.popoverContent}>
                <p>This content should not appear.</p>
              </div>
            }
          >
            <button type="button" className={styles.trigger} disabled>
              Unavailable
            </button>
          </Popover>
        </div>
      </section>
    </main>
  );
}