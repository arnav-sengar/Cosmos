import type { Metadata } from "next";

import { appConfig } from "./app";

export const appMetadata: Metadata = {
  applicationName: appConfig.name,
  title: {
    default: appConfig.name,
    template: `%s | ${appConfig.name}`,
  },
  description: appConfig.description,
  openGraph: {
    type: "website",
    siteName: appConfig.name,
    title: appConfig.name,
    description: appConfig.description,
  },
};
