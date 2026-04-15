/** Server / Edge: prefer private env; browser uses NEXT_PUBLIC_SENTRY_DSN in sentry.client.config.ts. */
export function serverSentryDsn(): string | undefined {
  const dsn = process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()
  return dsn || undefined
}

export function baseSentryOptions() {
  const dsn = serverSentryDsn()
  return {
    dsn,
    enabled: Boolean(dsn),
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  }
}
