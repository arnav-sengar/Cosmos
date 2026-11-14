import { resolve } from "node:path";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

const workspaceRoot = resolve(import.meta.dirname, "../..");

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    basePath: workspaceRoot,
    files: [
      "apps/web/src/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}",
      "packages/*/src/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}",
    ],
    plugins: {
      boundaries,
    },
    settings: {
      "boundaries/root-path": workspaceRoot,
      "boundaries/include": [
        "apps/web/src/**/*",
        "packages/*/src/**/*",
      ],
      "boundaries/elements": [
        {
          type: "app",
          pattern: "apps/web/src/app",
          partialMatch: false,
        },
        {
          type: "feature",
          pattern: "apps/web/src/features/*",
          capture: ["featureName"],
          partialMatch: false,
        },
        {
          type: "shared-component",
          pattern: "apps/web/src/components",
          partialMatch: false,
        },
        {
          type: "infrastructure",
          pattern: "apps/web/src/lib",
          partialMatch: false,
        },
        {
          type: "integration",
          pattern: "apps/web/src/services",
          partialMatch: false,
        },
        {
          type: "shared-hook",
          pattern: "apps/web/src/hooks",
          partialMatch: false,
        },
        {
          type: "shared-store",
          pattern: "apps/web/src/stores",
          partialMatch: false,
        },
        {
          type: "shared-types",
          pattern: "apps/web/src/types",
          partialMatch: false,
        },
        {
          type: "app-config",
          pattern: "apps/web/src/config",
          partialMatch: false,
        },
        {
          type: "design-tokens",
          pattern: "packages/design-tokens",
          partialMatch: false,
        },
        {
          type: "ui-package",
          pattern: "packages/ui",
          partialMatch: false,
        },
        {
          type: "types-package",
          pattern: "packages/types",
          partialMatch: false,
        },
        {
          type: "config-package",
          pattern: "packages/config",
          partialMatch: false,
        },
      ],
      "boundaries/files": [
        {
          category: "bootstrap",
          pattern: "apps/web/src/instrumentation.ts",
        },
      ],
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: resolve(import.meta.dirname, "tsconfig.json"),
        },
      },
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "allow",
          policies: [
            // Framework bootstrap may depend on configuration, not application modules.
            {
              from: { file: { categories: "bootstrap" } },
              disallow: {
                to: {
                  element: {
                    types: [
                      "app",
                      "feature",
                      "shared-component",
                      "infrastructure",
                      "integration",
                      "shared-hook",
                      "shared-store",
                    ],
                  },
                },
              },
            },

            // App routes may access features only through public entry points.
            {
              from: { element: { type: "app" } },
              disallow: {
                to: { element: { type: "feature" } },
              },
            },
            {
              from: { element: { type: "app" } },
              allow: {
                to: {
                  element: {
                    type: "feature",
                    fileInternalPath: "index.ts",
                  },
                },
              },
            },

            // Features may not depend on another feature's internals.
            {
              from: { element: { type: "feature" } },
              disallow: {
                to: { element: { type: "feature" } },
              },
            },
            {
              from: { element: { type: "feature" } },
              allow: {
                to: {
                  element: {
                    type: "feature",
                    fileInternalPath: "index.ts",
                  },
                },
              },
            },
            {
              from: { element: { type: "feature" } },
              disallow: {
                to: { element: { type: "app" } },
              },
            },

            // Shared presentation must not depend on routes or features.
            {
              from: { element: { type: "shared-component" } },
              disallow: {
                to: {
                  element: {
                    types: ["app", "feature"],
                  },
                },
              },
            },

            // Infrastructure must remain independent of higher-level layers.
            {
              from: { element: { type: "infrastructure" } },
              disallow: {
                to: {
                  element: {
                    types: [
                      "app",
                      "feature",
                      "shared-component",
                      "integration",
                      "shared-hook",
                      "shared-store",
                    ],
                  },
                },
              },
            },

            // Shared integrations must not depend on application features or UI.
            {
              from: { element: { type: "integration" } },
              disallow: {
                to: {
                  element: {
                    types: ["app", "feature", "shared-component"],
                  },
                },
              },
            },

            // Shared hooks must not depend on application-specific layers.
            {
              from: { element: { type: "shared-hook" } },
              disallow: {
                to: {
                  element: {
                    types: [
                      "app",
                      "feature",
                      "shared-component",
                      "integration",
                    ],
                  },
                },
              },
            },

            // Shared stores must not depend on routes, features or presentation.
            {
              from: { element: { type: "shared-store" } },
              disallow: {
                to: {
                  element: {
                    types: [
                      "app",
                      "feature",
                      "shared-component",
                      "shared-hook",
                      "integration",
                    ],
                  },
                },
              },
            },

            // Shared types remain independent of runtime application layers.
            {
              from: { element: { type: "shared-types" } },
              disallow: {
                to: {
                  element: {
                    types: [
                      "app",
                      "feature",
                      "shared-component",
                      "infrastructure",
                      "integration",
                      "shared-hook",
                      "shared-store",
                      "app-config",
                    ],
                  },
                },
              },
            },

            // App configuration must not depend on application implementations.
            {
              from: { element: { type: "app-config" } },
              disallow: {
                to: {
                  element: {
                    types: [
                      "app",
                      "feature",
                      "shared-component",
                      "infrastructure",
                      "integration",
                      "shared-hook",
                      "shared-store",
                    ],
                  },
                },
              },
            },

            // Workspace packages must not depend on the web application.
            {
              from: {
                element: {
                  types: [
                    "design-tokens",
                    "ui-package",
                    "types-package",
                    "config-package",
                  ],
                },
              },
              disallow: {
                to: {
                  element: {
                    types: [
                      "app",
                      "feature",
                      "shared-component",
                      "infrastructure",
                      "integration",
                      "shared-hook",
                      "shared-store",
                      "shared-types",
                      "app-config",
                    ],
                  },
                },
              },
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;