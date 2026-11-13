"use client";

import { useEffect, useState } from "react";
import styles from "./visualization-specimen.module.css";

type Theme = "deep-space" | "stellar-light";
type VisualizationMode = "standard" | "enhanced" | "monochrome";

const series = [
  { id: "01", label: "Mercury", shape: "circle", dash: "" },
  { id: "02", label: "Venus", shape: "square", dash: "8 4" },
  { id: "03", label: "Earth", shape: "triangle", dash: "2 3" },
  { id: "04", label: "Mars", shape: "diamond", dash: "8 3 2 3" },
  { id: "05", label: "Jupiter", shape: "pentagon", dash: "10 4" },
  { id: "06", label: "Saturn", shape: "hexagon", dash: "2 2" },
  { id: "07", label: "Uranus", shape: "cross", dash: "8 3 2 3 2 3" },
  { id: "08", label: "Neptune", shape: "plus", dash: "4 2 1 2 1 2" },
] as const;

const sequentialSteps = Array.from({ length: 7 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);

const divergingSteps = Array.from({ length: 7 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);

function Marker({
  shape,
  x,
  y,
  size = 5,
}: {
  shape: string;
  x: number;
  y: number;
  size?: number;
}) {
  const common = {
    fill: "var(--viz-chart-surface)",
    stroke: "currentColor",
    strokeWidth: "var(--viz-chart-marker-outline-width)",
  };

  switch (shape) {
    case "square":
      return (
        <rect
          {...common}
          x={x - size}
          y={y - size}
          width={size * 2}
          height={size * 2}
        />
      );

    case "triangle":
      return (
        <path
          {...common}
          d={`M ${x} ${y - size - 1} L ${x + size} ${y + size} L ${x - size} ${y + size} Z`}
        />
      );

    case "diamond":
      return (
        <path
          {...common}
          d={`M ${x} ${y - size - 1} L ${x + size} ${y} L ${x} ${y + size + 1} L ${x - size} ${y} Z`}
        />
      );

    case "pentagon":
    case "hexagon": {
      const sides = shape === "pentagon" ? 5 : 6;
      const points = Array.from({ length: sides }, (_, index) => {
        const angle = (Math.PI * 2 * index) / sides - Math.PI / 2;
        return `${x + Math.cos(angle) * size},${y + Math.sin(angle) * size}`;
      }).join(" ");

      return <polygon {...common} points={points} />;
    }

    case "cross":
      return (
        <path
          d={`M ${x - size} ${y - size} L ${x + size} ${y + size} M ${x + size} ${y - size} L ${x - size} ${y + size}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="var(--viz-chart-marker-outline-width)"
          strokeLinecap="round"
        />
      );

    case "plus":
      return (
        <path
          d={`M ${x - size} ${y} L ${x + size} ${y} M ${x} ${y - size} L ${x} ${y + size}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="var(--viz-chart-marker-outline-width)"
          strokeLinecap="round"
        />
      );

    default:
      return <circle {...common} cx={x} cy={y} r={size} />;
  }
}

function SeriesChart({ mode }: { mode: VisualizationMode }) {
  const points = [
    [36, 148],
    [100, 115],
    [164, 126],
    [228, 82],
    [292, 98],
    [356, 54],
    [420, 68],
  ];

  return (
    <svg
      className={styles.chart}
      viewBox="0 0 456 190"
      role="img"
      aria-labelledby="series-chart-title series-chart-description"
    >
      <title id="series-chart-title">Eight-series differentiation chart</title>
      <desc id="series-chart-description">
        Eight scientific data series use distinct colours, marker shapes and
        line patterns.
      </desc>

      {[40, 80, 120, 160].map((y) => (
        <line
          key={y}
          x1="36"
          x2="436"
          y1={y}
          y2={y}
          className={styles.gridLine}
        />
      ))}

      <line x1="36" y1="20" x2="36" y2="160" className={styles.axisLine} />
      <line x1="36" y1="160" x2="436" y2="160" className={styles.axisLine} />

      {series.map((item, index) => {
        const offset = index * 3.5;
        const coordinates = points.map(([x, y], pointIndex) => {
          const adjustedY =
            y + offset + Math.sin((pointIndex + index) * 0.9) * 9;

          return `${x},${adjustedY}`;
        });

        return (
          <g
            key={item.id}
            style={
              {
                color: `var(--viz-color-series-${item.id})`,
              } as React.CSSProperties
            }
          >
            <polyline
              points={coordinates.join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="var(--viz-chart-series-width)"
              strokeDasharray={item.dash || undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {coordinates.map((coordinate, pointIndex) => {
              const [x, y] = coordinate.split(",").map(Number);

              return (
                <Marker
                  key={`${item.id}-${pointIndex}`}
                  shape={item.shape}
                  x={x}
                  y={y}
                  size={mode === "enhanced" ? 5 : mode === "monochrome" ? 4.5 : 3.5}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function PaletteStrip({
  family,
  steps,
}: {
  family: "sequential" | "diverging";
  steps: string[];
}) {
  return (
    <div
      className={styles.paletteStrip}
      role="img"
      aria-label={
        family === "sequential"
          ? "Seven-step sequential color scale from low to high."
          : "Seven-step diverging color scale from negative through neutral to positive."
      }
    >
      {steps.map((step) => (
        <div
          key={step}
          className={styles.paletteSwatch}
          style={{
            background: `var(--viz-color-${family}-${step})`,
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function SpatialDiagram() {
  return (
    <svg
      viewBox="0 0 440 260"
      className={styles.spatialDiagram}
      role="img"
      aria-labelledby="spatial-title spatial-description"
    >
      <title id="spatial-title">Spatial visualization specimen</title>
      <desc id="spatial-description">
        A central celestial body with orbital paths, a trajectory, a selected
        object and a distance measurement.
      </desc>

      <ellipse
        cx="220"
        cy="130"
        rx="172"
        ry="72"
        className={styles.orbit}
      />

      <ellipse
        cx="220"
        cy="130"
        rx="125"
        ry="48"
        transform="rotate(-32 220 130)"
        className={styles.orbit}
      />

      <ellipse
        cx="220"
        cy="130"
        rx="84"
        ry="105"
        transform="rotate(45 220 130)"
        className={styles.referencePlane}
      />

      <path
        d="M 58 175 Q 145 20 290 74 T 386 135"
        className={styles.trajectory}
      />

      <circle cx="220" cy="130" r="25" className={styles.celestialBody} />
      <circle cx="220" cy="130" r="34" className={styles.selectionRing} />
      <circle cx="392" cy="130" r="7" className={styles.spatialObject} />

      <line
        x1="220"
        y1="130"
        x2="392"
        y2="130"
        className={styles.measurement}
      />

      <line
        x1="220"
        y1="120"
        x2="220"
        y2="140"
        className={styles.measurementTick}
      />

      <line
        x1="392"
        y1="120"
        x2="392"
        y2="140"
        className={styles.measurementTick}
      />

      <text x="306" y="116" className={styles.measurementLabel}>
        1.00 AU
      </text>
    </svg>
  );
}

export default function VisualizationSpecimen() {
  const [theme, setTheme] = useState<Theme>("deep-space");
  const [mode, setMode] = useState<VisualizationMode>("standard");

  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.dataset.theme;

    root.dataset.theme = theme;

    return () => {
      if (root.dataset.theme !== theme) return;

      if (previousTheme) {
        root.dataset.theme = previousTheme;
      } else {
        delete root.dataset.theme;
      }
    };
  }, [theme]);

  return (
    <main className={styles.page} data-visualization-mode={mode}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>COSMOS / DESIGN SYSTEM</p>
          <h1>Visualization laboratory</h1>
          <p className={styles.intro}>
            A visual validation environment for scientific charts, spatial
            representations and accessible data encoding.
          </p>
        </div>

        <div className={styles.controls}>
          <fieldset className={styles.controlGroup}>
            <legend>Theme</legend>

            <button
              type="button"
              aria-pressed={theme === "deep-space"}
              onClick={() => setTheme("deep-space")}
            >
              Deep Space
            </button>

            <button
              type="button"
              aria-pressed={theme === "stellar-light"}
              onClick={() => setTheme("stellar-light")}
            >
              Stellar Light
            </button>
          </fieldset>

          <fieldset className={styles.controlGroup}>
            <legend>Visualization mode</legend>

            {(["standard", "enhanced", "monochrome"] as const).map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={mode === value}
                  onClick={() => setMode(value)}
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </button>
              ),
            )}
          </fieldset>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="series-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>01 / CATEGORICAL ENCODING</p>
            <h2 id="series-heading">Eight independent data series</h2>
          </div>
          <span className={styles.meta}>8 SERIES / 8 IDENTITIES</span>
        </div>

        <div className={styles.panel}>
          <SeriesChart mode={mode} />

          <div className={styles.legend}>
            {series.map((item) => (
              <div className={styles.legendItem} key={item.id}>
                <span
                  className={styles.legendMarker}
                  style={{
                    color: `var(--viz-color-series-${item.id})`,
                  }}
                >
                  <svg
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <Marker shape={item.shape} x={10} y={10} size={5} />
                  </svg>
                </span>

                <span>{item.label}</span>
                <span className={styles.legendCode}>{item.id}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="scale-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>02 / CONTINUOUS DATA</p>
            <h2 id="scale-heading">Sequential and diverging scales</h2>
          </div>
        </div>

        <div className={styles.paletteGrid}>
          <div className={styles.panel}>
            <h3>Sequential</h3>
            <p className={styles.description}>
              Ordered values from lower to higher magnitude.
            </p>
            <PaletteStrip family="sequential" steps={sequentialSteps} />
            <div className={styles.scaleLabels}>
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          <div className={styles.panel}>
            <h3>Diverging</h3>
            <p className={styles.description}>
              Values diverging around a neutral midpoint.
            </p>
            <PaletteStrip family="diverging" steps={divergingSteps} />
            <div className={styles.scaleLabels}>
              <span>Negative</span>
              <span>Neutral</span>
              <span>Positive</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="spatial-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>03 / SPATIAL ENCODING</p>
            <h2 id="spatial-heading">Orbital and spatial references</h2>
          </div>
        </div>

        <div className={styles.panel}>
          <SpatialDiagram />
          <p className={styles.description}>
            Illustrative geometry only. Orbital shapes and distances here are
            not a physically accurate model.
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        COSMOS DESIGN SYSTEM | VISUALIZATION TOKENS | INTERNAL VALIDATION
      </footer>
    </main>
  );
}
