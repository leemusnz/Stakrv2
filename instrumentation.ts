import * as Sentry from "@sentry/nextjs"

/**
 * Next.js instrumentation hook — runs once per server/edge worker.
 * Loads Sentry when a DSN is configured (see sentry.*.config.ts).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config")
  }
}

/** Next.js App Router: forward RSC / route handler errors to Sentry. */
export const onRequestError = Sentry.captureRequestError
