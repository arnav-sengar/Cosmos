import "server-only";

import { validateServerEnv } from "./schema";

export const serverEnv = validateServerEnv();
