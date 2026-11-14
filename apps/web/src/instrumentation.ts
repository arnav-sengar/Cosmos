export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateServerEnv } = await import("./config/env/schema");

    validateServerEnv();
  }
}
