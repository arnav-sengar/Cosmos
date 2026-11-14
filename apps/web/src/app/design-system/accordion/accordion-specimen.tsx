"use client";

import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@cosmos/ui";

import styles from "./accordion-specimen.module.css";

export default function AccordionSpecimen() {
  const [controlledValue, setControlledValue] = useState("mission");
  const [detailsVisible, setDetailsVisible] = useState(true);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>COSMOS / DESIGN SYSTEM</p>
        <h1 className={styles.title}>Accordion</h1>
        <p className={styles.description}>
          A disclosure component for organizing related content into
          expandable sections while keeping the interface focused.
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Single collapsible</h2>
          <p>Only one section can remain open, and the open section can be closed.</p>
        </div>

        <div className={styles.demo}>
          <Accordion type="single" collapsible defaultValue="solar-system">
            <AccordionItem value="solar-system">
              <AccordionTrigger>Understanding the Solar System</AccordionTrigger>
              <AccordionContent>
                <div className={styles.panel}>
                  <p>
                    The Solar System consists of the Sun and the objects bound
                    to it by gravity, including eight planets, dwarf planets,
                    moons, asteroids, and comets.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="stars">
              <AccordionTrigger>How stars are formed</AccordionTrigger>
              <AccordionContent>
                <div className={styles.panel}>
                  <p>
                    Stars form within dense regions of molecular clouds.
                    Gravity causes gas and dust to collapse until the core
                    becomes hot and dense enough for nuclear fusion.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="galaxies">
              <AccordionTrigger>Exploring distant galaxies</AccordionTrigger>
              <AccordionContent>
                <div className={styles.panel}>
                  <p>
                    Galaxies are vast systems of stars, gas, dust, and dark
                    matter held together by gravity. They appear in many
                    shapes and sizes across the observable universe.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Single non-collapsible</h2>
          <p>The open section cannot be closed until another section is selected.</p>
        </div>

        <div className={styles.demo}>
          <Accordion type="single" defaultValue="mission">
            <AccordionItem value="mission">
              <AccordionTrigger>Mission objectives</AccordionTrigger>
              <AccordionContent>
                <div className={styles.panel}>
                  <p>
                    Define the scientific objectives, target observations,
                    and success criteria for the mission.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="instruments">
              <AccordionTrigger>Scientific instruments</AccordionTrigger>
              <AccordionContent>
                <div className={styles.panel}>
                  <p>
                    Review the instruments and equipment required to collect
                    scientific observations.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Multiple sections</h2>
          <p>Sections operate independently, and all sections may be closed.</p>
        </div>

        <div className={styles.demo}>
          <Accordion type="multiple" defaultValue={["earth"]}>
            <AccordionItem value="earth">
              <AccordionTrigger>Earth</AccordionTrigger>
              <AccordionContent>
                <div className={styles.panel}>
                  <p>
                    Earth is the third planet from the Sun and the only known
                    world to support life.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="mars">
              <AccordionTrigger>Mars</AccordionTrigger>
              <AccordionContent>
                <div className={styles.panel}>
                  <p>
                    Mars is a cold desert world with a thin atmosphere,
                    ancient river valleys, and the largest volcano in the
                    Solar System.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="jupiter">
              <AccordionTrigger>Jupiter</AccordionTrigger>
              <AccordionContent>
                <div className={styles.panel}>
                  <p>
                    Jupiter is the largest planet in our Solar System. Its
                    atmosphere contains powerful storms, including the
                    centuries-old Great Red Spot.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Disabled items</h2>
          <p>Disabled items cannot be activated.</p>
        </div>

        <div className={styles.demo}>
          <Accordion type="multiple">
            <AccordionItem value="available">
              <AccordionTrigger>Available information</AccordionTrigger>
              <AccordionContent>
                <div className={styles.panel}>
                  <p>This section is currently accessible.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="upcoming" disabled>
              <AccordionTrigger>Upcoming information</AccordionTrigger>
              <AccordionContent>
                <div className={styles.panel}>
                  <p>This content is not currently available.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="archived">
              <AccordionTrigger>Archived information</AccordionTrigger>
              <AccordionContent>
                <div className={styles.panel}>
                  <p>Previously available information is stored here.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Disabled accordion</h2>
          <p>Disabling the root prevents interaction with every item.</p>
        </div>

        <div className={styles.demo}>
          <Accordion type="multiple" defaultValue={["overview"]} disabled>
            <AccordionItem value="overview">
              <AccordionTrigger>System overview</AccordionTrigger>
              <AccordionContent>
                <div className={styles.panel}>
                  <p>
                    This section is open, but its trigger is disabled because
                    the entire accordion is disabled.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="configuration">
              <AccordionTrigger>System configuration</AccordionTrigger>
              <AccordionContent>
                <div className={styles.panel}>
                  <p>Configuration details are not currently interactive.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Dynamic item changes</h2>
          <p>Test how the accordion behaves when an open item is removed.</p>
        </div>

        <div className={styles.demo}>
          <div className={styles.testControls}>
            <button
              type="button"
              className={styles.testButton}
              onClick={() => setDetailsVisible((current) => !current)}
            >
              {detailsVisible ? "Remove Details" : "Restore Details"}
            </button>
          </div>

          <Accordion type="multiple" defaultValue={["overview", "details"]}>
            <AccordionItem value="overview">
              <AccordionTrigger>Overview</AccordionTrigger>
              <AccordionContent>
                <div className={styles.panel}>
                  <p>
                    This section remains available when the Details item
                    is removed.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {detailsVisible && (
              <AccordionItem value="details">
                <AccordionTrigger>Details</AccordionTrigger>
                <AccordionContent>
                  <div className={styles.panel}>
                    <p>
                      Remove this item and restore it to test how the
                      accordion handles dynamic children.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Controlled accordion</h2>
          <p>The parent component owns the currently open section.</p>
        </div>

        <div className={styles.demo}>
          <div className={styles.controlledHeader}>
            <span className={styles.stateLabel}>Selected value</span>
            <code className={styles.stateValue}>
              {controlledValue || "none"}
            </code>
          </div>

          <Accordion
            type="single"
            collapsible
            value={controlledValue}
            onValueChange={(nextValue) => setControlledValue(nextValue ?? "")}
          >
            <AccordionItem value="mission">
              <AccordionTrigger>Mission plan</AccordionTrigger>
              <AccordionContent>
                <div className={styles.panel}>
                  <p>Define the objectives and scope of the mission.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="crew">
              <AccordionTrigger>Crew and responsibilities</AccordionTrigger>
              <AccordionContent>
                <div className={styles.panel}>
                  <p>Review the people and responsibilities involved.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="timeline">
              <AccordionTrigger>Mission timeline</AccordionTrigger>
              <AccordionContent>
                <div className={styles.panel}>
                  <p>Review the mission milestones and schedule.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </main>
  );
}
