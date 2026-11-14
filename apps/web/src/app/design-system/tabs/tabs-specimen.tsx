"use client";

import { useState } from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@cosmos/ui";

import styles from "./tabs-specimen.module.css";

export default function TabsSpecimen() {
  const [controlledTab, setControlledTab] = useState("overview");
  const [detailsDisabled, setDetailsDisabled] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(true);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>COSMOS / DESIGN SYSTEM</p>
        <h1 className={styles.title}>Tabs</h1>
        <p className={styles.description}>
          A shared navigation component for switching between related
          views of content.
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Horizontal tabs</h2>
          <p>Default orientation with automatic activation.</p>
        </div>

        <div className={styles.demo}>
          <Tabs defaultValue="overview">
            <TabsList aria-label="Project information">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className={styles.panel}>
                <h3>Overview</h3>
                <p>
                  Explore the essential information about this project.
                  Use the tabs above to move between related sections.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="details">
              <div className={styles.panel}>
                <h3>Details</h3>
                <p>
                  Additional context, specifications, and supporting
                  information belong in this section.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="resources">
              <div className={styles.panel}>
                <h3>Resources</h3>
                <p>
                  Related references, learning materials, and useful
                  resources can be organized here.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Manual activation</h2>
          <p>Arrow keys move focus. Enter or Space activates a tab.</p>
        </div>

        <div className={styles.demo}>
          <Tabs defaultValue="plan" activationMode="manual">
            <TabsList aria-label="Mission planning sections">
              <TabsTrigger value="plan">Mission plan</TabsTrigger>
              <TabsTrigger value="crew">Crew</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="plan">
              <div className={styles.panel}>
                <h3>Mission plan</h3>
                <p>Define the objectives and scope of the mission.</p>
              </div>
            </TabsContent>

            <TabsContent value="crew">
              <div className={styles.panel}>
                <h3>Crew</h3>
                <p>Review the people and responsibilities involved.</p>
              </div>
            </TabsContent>

            <TabsContent value="timeline">
              <div className={styles.panel}>
                <h3>Timeline</h3>
                <p>Review the mission milestones and schedule.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Disabled tab</h2>
          <p>Disabled triggers cannot receive keyboard focus or activation.</p>
        </div>

        <div className={styles.demo}>
          <Tabs defaultValue="available">
            <TabsList aria-label="Availability examples">
              <TabsTrigger value="available">Available</TabsTrigger>
              <TabsTrigger value="upcoming" disabled>
                Coming soon
              </TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>

            <TabsContent value="available">
              <div className={styles.panel}>
                <h3>Available</h3>
                <p>This section is currently accessible.</p>
              </div>
            </TabsContent>

            <TabsContent value="upcoming">
              <div className={styles.panel}>
                <h3>Coming soon</h3>
                <p>This section is not currently available.</p>
              </div>
            </TabsContent>

            <TabsContent value="archived">
              <div className={styles.panel}>
                <h3>Archived</h3>
                <p>Previously available information is stored here.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Vertical tabs</h2>
          <p>For layouts where navigation sits beside the content.</p>
        </div>

        <div className={styles.demo}>
          <Tabs defaultValue="earth" orientation="vertical">
            <TabsList aria-label="Planet information">
              <TabsTrigger value="earth">Earth</TabsTrigger>
              <TabsTrigger value="mars">Mars</TabsTrigger>
              <TabsTrigger value="jupiter">Jupiter</TabsTrigger>
            </TabsList>

            <TabsContent value="earth">
              <div className={styles.panel}>
                <h3>Earth</h3>
                <p>Our home planet, the third planet from the Sun.</p>
              </div>
            </TabsContent>

            <TabsContent value="mars">
              <div className={styles.panel}>
                <h3>Mars</h3>
                <p>The red planet, with a landscape shaped by ancient water.</p>
              </div>
            </TabsContent>

            <TabsContent value="jupiter">
              <div className={styles.panel}>
                <h3>Jupiter</h3>
                <p>The largest planet in our Solar System.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Dynamic tab changes</h2>
          <p>
            Test selection fallback when the selected tab is disabled or removed.
          </p>
        </div>

        <div className={styles.demo}>
          <div className={styles.testControls}>
            <button
              type="button"
              className={styles.testButton}
              onClick={() => setDetailsDisabled((current) => !current)}
            >
              {detailsDisabled ? "Enable Details" : "Disable Details"}
            </button>

            <button
              type="button"
              className={styles.testButton}
              onClick={() => setDetailsVisible((current) => !current)}
            >
              {detailsVisible ? "Remove Details" : "Restore Details"}
            </button>
          </div>

          <Tabs defaultValue="overview">
            <TabsList aria-label="Dynamic tab examples">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {detailsVisible && (
                <TabsTrigger value="details" disabled={detailsDisabled}>
                  Details
                </TabsTrigger>
              )}
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className={styles.panel}>
                <h3>Overview</h3>
                <p>
                  This is the fallback panel. It should become active when
                  the selected Details tab is disabled or removed.
                </p>
              </div>
            </TabsContent>

            {detailsVisible && (
              <TabsContent value="details">
                <div className={styles.panel}>
                  <h3>Details</h3>
                  <p>
                    Select this tab, then disable or remove it to test
                    automatic selection fallback.
                  </p>
                </div>
              </TabsContent>
            )}

            <TabsContent value="resources">
              <div className={styles.panel}>
                <h3>Resources</h3>
                <p>This tab remains available during both tests.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Controlled tabs</h2>
          <p>The parent component owns the selected value.</p>
        </div>

        <div className={styles.demo}>
          <div className={styles.controlledHeader}>
            <span className={styles.stateLabel}>Selected value</span>
            <code className={styles.stateValue}>{controlledTab}</code>
          </div>

          <Tabs
            value={controlledTab}
            onValueChange={setControlledTab}
          >
            <TabsList aria-label="Controlled sections">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="specifications">
                Specifications
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className={styles.panel}>
                <h3>Overview</h3>
                <p>The parent currently controls this selected section.</p>
              </div>
            </TabsContent>

            <TabsContent value="specifications">
              <div className={styles.panel}>
                <h3>Specifications</h3>
                <p>Technical details and system specifications.</p>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className={styles.panel}>
                <h3>History</h3>
                <p>Important milestones and historical context.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  );
}
