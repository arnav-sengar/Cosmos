import "server-only";

import { serverEnv } from "./env/server";

export const runtimeConfig = {
  environment: serverEnv.NODE_ENV,
  isDevelopment: serverEnv.NODE_ENV === "development",
  isProduction: serverEnv.NODE_ENV === "production",
  isTest: serverEnv.NODE_ENV === "test",
} as const;
