import { z } from "zod";

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function validateServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "Invalid server environment variables:",
      parsed.error.flatten().fieldErrors
    );

    throw new Error("Server environment validation failed.");
  }

  return parsed.data;
}
